import os
from fastapi import FastAPI, Request, UploadFile, File, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dotenv import load_dotenv
from openai import OpenAI
from google import genai

# --- Import ALL your routers ---
from .routers import users
from .routers import problems 

from .database import Base, engine
from . import models

# Importing utility functions
from .utils.agent_tools.openai_agent import Agent
from .utils.agent_tools.gemini_agent import get_agent_code, get_agent_response, routing_agent

# TEMPORARY. Just for the Chat endpoint while we move it
router = APIRouter(
    prefix="/api", 
    tags=["Chat"]
)

app = FastAPI()

# --- Include Routers ---
app.include_router(users.router, prefix="/api")
app.include_router(problems.router)

load_dotenv()

# --- AI Client Setup (Will move to chat router) ---
client_openai = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))
client_gemini = genai.Client(api_key = os.environ.get("GEMINI_API_KEY"))
agent = Agent(openai_client = client_openai)

# --- Middleware ---
# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Agent (Will move to chat router) ---
@app.post("/api/chat")
async def chat_endpoint(request: Request):
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})
    
    # Receive the full history from the client
    conversation_history = data.get("conversation_history")
    if conversation_history is None or not isinstance(conversation_history, list):
        return JSONResponse(status_code=400, content={"error": "A 'conversation_history' array is required."})

    problem_statement = data.get("problem_statement", "")
    lesson_goals = data.get("lesson_goals", "")
    common_mistakes = data.get("common_mistakes", "")

    try:
        # Gemini Agents
        route = routing_agent(client_gemini,
                              conversation_history,
                              history_limit = 10,
                              model_name = "gemini-2.5-flash-lite")
        
        agent_code = None
        if route == "code":
            agent_code = get_agent_code(client_gemini, 
                                        problem_statement, 
                                        lesson_goals, 
                                        common_mistakes,
                                        conversation_history,
                                        notebook_content = "",
                                        history_limit = 15,
                                        model_name = "gemini-2.5-pro",
                                        thinking_budget = 128, # -1
                                        temperature = 0.2)
            
            # Include the new code in the history to create an appropriate message
            agent_code_dict = {"author": "agent", "type": "code", "content": agent_code}
            conversation_history.append(agent_code_dict)

        # Always chat
        agent_response = get_agent_response(client_gemini,
                                            problem_statement,
                                            lesson_goals,
                                            common_mistakes,
                                            conversation_history,
                                            notebook_content = "",
                                            model_name = "gemini-2.5-pro",
                                            thinking_budget = 128, # -1
                                            temperature = 0.7)

        # OpenAI Agent
        # assistant_response = agent.agent_respond(
        #     user_message=user_message,
        #     chat_history=chat_history,
        #     user_code_t0=user_code_t0,
        #     user_code_t1=user_code_t1,
        #     agent_code_t0=agent_code_t0,
        #     agent_code_t1=agent_code_t1,
        #     problem_statement=problem_statement,
        #     model="gpt-4.1-mini", # A cheap model for testing purposes
        # )

        return {
            "author": "agent",
            "content": agent_response.text,
            **({"updated_code": agent_code} if agent_code else {})
        }
        
    except Exception as e:
        print("Agent error:", e)
        return JSONResponse(status_code=500, content={"error": "Agent processing failed"})

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the API!"}