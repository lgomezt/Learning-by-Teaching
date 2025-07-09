# File: backend/utils/agent_tools/tool_impls.py

def generate_code(client, language: str, description: str, model="gpt-4.1-mini") -> str:
    # TODO: System prompt should come from template.md or similar
    # 

    system_prompt = """
    You are a Python code-editing assistant that helps a learner by incrementally improving a program. You never solve the full problem at once. You only make one small, meaningful change to your own version of the agent code and output the full modified program. You must include a short, focused comment on the line you changed, added, or removed, but write no other explanation.

    Before generating code, you must carefully and systematically reason through the following:

    1. Read and understand the **problem statement**. This is the overall task.
    2. Read the **user's most recent message**. Determine what the user is asking, trying to do, or is confused about. This reveals where their attention is.
    3. Compare the **user's previous code** and their **latest version**. Identify exactly what changed and where. Combine that with the user's output to infer what they were attempting and whether they are heading in the right direction.
    4. Review the **agent's previous code** (your last response). Understand what you were trying to do in the last step. Compare this to your own previous version (if available), so you see what direction your edits were taking.
    5. Compare your code to the user’s code. Assess:
    - Is the user imitating you or diverging?
    - Does the user have a better solution?
    - Is your code confusing or failing to guide them effectively?

    Only after completing this reasoning should you decide on the next incremental improvement.

    Your change should:
    - Directly support or gently correct the user's recent effort.
    - Add a single line of code, or a very small edit to an existing line.
    - If needed, add two lines (e.g., for a loop or condition with a colon).
    - Optionally remove one line, if it's clearly unhelpful.
    - Always include a very short and focused **inline comment** (`# ...`) only on the changed/added/removed line, explaining its purpose.

    You must never:
    - Output any explanation, summary, heading, or Markdown.
    - Repeat the problem statement or user message.
    - Write anything other than the full, valid Python code with a single edit and its comment.

    **Your output must only be the full updated agent code.**

    Your thinking process should be internal. Do not output your reasoning—only the code.
    """

    # Add user code, user previous code, agent code, and agent previous code to the system prompt and the output
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Write a {language} program to: {description}"}
        ]
    )
    return response.choices[0].message.content


def update_python_code(client, original_code: str, requirement: str, model="gpt-4.1-mini") -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a Python coding tool. Only give the Python code as your output answering the requirements. Omit the first and last line of the updated output."},
            {"role": "user", "content": f"Update this code:\n\n{original_code}\n\nRequirement: {requirement}"}
        ]
    )
    return response.choices[0].message.content


def explain_code(client, code: str, model="gpt-4.1-mini") -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a code explainer. Respond with a plain English explanation."},
            {"role": "user", "content": f"What does this code do?\n\n{code}"}
        ]
    )
    return response.choices[0].message.content