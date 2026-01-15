// Canvas type definitions for the freeform comparison canvas

// Color palette for concept boxes
export const CONCEPT_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
] as const;

export type ConceptColor = (typeof CONCEPT_COLORS)[number];

// A draggable concept category box
export interface ConceptBox {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// A draggable card with user explanation
export interface CanvasCard {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string | null; // null = unassigned (gray)
  isUnsure: boolean;
  createdAt: number;
}

// A freehand drawing stroke
export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

// Complete canvas state
export interface CanvasState {
  conceptBoxes: ConceptBox[];
  cards: CanvasCard[];
  drawings: DrawingStroke[];
}

// Imperative handle for the canvas (used by useTeachableAgent)
export interface FreeformCanvasHandle {
  createConceptBox: (name: string, color: string) => string;
  createCard: (text: string, color?: string) => string;
  getSnapshot: () => CanvasState;
  getStateDescription: () => string;
}

// Canvas interaction modes
export type CanvasMode = 'select' | 'draw';

// Drawing tool options
export interface DrawingOptions {
  color: string;
  strokeWidth: number;
}

// Position type for drag operations
export interface Position {
  x: number;
  y: number;
}

// Drag state for hooks
export interface DragState {
  isDragging: boolean;
  startPosition: Position | null;
  currentPosition: Position | null;
  offset: Position | null;
}
