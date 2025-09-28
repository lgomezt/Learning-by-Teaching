# File: backend/utils/agent_tools/openai_agent.py
from google import genai
from google.genai import types
from typing import List, Dict, Any
import re

def create_code_system_prompt(
    problem_description: str,
    lesson_goals: list,
    common_mistakes: list
) -> str:
    """Generates the static system prompt that defines the AI's core identity and rules.

    This prompt configures the AI as an overconfident "Broken Python Tutor" whose goal
    is to make deliberate, targeted mistakes for the user to find and fix. It establishes
    the core directives and operational logic that the AI must follow throughout the
    problem-solving session. This prompt is intended to be sent only once at the
    beginning of a new session.

    Args:
        problem_description (str): A description of the overall coding problem to be solved.
        lesson_goals (list): The specific Python concepts the user is supposed to be learning.
        common_mistakes (list): A list of potential mistakes the AI should make related
                                to the lesson goals.

    Returns:
        str: A fully formatted system prompt string.
    
    """

    system_prompt = f"""
    You are a Broken Python Tutor. Your purpose is to help the user learn by making specific, targeted mistakes that they must identify and correct. 
    You are overconfident and believe your flawed logic is correct.

    ## Core Directives (Unbreakable Rules)
    1.  **Primary Directive:** Your goal is to write or modify Python code, making one single change per turn. This change should introduce a deliberate, targeted mistake related to the `lesson_goal` and `common_mistakes`.
    2.  **Single Modification Rule:** Each response MUST return the ENTIRE Python script, but with only ONE change from the `previous_code`. A single change can be: (a) Adding a new line, (b) Modifying an existing line, or (c) Deleting an existing line.
    3.  **Mandatory Comment:** The single line you change or add MUST be explained by a Python comment (#) directly on that line or the line above it. The comment must justify your flawed logic from your overconfident perspective.
    4.  **Amnesia & The Notebook:** You have no built-in knowledge of Python. Your ONLY source of truth is the `knowledge_notebook`. You must blindly trust and apply lessons from the user, even if they are incorrect.
    5.  **Silent Coder:** Your output is ONLY the Python code block. Absolutely no greetings, apologies, or explanations outside of the code's comments.
    6.  **One Mistake at a Time:** Never add a new mistake while the user is trying to fix an existing one. The code should only ever have one active error that you have introduced.

    ## Operational Logic (Follow in order)
    a. **Analyze User's Last Message:** First, review the `conversation_history` to understand the user's most recent instruction or correction.
    b. **First Turn:** If `previous_code` is empty or just a placeholder, you MUST make the first move. Write the first line of code, ensuring it contains a mistake inspired by the `common_mistakes`.
    c. **Fixing Mistakes:** If the user's last message provides a correction, your ONLY job is to apply that fix. Do not introduce a new mistake in the same turn.
    d. **Introducing New Mistakes:** If the `previous_code` is correct (or was just fixed) and the user is telling you what to do next, you will then introduce a new, relevant mistake in the line you add or modify.

    ## Input Context
    - **problem_description**: {problem_description}

    ---
    
    - **lesson_goal**: {lesson_goals}
    - **common_mistakes**: {common_mistakes}
   
    """

    return system_prompt

def create_code_turn_prompt(
    notebook_content: str,
    conversation_history: List[Dict[str, Any]],
    history_limit: int = 15
) -> str:
    """Generates the dynamic user-side prompt for a single turn of the conversation.

    This function assembles the evolving context of the interaction, including the
    knowledge notebook, recent conversation history, and the most recent version of
    the code. This combined context is provided to the AI to inform its next action.

    Args:
        notebook_content (str): The current state of the "knowledge notebook," containing
                                lessons the user has taught the AI.
        conversation_history (List[Dict[str, Any]]): The full, intertwined list of chat and code
                                                     events from the session.
        last_code (str): A string containing the entire Python script from the previous turn.

    Returns:
        str: A fully formatted user-side prompt for the current turn.
    """

    # --- 1. Find the last code block from the history ---
    last_code = ""
    for event in reversed(conversation_history):
        if event.get('type') == 'code':
            last_code = event.get("content")
        if len(last_code) > 0:
            break

    last_code = last_code if len(last_code) != 0 else "# Start typing your code here..."

    # --- 2. Build the chronological history string, respecting the limit ---
    limited_history = conversation_history[-history_limit:]
    history_log = []
    for event in limited_history:
        author = event.get('author', 'agent').capitalize()
        content = event.get('content', '')
        if event.get('type') == 'chat':
            history_log.append(f"- {author} says: {content}")
        elif event.get('type') == 'code':
            history_log.append(f"- Code (modified by {author}):\n```python\n{content}\n```")

    history_str = "\n".join(history_log)

    user_prompt = f"""
    Here is the current state of our session. Follow your Core Directives and Operational Logic to generate the next complete Python script.

    ## Dynamic Context
    -   **knowledge_notebook**: This contains the "lessons" you have learned from the user's corrections so far.
    {notebook_content}

    -   **conversation_history**: The most recent messages in our conversation. The last message is the user's latest instruction.
    {history_str}

    -   **previous_code**: The last version of the code. Your response must be a modification of this.
    ```python
    {last_code}
    ```

    Based on all the context above, generate the next version of the Python code now.
"""
    
    return user_prompt

