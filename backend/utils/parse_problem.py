# /backend/utils/parse_problem.py
import os
import glob
import frontmatter
import re

PROBLEMS_DIR = "/app/problems"

def load_problem(problem_id: str):
    """
    Load a problem by ID (filename without .md).
    Returns dict with metadata and agent code.
    """
    path = os.path.join(PROBLEMS_DIR, f"{problem_id}.md")
    
    if not os.path.exists(path):
        return None

    post = frontmatter.load(path)
    md_content = post.content

    # Extract agent input block
    match = re.search(r"## Agent Input[\s\S]*?```python\s*([\s\S]*?)```", md_content)
    agent_code = match.group(1).strip() if match else ""

    return {
        "id": problem_id,
        "title": post.get("title", ""),
        "description": post.get("description", ""),
        "difficulty": post.get("difficulty", ""),
        "tags": post.get("tags", []),
        "author": post.get("author", ""),
        "agent_code": agent_code,
    }

def list_all_problems():
    """
    List all available problems in the PROBLEMS_DIR.
    Returns list of dicts (id, title, difficulty, tags).
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