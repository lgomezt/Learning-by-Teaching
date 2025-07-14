# /backend/utils/parse_problem.py
import os
import glob
import frontmatter
import re
from typing import Union
from fastapi import UploadFile

PROBLEMS_DIR = "problems"


def parse_problem_content(content: str, metadata: dict = None):
    """
    Shared logic for parsing markdown content with frontmatter + problem structure.
    """
    # If frontmatter wasn't extracted before (e.g. from UploadFile), extract it now
    if metadata is None:
        post = frontmatter.loads(content)
        metadata = post.metadata
        content = post.content

    # Extract Problem Statement
    match = re.search(r"(# Problem Statement.*?)^## Evaluation", content, re.DOTALL | re.MULTILINE)
    problem_statement = match.group(1).strip() if match else ""

    # Extract user input block
    match = re.search(r"## User Input[\s\S]*?```python\s*([\s\S]*?)```", content)
    user_code = match.group(1).strip() if match else ""

    # Extract agent input block
    match = re.search(r"## Agent Input[\s\S]*?```python\s*([\s\S]*?)```", content)
    agent_code = match.group(1).strip() if match else ""

    return {
        "title": metadata.get("title", ""),
        "description": metadata.get("description", ""),
        "difficulty": metadata.get("difficulty", ""),
        "tags": metadata.get("tags", []),
        "author": metadata.get("author", ""),
        "problem_statement": problem_statement,
        "agent_code": agent_code,
        "user_code": user_code,
    }

def load_problem(problem_id: str):
    """
    Load a problem from disk by ID (filename without .md extension).
    """
    path = os.path.join(PROBLEMS_DIR, f"{problem_id}.md")
    if not os.path.exists(path):
        return None

    post = frontmatter.load(path)
    return {
        "id": problem_id,
        **parse_problem_content(post.content, post.metadata)
    }

def load_problem_from_file(content: str):
    """
    Load and parse a problem from raw markdown string content.
    """
    return parse_problem_content(content)

def list_all_problems():
    """
    List all problems in the problems directory (for hardcoded templates).
    """
    files = glob.glob(os.path.join(PROBLEMS_DIR, "*.md"))
    problem_list = []
    for f in files:
        post = frontmatter.load(f)
        filename = os.path.splitext(os.path.basename(f))[0]
        problem_list.append({
            "id": filename,
            "title": post.get("title", ""),
            "difficulty": post.get("difficulty", ""),
            "tags": post.get("tags", []),
        })
    return problem_list
