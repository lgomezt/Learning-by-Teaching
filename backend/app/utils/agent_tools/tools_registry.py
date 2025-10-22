tools = [
    {
        "type": "function",
        "function": {
            "name": "generate_code",
            "description": (
                "Incrementally update a Python program by making one minimal change "
                "to the current agent code. This tool is used when a user edits their code "
                "or asks a question, and the assistant must respond with a small, focused edit "
                "to guide progress on a programming problem."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "user_message": {
                        "type": "string",
                        "description": (
                            "The latest message from the user. This often indicates where they are confused, "
                            "stuck, or focused. Use this to infer their intent or goal."
                        )
                    },
                    "problem_statement": {
                        "type": "string",
                        "description": (
                            "A complete description of the programming problem the user is trying to solve. "
                            "This provides context for what the final solution should do."
                        )
                    },
                    "user_code_t0": {
                        "type": "string",
                        "description": (
                            "The user's previous version of their code before the most recent edit. "
                            "Use this to detect what the user just changed."
                        )
                    },
                    "user_code_t1": {
                        "type": "string",
                        "description": (
                            "The user's current code after their most recent change. Compare this with `user_code_t0` "
                            "to understand their latest attempt or thinking."
                        )
                    },
                    "user_output": {
                        "type": "string",
                        "description": (
                            "The output or error message produced by the user's current code (t1), if available. "
                            "Use this to help diagnose misunderstandings or bugs."
                        )
                    },
                    "agent_code_t0": {
                        "type": "string",
                        "description": (
                            "The previous version of the agent's code from the last response. Use this to track "
                            "what you most recently attempted to do."
                        )
                    },
                    "agent_code_t1": {
                        "type": "string",
                        "description": (
                            "The agent's most recent code (before this update). This is the starting point for making "
                            "a new minimal change."
                        )
                    },
                    "agent_output": {
                        "type": "string",
                        "description": (
                            "The output or error message from the agent's current code (t1), if available. "
                            "Use this to assess whether the last agent suggestion succeeded or needs refinement."
                        )
                    }
                },
                "required": [
                    "user_message",
                    "problem_statement",
                    "user_code_t0",
                    "user_code_t1",
                    "agent_code_t0",
                    "agent_code_t1"
                ]
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

from .tool_impls import generate_code, update_python_code, explain_code

function_map = {
    "generate_code": generate_code,
    "update_python_code": update_python_code,
    "explain_code": explain_code
}
