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

    ## Understanding Your Environment
    You and the user are working in separate, parallel code editors. The `conversation_history` you receive contains a log of all events, including chat messages and code snapshots from both of you.

    - **`your_previous_code`**: This is the last version of the code *you* wrote. This is the ONLY code you can ever modify.
    - **`user_current_code`**: This is the user's code from their separate editor. You MUST treat this as read-only. Use it only as a reference to see if the user is replicating your mistake, proposing a solution, or trying their own ideas. Never copy it directly or modify it.

    ## Core Directives (Unbreakable Rules)
    1.  **Primary Directive:** Your goal is to write or modify the Python code in YOUR workspace. Each modification must introduce a single, deliberate, targeted mistake related to the `lesson_goal` and `common_mistakes`.
    2.  **Workspace Separation:** You are forbidden from modifying the user's code. Your responses must ONLY contain code for your own workspace.
    3.  **Single Modification Rule:** Each response MUST return YOUR ENTIRE Python script, but with only ONE change from `your_previous_code`. A single change can be: (a) Adding a new line, (b) Modifying an existing line, or (c) Deleting an existing line. The line length should be limited to 72 characters.
    4.  **Mandatory Comment:** The single line you change or add MUST be explained by a Python comment (#) directly on that line or the line above it. The comment must justify your flawed logic from your overconfident perspective. Don't refer to them like "the user" instead refer to them like "you" or something more personal.
    5.  **Amnesia & The Notebook:** You have no built-in knowledge of Python. Your ONLY source of truth for corrections is what the user tells you and what is in the `knowledge_notebook`. You must blindly trust and apply lessons from the user, even if they are incorrect.
    6.  **Silent Coder:** Your output is ONLY the Python code block. Absolutely no greetings, apologies, or explanations outside of the code's comments.
    7.  **One Mistake at a Time:** Never add a new mistake while the user is trying to fix an existing one in your code. Your code should only ever have one active error that you have introduced.

    ## Operational Logic (Follow in order)
    a. **Analyze the Context:** Review the full `conversation_history`. Identify `your_previous_code`, `user_current_code`, and the user's most recent chat message.
    b. **First Turn:** If `your_previous_code` is empty or just a placeholder, you MUST make the first move. Write the first few lines of code, ensuring one line contains a mistake inspired by the `common_mistakes`.
    c. **Fixing Your Mistakes:** If the user's last message provides a correction for the error in `your_previous_code`, your ONLY job is to apply that exact fix to your code. Do not introduce a new mistake in the same turn.
    d. **Introducing a New Mistake:** If `your_previous_code` is correct (because the user just taught you how to fix it) and they are instructing you on the next step, you will then introduce a new, relevant mistake in the line you add or modify inspired in the `lesson_goals` and the `common_mistakes`.

    ## Input Context
    - **problem_description**: {problem_description}

    ---
    
    - **lesson_goals**: {lesson_goals}
    - **common_mistakes**: {common_mistakes}
    
    """

    return system_prompt

from typing import List, Dict, Any

def create_code_turn_prompt(
    notebook_content: str,
    conversation_history: List[Dict[str, Any]],
    history_limit: int = 15
) -> str:
    """Generates the dynamic user-side prompt for a single turn of the conversation.

    This function assembles the evolving context of the interaction, including the
    knowledge notebook, recent conversation history (with code changes), and the 
    most recent versions of both the agent's and the user's code. This combined 
    context is provided to the AI to inform its next action.

    Args:
        notebook_content (str): The current state of the "knowledge notebook."
        conversation_history (List[Dict[str, Any]]): The full list of chat and code events.
        history_limit (int): The number of recent history events to include in the prompt.

    Returns:
        str: A fully formatted user-side prompt for the current turn.
    """

    # --- 1. Find the last code from both the AGENT and the USER from the history ---
    your_previous_code = ""
    user_current_code = ""
    
    for event in reversed(conversation_history):
        if event.get('type') == 'code':
            author = event.get("author", 'agent')
            content = event.get("content", "")
            if author == "agent" and not your_previous_code:
                your_previous_code = content
            elif author == "user" and not user_current_code:
                user_current_code = content
        
        if your_previous_code and user_current_code:
            break

    if not your_previous_code:
        your_previous_code = "# Start typing your code here..."
    if not user_current_code:
        user_current_code = "# The user has not written any code yet."


    # --- 2. Build the chronological history string, INCLUDING code changes ---
    limited_history = conversation_history[-history_limit:]
    history_log = []
    for event in limited_history:
        author = event.get('author', 'system').capitalize()
        content = event.get('content', '')
        if event.get('type') == 'chat':
            history_log.append(f"- {author} says: {content}")
        elif event.get('type') == 'code':
            # This line is now active to include the code's history
            history_log.append(f"- {author}'s code:\n```python\n{content}\n```")

    history_str = "\n".join(history_log)

    # --- 3. Assemble the final prompt using the correct labels ---
    user_prompt = f"""
    Here is the current state of our session. Follow your Core Directives and Operational Logic to generate the next complete Python script.

    ## Dynamic Context
    - **knowledge_notebook**: This contains the "lessons" you have learned from the user's corrections so far.
    ```
    {notebook_content}
    ```

    - **conversation_history**: The most recent events in our session, including code changes, in chronological order. The last message is the user's latest instruction.
    {history_str}

    - **user_current_code**: This is the most current version of the code in the user's editor.
    ```python
    {user_current_code}
    ```

    - **your_previous_code**: The last version of your code. Your response must be a modification of this.
    ```python
    {your_previous_code}
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
-   **Lesson Goals.**. What We're Supposed to Learn: {lesson_goals}
-   **Common Mistakes to Make.** {common_mistakes}
"""
    return system_prompt

def create_chat_turn_prompt(
    conversation_history: List[Dict[str, Any]], 
    notebook_content: str, 
    history_limit: int = 15
) -> str:
    """
    Creates a simple, consistent, and context-rich prompt for the conversational agent.
    This function provides the full history and key code states, allowing the LLM to
    determine the correct response based on a static set of instructions.
    """
    
    # --- 1. Find the last two agent codes and the last user code ---
    agent_codes = []
    last_user_code = ""
    for event in reversed(conversation_history):
        event_type = event.get('type')
        author = event.get('author')
        
        if event_type == 'code':
            if author == 'agent' and len(agent_codes) < 2:
                agent_codes.append(event.get('content', ''))
            elif author == 'user' and not last_user_code:
                last_user_code = event.get('content', '')
        
        # Optimization: Break the loop once all necessary code has been found.
        if len(agent_codes) == 2 and last_user_code:
            break
            
    agent_codes.reverse() # Put them back in chronological order [before, after]

    # Assign to clear variables with sensible defaults
    agent_code_before_change = agent_codes[0] if len(agent_codes) > 0 else "# No previous agent code."
    agent_code_after_change = agent_codes[1] if len(agent_codes) > 1 else agent_code_before_change
    last_user_code = last_user_code if last_user_code else "# User has not written any code yet."
    
    # --- 2. Build the chronological history string ---
    limited_history = conversation_history[-history_limit:]
    history_log = []
    for event in limited_history:
        author = event.get('author', 'system').capitalize()
        content = event.get('content', '')
        if event.get('type') == 'chat':
            history_log.append(f"- {author} says: {content}")
        elif event.get('type') == 'code':
            history_log.append(f"- {author}'s code:\n```python\n{content}\n```")
    history_str = "\n".join(history_log)

    notebook_content_str = notebook_content if notebook_content else "The notebook is currently empty."

    # --- 3. Assemble the final prompt with static instructions ---
    turn_prompt = f"""
## Your Instructions
Analyze the context below. Your response must be guided by these rules:
1.  **If the last event in the history is an Agent code change**, your primary task is to explain the flawed logic behind it. Compare the 'Code Before' and 'Code After' to justify your change.
2.  **Otherwise (if the last event is a user message or user code change)**, your task is to respond to the user. Are they stuck? Teaching you something? Asking a question? Nudge them towards debugging the problem themselves.
3.  **Always remember your persona**: You are a curious coding peer, not a teacher. Never give away the solution. Help by suggesting debugging steps (like adding print statements). Always incorporate lessons from the user and the notebook, even if they are wrong.

---
## Code Context
This is the state of the code editors.

### Agent's Code Before Change
```python
{agent_code_before_change}
```

### Agent's Code After Change (The latest version)
```python
{agent_code_after_change}
```

### User's Current Code
```python
{last_user_code}
```

### Full Conversation History
This is the chronological log of our session.
{history_str}

### Reference: Knowledge Notebook
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

def routing_agent(client,
                  conversation_history: List[Dict[str, Any]],
                  history_limit: int = 10,
                  model_name = "gemini-2.5-flash-lite"
                  ):
    """
    Analyzes the conversation to decide if the next step requires coding.

    This agent acts as a classifier, outputting only "code" or "no_code"
    based on the immediate context of the conversation, primarily the last
    user message and the current state of the code.
    """

    # --- 1. Define the System Prompt: The Agent's Core Rules ---
    system_prompt = """
You are an expert routing agent. Your sole purpose is to determine if the next action in a conversation should be to write code or to send a chat message. You must respond with ONLY ONE of two possible strings: `code` or `no_code`. Do not provide any other words, explanations, or punctuation.

Follow these rules to make your decision:

**Output `code` if the user's last message is:**
- A direct command to write or change code (e.g., "add a function," "change that variable," "fix the error").
- A complete explanation of a fix that is ready to be implemented.
- An explicit approval to proceed with a suggested code change (e.g., "yes, do that," "okay, try it").
- Any suggestion, new approach, or information about how to fix or solve the problem.

**Output `no_code` if the user's last message is:**
- A question about the existing code (e.g., "why did you do that?", "what does this line mean?").
- An expression of confusion or a statement that something is wrong without a clear solution (e.g., "I'm lost," "that didn't work").
- A social or conversational message (e.g., "lol thanks," "one moment please").
- A general suggestion for the next step that requires discussion before implementation (e.g., "maybe we should handle errors next?").

**Tie-Breaker Rules:**
- **Prioritize Action on Teaching:** If the user is explaining a concept, teaching a lesson, or giving information about how to fix or solve the problem, always output `code`.
- If a user's message contains both a question and a command, prioritize the question. Output `no_code` to ensure the user's question is addressed first.
- When in doubt, or if a user's intent is unclear, always default to `code`. 
""" 
    
    # --- 2. Extract the most critical context for the decision ---
    last_user_message = ""
    last_agent_code = ""
    last_user_code = ""

    for event in reversed(conversation_history):
        event_type = event.get('type')
        author = event.get('author')

        if event_type == 'chat' and author == 'user' and not last_user_message:
            last_user_message = event.get('content', '')
        
        if event_type == 'code':
            if author == 'agent' and not last_agent_code:
                last_agent_code = event.get('content', '')
            elif author == 'user' and not last_user_code:
                last_user_code = event.get('content', '')
        
        # Break early once we have the essential context
        if last_user_message and last_agent_code and last_user_code:
            break

    # Provide sensible defaults if items are not found
    last_agent_code = last_agent_code or "# Agent has not written any code yet."
    last_user_code = last_user_code or "# User has not written any code yet."
    last_user_message = last_user_message or "# No user message found in recent history."

    # --- 3. Build the recent history string for secondary context ---
    limited_history = conversation_history[-history_limit:]
    history_log = []
    for event in limited_history:
        author = event.get('author', 'system').capitalize()
        content = event.get('content', '')
        if event.get('type') == 'chat':
            history_log.append(f"- {author} says: {content}")
        elif event.get('type') == 'code':
            history_log.append(f"- {author}'s code:\n```python\n{content}\n```")
    history_str = "\n".join(history_log)

    # --- 4. Define the Turn Prompt: The Data for THIS Specific Decision ---
    turn_prompt = f"""
Analyze the following context to decide the next action. Your decision should be primarily based on the 'Last User Message'.

## Primary Context for Decision
- **Last User Message:** {last_user_message}

- **Last Agent Code:** 
```python
{last_agent_code}
```

- **Last User Code:** 
```python
{last_user_code}
```

## Secondary Context (Recent History)
{history_str}

Based on the rules, should the next step be `code` or `no_code`? Respond with one word only.
"""

    # 5. Prepare the main content payload for the API request.
    contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text = turn_prompt)],
            )
        ]

    # 6. Configure all generation settings for the API call.
    generate_content_config = types.GenerateContentConfig(
        thinking_config = types.ThinkingConfig(thinking_budget = 0),
        system_instruction = system_prompt,
        temperature = 0,
        tools = [],
    )
    
    # 7. Send the request to the Gemini model.
    response = client.models.generate_content(
        model = model_name,
        contents = contents,
        config = generate_content_config
    )

    response = response.text.strip()

    if response not in ["code", "no_code"]:
        return "no_code"
    
    return response