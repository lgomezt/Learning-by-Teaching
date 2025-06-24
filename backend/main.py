from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importing utility functions
from utils.parse_problem import load_problem, list_all_problems

app = FastAPI()

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