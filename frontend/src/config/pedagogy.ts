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
  icon: 'brain' | 'help-circle' | 'list-ordered' | 'lightbulb' | 'check-square';
  color: string;
};

export const STRATEGIES: Record<string, Strategy> = {
  RETRIEVAL_PRACTICE: {
    id: 'retrieval',
    label: 'Learning by Remembering',
    description: 'Alex will act like they’ve forgotten a concept and ask you to explain it from memory.',
    icon: 'brain',
    color: '#3b82f6',
  },
  ELABORATIVE_INTERROGATION: {
    id: 'elaborative_interrogation',
    label: 'Learning by Explaining Why',
    description: 'Alex will ask you to explain the deeper logic and "why" behind specific facts or results.',
    icon: 'help-circle',
    color: '#8b5cf6',
  },
  COMPARISON: {
    id: 'comparison',
    label: 'Learning by Comparison',
    description: 'Alex will ask you to help distinguish between two similar or confusing terms side-by-side.',
    icon: 'check-square',
    color: '#f97316',
  },
  CRITIQUING: {
    id: 'critiquing',
    label: 'Learning by Critiquing',
    description: 'Alex will present two versions of an explanation and ask you to critique which one is better.',
    icon: 'help-circle',
    color: '#ef4444',
  },
  ANALOGIES: {
    id: 'analogies',
    label: 'Learning by Analogies',
    description: 'Alex will ask you for real-world examples or mental pictures to help visualize abstract ideas.',
    icon: 'lightbulb',
    color: '#14b8a6',
  },
};

// Array format for easier mapping in components
export const STRATEGY_LIST = Object.values(STRATEGIES);

// Default strategy
export const DEFAULT_STRATEGY = STRATEGIES.RETRIEVAL_PRACTICE;

// Helper function to get strategy by ID
export function getStrategyById(id: string): Strategy | undefined {
  return Object.values(STRATEGIES).find(s => s.id === id);
}
