from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

from dotenv import load_dotenv
from utils.parse_problem import load_problem_from_file

from openai import OpenAI
from utils.agent_tools.openai_agent import Agent
from utils.agent_tools.gemini_agent import get_agent_code, get_agent_response
from google import genai

# Importing utility functions
from utils.parse_problem import load_problem, list_all_problems

app = FastAPI()

load_dotenv()

client_openai = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))
client_gemini = genai.Client(api_key = os.environ.get("GEMINI_API_KEY"))
agent = Agent(openai_client = client_openai)

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load one problem
@app.get("/api/problems/{problem_id}")
def get_problem(problem_id: str):
    print(f"API called with problem_id: {problem_id}")
    problem = load_problem(problem_id)
    if not problem:
        return {"error": "Problem not found"}
    return problem

# List problems
@app.get("/api/problems")
def list_problems():
    return list_all_problems()

# AI Agent
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
        # TODO: Router agent which decide if the agent needs to code or just answer.
        
        # Gemini Agents
        agent_code = get_agent_code(client_gemini, 
                                    problem_statement, 
                                    lesson_goals, 
                                    common_mistakes,
                                    conversation_history,
                                    notebook_content = "",
                                    history_limit = 15,
                                    model_name = "gemini-2.5-pro",
                                    thinking_budget = -1,
                                    temperature = 0.2)
        
        # Include the new code in the history to create an appropriate message
        agent_code_dict = {"author": "agent", "type": "code", "content": agent_code}
        conversation_history.append(agent_code_dict)

        agent_response = get_agent_response(client_gemini,
                                            problem_statement,
                                            lesson_goals,
                                            common_mistakes,
                                            conversation_history,
                                            notebook_content = "",
                                            model_name = "gemini-2.5-pro",
                                            thinking_budget = -1,
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

@app.post("/api/upload")
async def upload_problem(file: UploadFile = File(...)):
    try:
        # read the file content manually, because load_problem_from_file expects it
        content = await file.read()
        return load_problem_from_file(content.decode("utf-8"))
    except Exception as e:
        print("Error parsing uploaded file:", e)
        return JSONResponse(status_code=400, content={"error": "Invalid file"})
