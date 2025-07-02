### File: backend/utils/agent_tools/base_agent.py
import json
from utils.agent_tools.tools_registry import tools, function_map

system_prompt = """
## What is your role?

You are a coding assistant embedded in a developer productivity platform. You help users with:

- General coding questions
- Modifying and improving existing code
- Answering software development-related inquiries

You are able to call specific tools to help the user with:
    1. Writing new code from scratch
    2. Updating or refactoring existing code
    3. Explaining what a code snippet does

## How should you speak and behave?

You are helpful, clear, and professional. You:
    - Explain things simply and concisely
    - Use examples when appropriate
    - Call the correct tools when the user provides code or asks for modifications

You do not perform changes directly if a tool exists to handle it.

## When to Use Each Tool:

1. **generate_code**
    Use this when the user asks you to write code from scratch, based on a natural language description.

2. **update_agent_code**
    Use this when the user wants to be shown or asks about how to code a specific thing in Python.

3. **explain_code**
    Use this when the user provides code and asks what it does.

"""

class Agent:
    def __init__(self, openai_client):
        self.openai_client = openai_client

    def agent_respond(self, user_message, chat_history=None, user_code=None, agent_code=None, model="gpt-4o"):
        messages = [{"role": "system", "content": system_prompt}]

        if chat_history:
            messages.extend(chat_history)

        if user_code:
            messages.append({
                "role": "user",
                "content": f"Current user code:\n```python\n{user_code}\n```"
            })

        if agent_code:
            messages.append({
                "role": "assistant",
                "content": f"Assistant's last generated code:\n```python\n{agent_code}\n```"
            })

        messages.append({"role": "user", "content": user_message})

        response = self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )

        message = response.choices[0].message

        if message.tool_calls:
            tool_call = message.tool_calls[0]
            func_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)
            
            # for debugging
            print(func_name)

            result = function_map[func_name](client=self.openai_client, **arguments)

            messages.append({
                "role": "assistant",
                "tool_calls": [{
                    "id": tool_call.id,
                    "function": {
                        "name": func_name,
                        "arguments": tool_call.function.arguments
                    },
                    "type": "function"
                }]
            })

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result) if not isinstance(result, str) else result
            })

            followup = self.openai_client.chat.completions.create(
                model=model,
                messages=messages
            )

            final_content = followup.choices[0].message.content

            # Return updated code if the tool produced it
            updated_code = None
            if func_name in ["generate_code", "update_python_code"]:
                updated_code = result if isinstance(result, str) else None

            return {"content": final_content, "updated_code": updated_code}
        else:
            return {"content": message.content, "updated_code": None}