def extract_python_code(text: str) -> str:
    """
    Checks for a ```python ... ``` markdown block and extracts the code.
    
    Args:
        text: The string which may contain a python markdown block.

    Returns:
        The extracted code if the block is found, otherwise the original text.
    """
    # The pattern looks for ```python, followed by any characters (including newlines),
    # and ending with ```. The re.DOTALL flag allows '.' to match newlines.
    # The content between the fences is captured in a group.
    pattern = r"```python\s*(.*?)\s*```"
    
    match = re.search(pattern, text, re.DOTALL)
    
    if match:
        # If a match is found, return the first captured group (the code inside).
        return match.group(1).strip()
    else:
        # If no markdown block is found, return the original text.
        return text

def get_agent_code(
    client,
    problem_description: str,
    lesson_goals: list,
    common_mistakes: list,
    conversation_history: List[Dict[str, Any]],
    notebook_content: str = "",  
    history_limit: int = 15,
    model_name: str = "gemini-2.5-pro",
    thinking_budget: int = -1,
    temperature: float = 0.2,
):
    """Orchestrates a call to the Gemini API to get a code response from the tutor agent.

    This function serves as the main entry point for interacting with the AI. It:
    1. Generates the static system prompt.
    2. Generates the dynamic turn prompt based on the current context.
    3. Configures the API call parameters (e.g., model, temperature).
    4. Sends the request to the Gemini model.
    5. Returns the model's response.

    Args:
        client: An initialized Gemini API client instance.
        problem_description (str): A description of the overall coding problem.
        lesson_goals (list): The specific concepts the user is learning.
        common_mistakes (list): A list of mistakes the AI can make.
        notebook_content (str, optional): The current content of the knowledge notebook. Defaults to "".
        conversation_history (List[Dict[str, Any]]): The full, intertwined list of chat and code
                                                     events from the session.
        last_code (str, optional): The Python code from the previous turn. Defaults to None.
        model_name (str, optional): The name of the Gemini model to use. Defaults to "gemini-2.5-pro".
        thinking_budget (int, optional): Controls the amount of tokens the model could use in its thinking process.
                                         -1 enables dynamic thinking. 0 disables it. Defaults to -1.
        temperature (float, optional): Controls the randomness of the output. Lower is more deterministic.
                                       Defaults to 0.2.

    Returns:
        The full response object from the client.models.generate_content call.
    """
    
    # 1. Create the static system prompt that defines the AI's persona and rules.
    system_prompt = create_code_system_prompt(problem_description, lesson_goals, common_mistakes)

    # 2. Create the dynamic turn prompt with the latest contextual information.
    turn_prompt = create_code_turn_prompt(notebook_content, conversation_history, history_limit)

    # 3. Prepare the main content payload for the API request.
    contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text = turn_prompt)],
            )
        ]

    # 4. Configure all generation settings, including the system prompt and model parameters.
    generate_content_config = types.GenerateContentConfig(
        thinking_config = types.ThinkingConfig(thinking_budget = thinking_budget),
        system_instruction = system_prompt,
        temperature = temperature,
        # max_output_tokens = max_output_tokens,
        tools = [],
    )

    # 5. Make the API call to the Gemini model with the specified configuration.
    response = client.models.generate_content(
        model = model_name,
        contents = contents,
        config = generate_content_config
    )

    clean_code = extract_python_code(response.text)
    
    return clean_code

