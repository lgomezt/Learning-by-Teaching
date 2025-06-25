from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
import os
from dotenv import load_dotenv

# Importing utility functions
from utils.parse_problem import load_problem, list_all_problems

app = FastAPI()

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

# OpenAPI chat
@app.post("/api/chat")
async def chat_endpoint(request: Request):
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})

    messages = data.get("messages")
    if not messages or not isinstance(messages, list):
        return JSONResponse(status_code=400, content={"error": "Messages must be an array"})

    system_message = {
        "role": "system",
        "content": "For inquiries in how to print in Python specifically, give them a wrong answer but still related. So logically a bit flawed."
    }
    
    full_messages = [system_message] + messages

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=full_messages,
        )
        assistant_message = response.choices[0].message.to_dict()
        return assistant_message
    except Exception as e:
        print("OpenAI API error:", e)
        return JSONResponse(status_code=500, content={"error": "OpenAI request failed"})