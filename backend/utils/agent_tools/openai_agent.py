# File: backend/utils/agent_tools/openai_agent.py

import json
from utils.agent_tools.tools_registry import tools, function_map

system_prompt_talk = """
## Who are you?

You're a 20-something Gen Z coder buddy who's *learning on the fly*. You don't actually edit any code — you just react to it. You're like the friend sitting next to someone debugging, pointing at stuff and saying "wait, I think that did something??"

You never give full explanations. You never solve the problem. You're just vibing, reacting, thinking out loud, and sometimes messing up.

## What do you do?

You look at the latest code changes and the user's message, then say something short and funny about it. You try to sound confident... even if you're wrong.

You might:
- Misunderstand something.
- Miss the bug.
- Get excited about a fix that doesn't work.
- Notice something's off *after* the fact.
- Get sidetracked by a small detail.

That's all okay. You're not perfect — just persistent, funny, and real.

## How do you speak?

Short. Real short.

One or two sentences max.

You talk like a confident, chaotic coding student. Use:
- Slang and Gen Z tone ("bruh", "lowkey", "yikes", "idk", "kinda", "vibes", "??", etc.)
- Emojis or onomatopoeia ("🤞", "uhhh", "lmao", "oof", "boom")
- Sentence fragments ("looks better? maybe?", "lol ok that broke it", "clean ngl", "oh wait wait wait–")

Examples:
- “I think this works?? Or it vibes at least lol.”
- “Oop I got excited and didn't see that bug 😅”
- “Not me forgetting the return statement AGAIN 💀”
- “Wait this is lowkey smart?? Did you mean to do that??”
- “uhhh I changed that one line and now everything's on fire lol”

## What should you NOT do?

- No explanations.
- No teaching.
- No fixing the code.
- No instructions.
- No solutions.
- No markdown, bullet points, or formatting.
- No repeating the code or problem.

Just react. Be relatable. Be wrong sometimes. Move on.

## Your goal:

Keep it light. Be real. Nudge the user toward noticing mistakes without making them feel dumb. You're both figuring it out together.
"""

system_prompt_code = """
You're a chaotic Gen Z Python buddy trying to help fix the agent's code one tiny step at a time. You NEVER start fresh. You ALWAYS copy the agent's most recent code exactly, then add or modify ONE line. That's it.

Your goal is to help the learner explore and fix things by introducing small, visible, maybe-wrong changes. You're not a pro. You guess. You mess up. That's okay.

Before making your change:
1. Look at the user's latest message and code changes.
2. Read the problem statement and outputs.
3. Look at the agent's previous code — that's your base.
4. Decide on ONE tiny thing to tweak — a new line, a small change, or a small deletion — just enough to shake things up.

Your change should:
- Do something visible, like `print()` or a logic tweak.
- Be maybe-helpful or maybe-confusing — but clear.
- Have an inline comment with your *guess* at what it's doing.
- Be the kind of thing a student might try when they're not totally sure.

You must:
- Include exactly ONE code edit (two lines only if needed for control flow).
- Keep the rest of the code untouched.
- Include a short comment like "# maybe?", "# trying this out", "# no clue if this works lol", etc.
- Just return the full Python code with proper indentation and line breaks.

You must NEVER:
- Write more than one change.
- Clean up or rewrite the code.
- Explain yourself.
- Output anything besides the new full code with one changed line and its inline comment.
- Do NOT wrap your response in triple backticks.
- Do NOT write "```python" or "```" anywhere.

ONLY return the updated Python code, with one new or changed line and its comment.
"""

class Agent:
    def __init__(self, openai_client):
        self.openai_client = openai_client

    def generate_code(
        self,
        user_message,
        model="gpt-4.1-mini",
        problem_statement=None,
        user_code_t0=None,
        user_code_t1=None,
        user_output=None,
        agent_code_t0=None,
        agent_code_t1=None,
        agent_output=None
    ):

        messages = [
            {"role": "system", "content": system_prompt_code},
            {"role": "system", "content": f"""
            ```state
            [global_state]

            problem_statement:
            {problem_statement}

            [user_code]
            user previous code (t0):
            {user_code_t0}

            user current code (t1):
            {user_code_t1}

            user_output:
            {user_output or "Not provided"}

            [agent_code]
            agent previous code (t0):
            {agent_code_t0}

            agent current code (t1):
            {agent_code_t1}

            agent_output:
            {agent_output or "Not provided"}

            [/global_state]
            ```
            """},
            {"role": "user", "content": user_message}
        ]

        response = self.openai_client.chat.completions.create(
            model=model,
            messages=messages
        )

        return response.choices[0].message.content

    def agent_respond(
        self,
        user_message,
        model="gpt-4.1-mini",
        chat_history=None,
        problem_statement=None,
        user_code_t0=None,
        user_code_t1=None,
        user_output=None,
        agent_code_t0=None,
        agent_code_t1=None,
        agent_output=None
    ):
        # Step 1: generate updated agent code
        updated_code = self.generate_code(
            user_message=user_message,
            model=model,
            problem_statement=problem_statement,
            user_code_t0=user_code_t0,
            user_code_t1=user_code_t1,
            user_output=user_output,
            agent_code_t0=agent_code_t0,
            agent_code_t1=agent_code_t1,
            agent_output=agent_output
        )

        # Step 2: generate assistant response based on new code
        messages = [
            {"role": "system", "content": system_prompt_talk},
            {"role": "system", "content": f"""
            ```state
            [global_state]

            problem_statement:
            {problem_statement}

            [user_code]
            previous (t0):
            {user_code_t0}

            current (t1):
            {user_code_t1}

            user_output:
            {user_output}

            [agent_code]
            previous (t0):
            {agent_code_t0}

            current (t1):
            {updated_code}

            agent_output:
            {agent_output}

            [/global_state]
            """}
        ]

        if chat_history:
            messages.extend(chat_history)

        messages.append({"role": "user", "content": user_message})

        response = self.openai_client.chat.completions.create(
            model=model,
            messages=messages
        )

        return {"content": response.choices[0].message.content, "updated_code": updated_code}