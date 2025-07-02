tools = [
    {
        "type": "function",
        "function": {
            "name": "generate_code",
            "description": "Generate new code based on a requirement",
            "parameters": {
                "type": "object",
                "properties": {
                    "language": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["language", "description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_python_code",
            "description": "Update Python code based on a requirement",
            "parameters": {
                "type": "object",
                "properties": {
                    "original_code": {"type": "string"},
                    "requirement": {"type": "string"}
                },
                "required": ["original_code", "requirement"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "explain_code",
            "description": "Explain what the given code does",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {"type": "string"}
                },
                "required": ["code"]
            }
        }
    }
]

from utils.agent_tools.tool_impls import generate_code, update_python_code, explain_code

function_map = {
    "generate_code": generate_code,
    "update_python_code": update_python_code,
    "explain_code": explain_code
}
