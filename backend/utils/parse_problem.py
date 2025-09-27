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
    Enhanced parser for markdown content with frontmatter + structured problem sections.
    """

    # Extract frontmatter metadata if not provided
    if metadata is None:
        post = frontmatter.loads(content)
        metadata = post.metadata
        content = post.content

    # Extract Problem Statement
    match = re.search(r"(# Problem Statement.*?)^## Evaluation", content, re.DOTALL | re.MULTILINE)
    problem_statement = match.group(1).strip() if match else ""

    # Extract Lesson Goals
    match = re.search(r"## Lesson Goals(.*?)^## Common Mistakes", content, re.DOTALL | re.MULTILINE)
    lesson_goals = match.group(1).strip() if match else ""
    lesson_goals = lesson_goals.replace("- ", "").replace(", \n", ",\n").split(",\n", maxsplit = -1)

    # Extract Common Mistakes
    match = re.search(r"## Common Mistakes(.*?)^## Suggested Answer", content, re.DOTALL | re.MULTILINE)
    common_mistakes = match.group(1).strip() if match else ""
    common_mistakes = common_mistakes.replace("- ", "").replace(", \n", ",\n").split(",\n", maxsplit = -1)

    # Extract Description Block under ## Description
    description_match = re.search(r"## Description\s+([\s\S]*?)(^## |\Z)", content, re.MULTILINE)
    description_block = description_match.group(1).strip() if description_match else ""

    # Extract all Milestones
    milestones = []
    milestone_pattern = re.compile(
        r"\*\*Milestone (\d+)\*\*([\s\S]*?)(?=\*\*Milestone|\n##|\Z)", re.MULTILINE
    )
    for milestone_match in milestone_pattern.finditer(content):
        milestone_number = milestone_match.group(1)
        milestone_content = milestone_match.group(2).strip()
        milestones.append({ "number": int(milestone_number), "content": milestone_content })

    # Extract Example Output block
    match = re.search(r"^## Example output:?\s*```(?:\w+)?\s*([\s\S]*?)```", content, re.MULTILINE)
    example_output = match.group(1).strip() if match else ""

    # Extract user input block
    match = re.search(r"## User Input[\s\S]*?```python\s*([\s\S]*?)```", content)
    user_code = match.group(1).strip() if match else ""

    # Extract agent input block
    match = re.search(r"## Agent Input[\s\S]*?```python\s*([\s\S]*?)```", content)
    agent_code = match.group(1).strip() if match else ""

    return {
        "title": metadata.get("title", ""),
        "description_meta": metadata.get("description", ""),
        "difficulty": metadata.get("difficulty", ""),
        "tags": metadata.get("tags", []),
        "author": metadata.get("author", ""),
        "problem_statement": problem_statement,
        "lesson_goals": lesson_goals,
        "common_mistakes": common_mistakes,
        "description_block": description_block,
        "milestones": milestones,
        "example_output": example_output,
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
