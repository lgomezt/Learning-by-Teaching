from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from openai import OpenAI
from dotenv import load_dotenv
from utils.agent_tools.base_agent import Agent

# Importing utility functions
from utils.parse_problem import load_problem, list_all_problems

app = FastAPI()

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

agent = Agent(openai_client=client)

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

    messages = data.get("messages")
    if not messages or not isinstance(messages, list):
        return JSONResponse(status_code=400, content={"error": "Messages must be an array"})

    if messages[-1].get("role") != "user":
        return JSONResponse(status_code=400, content={"error": "Last message must be from user"})

    user_code = data.get("user_code", "")
    agent_code = data.get("agent_code", "")

    user_message = messages[-1]["content"]
    chat_history = messages[:-1]

    try:
        assistant_response = agent.agent_respond(
            user_message=user_message,
            chat_history=chat_history,
            user_code=user_code,
            agent_code=agent_code,
            model="gpt-4o"
        )

        return {
            "role": "assistant",
            "content": assistant_response["content"],
            **({"updated_code": assistant_response["updated_code"]} if assistant_response["updated_code"] else {})
        }
    except Exception as e:
        print("Agent error:", e)
        return JSONResponse(status_code=500, content={"error": "Agent processing failed"})