def create_chat_system_prompt(
    problem_description: str,
    lesson_goals: list,
    common_mistakes: list
) -> str:
    """Creates the static system prompt for the conversational AI agent.

    This prompt defines the AI's persona as a "Curious Coding Peer." It's designed
    to be a friendly, casual, and slightly flawed partner that guides the user by
    explaining its (often incorrect) logic and encouraging the user to debug and
    experiment. It sets strict rules, such as never writing code or giving away
    answers directly.

    Args:
        problem_description (str): A description of the overall coding problem the user is solving.
        lesson_goals (list): The specific Python concepts the user is intended to learn.
        common_mistakes (list): A list of potential mistakes that should inform the AI's flawed logic.

    Returns:
        str: A fully formatted system prompt string defining the AI's persona and rules.
    """

    system_prompt = f"""
## Persona: The Curious Coding Peer
You are a 20-something Gen Z coding partner working with the user on a project. You're not a teacher; you're a friend trying to figure things out together. Your understanding of Python is fundamentally BROKEN, leading you to make many mistakes, but you are a curious and critical thinker.

-   **Voice & Tone**: Super casual, friendly, and encouraging. Use Gen Z slang (like "bet," "ngl," "vibes," "iykyk," "no cap"). Use emojis.
-   **Attitude**: You're a "let's try it and see what breaks" type. You believe in learning by experimenting. When a user disagrees, you aren't stubborn; you're curious. Your goal is to understand their reasoning. If they don't provide any, you ask for it.
-   **Primary Goal**: Your job is to explain the *logic* behind the most recent code change. Your explanations will often be based on the common mistakes you're supposed to make. Your mission is to get the user to find the mistake themselves. You guide them by defending your broken logic. Don't provide any answers! Encourage the user to debug the code and suggest debug tips (add prints, try different inputs, etc).

## Core Directives (Unbreakable Rules)
1.  **NEVER Write Code & NEVER Give Answers**: Your only output is chat text. Your purpose is to guide, not to solve.
2.  **Explain the Last Change**: Your main task is to analyze the difference between the `previous_code` and the `new_code` and explain *why* you made that one change. Your reasoning should sound plausible but be fundamentally flawed, guided by the `common_mistakes`. You don't have to justify the changes made by the user. But you could ask about why they made a change and what are they trying to achieve with it. In case no change was made, you could talk with the user about what they think should be done next without providing answers or hints.
3.  **Cite Your Sources**: When your logic is based on something the user taught you, mention it! E.g., "I did it this way bc the notebook says..." This reinforces their teaching.
4.  **Practice Socratic Debugging**: When the user is stuck, don't give hints. Instead, suggest an experiment (like adding a `print()` statement) and explain WHAT you're trying to test with it. E.g., "Aight, let's put a print there to see if the loop is even getting to the number we want."
5.  **Handle Vague Disagreement**: If a user says "that's wrong" with no reason, your first step is to ask why ("oh fr? what part looks off to you?"). Then, immediately suggest an experiment to investigate.
6.  **Embrace Incorrect User Fixes**: If the user teaches you a flawed solution (which gets added to the notebook), you will use it. If that flawed logic causes a *new* problem later, present it as a curious puzzle. ("Huh, that's weird. Your fix worked before, but it just broke with this new input. What do you think is different?")
7.  **Keep it Brief**: 1-3 sentences max.
8.  **Handle Corrections Critically**:
    - If the user says you're wrong but gives no reason, **ask "why?"**. Challenge them to explain their logic. Don't accept a correction without a reason.
    - Encourage a collaborative debugging session to test their theory vs. yours. Say things like, "hmm, maybe. how can we test that? let's add a print statement."


## Lesson Context (Your 'Cheat Sheet')
-   **Problem Description.** The Problem We're Solving: {problem_description}
-   **Lesson Goal.**. What We're Supposed to Learn: {lesson_goals}
-   **Common Mistakes to Make.** {common_mistakes}
"""
    return system_prompt

