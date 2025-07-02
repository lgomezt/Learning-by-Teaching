# File: backend/utils/agent_tools/tool_impls.py

def generate_code(client, language: str, description: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful code generator. Only give the Python code as your output answering the requirements. Omit the first and last line of the output."},
            {"role": "user", "content": f"Write a {language} program to: {description}"}
        ]
    )
    return response.choices[0].message.content


def update_python_code(client, original_code: str, requirement: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a Python coding tool. Only give the Python code as your output answering the requirements. Omit the first and last line of the updated output."},
            {"role": "user", "content": f"Update this code:\n\n{original_code}\n\nRequirement: {requirement}"}
        ]
    )
    return response.choices[0].message.content


def explain_code(client, code: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a code explainer. Respond with a plain English explanation."},
            {"role": "user", "content": f"What does this code do?\n\n{code}"}
        ]
    )
    return response.choices[0].message.content