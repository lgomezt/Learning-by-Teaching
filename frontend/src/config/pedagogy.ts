/**
 * FRONTEND PEDAGOGICAL CONFIGURATION
 * 
 * UI metadata only - NO PROMPTS
 * All prompt engineering lives in the backend: backend/config/pedagogy.py
 * 
 * This file provides labels, citations, and descriptions for the UI.
 * The `id` field is sent to the backend to look up the actual prompt.
 */

export type Strategy = {
  id: string;
  label: string;
  description: string;
  icon: 'brain' | 'help-circle' | 'list-ordered' | 'lightbulb';
};

export const STRATEGIES: Record<string, Strategy> = {
  RETRIEVAL_PRACTICE: {
    id: 'retrieval',
    label: 'Retrieval Practice',
    description: 'Alex will ask you to recall and explain concepts from memory, without looking at the text.',
    icon: 'brain',
  },
  // ELABORATIVE_INTERROGATION: {
  //   id: 'elaborative',
  //   label: 'Elaborative Interrogation',
  //   ref: 'Pressley et al. (1992)',
  //   description: 'Alex will ask "why" and "how" questions to deepen your understanding of facts.',
  //   icon: 'help-circle',
  // },
  // SELF_EXPLANATION: {
  //   id: 'self-explanation',
  //   label: 'Self-Explanation',
  //   ref: 'Chi et al. (1989)',
  //   description: 'Alex will ask you to explain processes and mechanisms step by step.',
  //   icon: 'list-ordered',
  // },
  // ANALOGICAL_REASONING: {
  //   id: 'analogy',
  //   label: 'Analogical Reasoning',
  //   ref: 'Gentner (1983)',
  //   description: 'Alex will suggest analogies and ask you to evaluate or improve them.',
  //   icon: 'lightbulb',
  // },
};

// Array format for easier mapping in components
export const STRATEGY_LIST = Object.values(STRATEGIES);

// Default strategy
export const DEFAULT_STRATEGY = STRATEGIES.RETRIEVAL_PRACTICE;