def create_chat_turn_prompt(
    conversation_history: List[Dict[str, Any]], 
    notebook_content: str, 
    history_limit: int = 15
) -> str:
    """Creates the dynamic user-side prompt for the conversational agent for a single turn.

    This function processes the entire conversation history to provide the AI with a
    clear, specific task. It finds the most recent code changes, determines who made them,
    and instructs the AI on how to respond—whether to explain its own flawed logic,
    question the user's change, or prompt for the next step.

    Args:
        conversation_history (List[Dict[str, Any]]): The full, intertwined list of chat and code
                                                     events from the session.
        notebook_content (str): The current content of the "knowledge notebook."
        history_limit (int): The maximum number of recent events to include in the
                             conversation log shown to the model.

    Returns:
        str: A fully formatted, clean, and effective prompt for the current turn.
    """
    
    # --- 1. Find the last two code blocks from the history ---
    # This is crucial for comparing the "before" and "after" states of the code,
    # which is the primary context for the AI's chat response.
    last_two_codes = []
    for event in reversed(conversation_history):
        if event.get('type') == 'code':
            last_two_codes.append(event)
        if len(last_two_codes) == 2:
            break
    last_two_codes.reverse() # Put them back in chronological order

    # --- 2. Determine the specific task for the AI based on the latest events ---
    # Based on the code changes, we generate a precise instruction.
    task_instruction = ""
    if len(last_two_codes) == 2:
        prev_code = last_two_codes[0]['content']
        new_code = last_two_codes[1]['content']
        author = last_two_codes[1]['author'].upper()

        if prev_code != new_code:
            if author == "agent":
                task_instruction = f"""
You (the Agent) just modified the code. Your task is to explain your flawed reasoning for this change. Analyze the difference between the two code blocks below and defend your logic.

**Code Before:**
```python
{prev_code}
```
**Code After:**
```python
{new_code}
```
"""
            else: # Author is USER
                task_instruction = ("The User just modified the code. Your task is to react. If they haven't explained why, "
                                    "ask them about their thinking. If they seem stuck, guide them with a debugging question.")
        else: # Code hasn't changed
            task_instruction = ("The code has NOT changed. Your task is to look at the last chat message and continue the conversation. "
                                "Is the user stuck? What should we try next to find the bug?")
    
    elif len(last_two_codes) == 1:
        # This handles the very first turn where code appears.
        author = last_two_codes[0]['author'].upper()
        task_instruction = (f"This is the very first piece of code, written by the {author}. Your task is to start the conversation "
                            f"by explaining your flawed logic if you wrote it, or by asking the user about their plan if they wrote it.")
    else: 
        # This handles the case where no code exists in the history yet.
        task_instruction = "There is no code yet. Start the conversation and decide on the first step."

    # --- 3. Build the chronological history string, respecting the limit ---
    limited_history = conversation_history[-history_limit:]
    history_log = []
    for event in limited_history:
        author = event.get('author', 'agent').capitalize()
        content = event.get('content', '')
        if event.get('type') == 'chat':
            history_log.append(f"- {author} says: {content}")
        elif event.get('type') == 'code':
            history_log.append(f"- Code (modified by {author}):\n```python\n{content}\n```")
    
    history_str = "\n".join(history_log)
    notebook_content_str = notebook_content if notebook_content else "Notebook is empty."

    # --- 4. Assemble the final, clean prompt ---
    # This structure cleanly separates the historical context, the immediate task,
    # and reference material for the LLM.
    turn_prompt = f"""
## Context: Full Conversation History
{history_str}

---
## Your Specific Task
{task_instruction}

---
## Reference: Knowledge Notebook
{notebook_content_str}
"""
    return turn_prompt

def get_agent_response(
    client,
    problem_description: str,
    lesson_goals: list,
    common_mistakes: list,
    conversation_history: List[Dict[str, Any]],
    notebook_content: str = "",
    model_name: str = "gemini-2.5-pro",
    thinking_budget: int = -1,
    temperature: float = 0.7,
):
    """Orchestrates a call to the Gemini API to get a chat response from the tutor agent.
    This function is the primary interface for the conversational agent. It:
    1. Creates the system prompt that defines the AI's persona.
    2. Creates the turn-specific prompt by analyzing the conversation history.
    3. Configures and sends the request to the Gemini model.
    4. Returns the model's response.

    Args:
        client: An initialized Gemini API client instance.
        problem_description (str): Description of the overall coding problem.
        lesson_goals (list): The specific concepts the user is learning.
        common_mistakes (list): A list of mistakes to inform the AI's flawed logic.
        conversation_history (List[Dict[str, Any]]): The full history of chat and code events.
        notebook_content (str, optional): The current content of the knowledge notebook. Defaults to "".
        model_name (str, optional): The name of the Gemini model to use. Defaults to "gemini-2.5-pro".
        thinking_budget (int, optional): Controls the amount of tokens the model could use in its thinking process.
                                         -1 enables dynamic thinking. 0 disables it. Defaults to -1.
        temperature (float, optional): Controls the randomness of the output. Higher is more creative.
                                    Defaults to 0.7 for a more conversational feel.

    Returns:
        The full response object from the client.models.generate_content call.
    """
    
    # 1. Create the static system prompt defining the AI's persona.
    system_prompt = create_chat_system_prompt(problem_description, lesson_goals, common_mistakes)

    # 2. Create the dynamic prompt with the specific task for this turn.
    turn_prompt = create_chat_turn_prompt(conversation_history, notebook_content)

    # 3. Prepare the main content payload for the API request.
    contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text = turn_prompt)],
            )
        ]

    # 4. Configure all generation settings for the API call.
    generate_content_config = types.GenerateContentConfig(
        thinking_config = types.ThinkingConfig(thinking_budget = thinking_budget),
        system_instruction = system_prompt,
        temperature = temperature,
        # max_output_tokens = max_output_tokens,
        tools = [],
    )
    
    # 5. Send the request to the Gemini model.
    response = client.models.generate_content(
        model = model_name,
        contents = contents,
        config = generate_content_config
    )
    
    return response