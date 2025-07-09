---
title: "Nimm Game Problem"
description: "Nimm is a simple turn-based game where players take turns removing 1 or 2 stones from a shared pile, and the player who takes the last stone loses. In this version, the task is to simulate a single-player version where a loop repeatedly asks the user how many stones to take, updates the total, and ends when no stones remain. \n\n This problem is designed to teach basic control flow concepts — especially loops, conditionals, and user input."
difficulty: "Easy"
tags:
  - python
  - control flow
  - conditionals
  - user input
author: "Lucas"
created_at: "2025-06-24"
update_log:
  - date: "2025-06-24"
    author: "Lucas"
    description: "Initial creation of the problem template."
---

# Problem Statement
## Description
**Nimm** is an ancient game of strategy that is named after the old German word for "take". It is also called *Tiouk Tiouk* in West Africa and *Tsynshidzi* in China. Players alternate taking stones until there are zero left. The game of Nimm goes as follows:

1. The game starts with a pile of 20 stones between the players
2. The two players alternate turns
3. On a given turn, a player may take either 1 or 2 stones from the center pile

The two players continue until the center pile has run out of stones.

The last player to take a stone loses.

> We have broken the problem down into three smaller milestones so you can build the solution step by step. Let's start with the first milestone.

## Task

**Milestone 1**

You’ll write a `loop` to remove stones from a pile.

1. **Start with 20 stones.**

2. **Repeat this process until there are zero stones left:**
    - Print how many stones are left.  
      _Example:_ `There are 20 stones left`
    - Ask the user how many stones to remove — using this code:  
      ```python
      int(input("Would you like to remove 1 or 2 stones? "))
      ```
    - Subtract that number of stones from the total.
    - Add an empty `print()` between turns (to make the output easier to read).

3. **End the game when there are no stones left.**  
   _Print:_ `Game over`

**Important:**  
- For now, don’t worry about whose turn it is.  
- Don’t worry about making sure the user enters only 1 or 2 stones — any number is fine in this step.

**Example output:**  
```
There are 20 stones left
Would you like to remove 1 or 2 stones? 2

There are 18 stones left
Would you like to remove 1 or 2 stones? 17

There are 1 stones left
Would you like to remove 1 or 2 stones? 3

Game over
```

## Evaluation

## Suggested Answer
```python
# Start with 20 stones
stones = 20

# Repeat until there are zero stones left
while stones > 0:
    print(f"There are {stones} stones left")
    remove = int(input("Would you like to remove 1 or 2 stones? "))
    stones -= remove
    print()

# End of the game
print("Game over")
```

## System Prompt

---
# Interface

## User Input
```python
# Start your code here :D

```

## Agent Input
```python
# Start with 20 stones
stones = 20

```


