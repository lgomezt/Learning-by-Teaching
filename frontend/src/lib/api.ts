/**
 * API Client for the Protégé Backend
 * Updated: handles canvas state and tool calls for comparison mode
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Canvas state types - supports both legacy T-chart and new freeform canvas

// Legacy T-chart card format
export interface LegacyCanvasCardState {
  id: string;
  text: string;
  x: number;
  y: number;
  column: 'left' | 'right' | 'middle';
  color?: string;
}

// New freeform canvas types
export interface ConceptBoxState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FreeformCardState {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string | null;
  isUnsure: boolean;
  createdAt: number;
}

export interface DrawingStrokeState {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

// Union type for backward compatibility - can be either legacy or freeform format
export type CanvasState =
  | {
      // Legacy T-chart format
      cards: LegacyCanvasCardState[];
      columnLabels: { left: string; right: string };
    }
  | {
      // New freeform canvas format
      conceptBoxes: ConceptBoxState[];
      cards: FreeformCardState[];
      drawings: DrawingStrokeState[];
    };

// Alias for backward compatibility
export type CanvasCardState = LegacyCanvasCardState;

// Tool call types for agent actions
export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export interface AddToCanvasArgs {
  text: string;
  column: 'left' | 'right' | 'middle';
  is_unsure?: boolean;
}

export interface SetColumnLabelsArgs {
  left: string;
  right: string;
}

// Chat response types
export interface ChatStreamEvent {
  type: 'text' | 'tool_call' | 'done' | 'error';
  text?: string;
  tool_call?: ToolCall;
  error?: string;
}

export interface ChatRequest {
  message: string;
  context: string;
  strategy_id: string | null;
  history: Array<{ role: string; content: string }>;
  canvas_state?: CanvasState;
}

export interface InitRequest {
  context: string;
  strategy_id: string | null;
}

/**
 * Stream a chat response from the backend using SSE
 * Now yields ChatStreamEvent to handle both text and tool calls
 */
export async function* streamChat(request: ChatRequest): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            
            // Handle text chunks
            if (parsed.text) {
              yield { type: 'text', text: parsed.text };
            }
            
            // Handle tool calls
            if (parsed.tool_call) {
              yield { type: 'tool_call', tool_call: parsed.tool_call };
            }
            
            // Handle completion
            if (parsed.status === 'complete') {
              yield { type: 'done' };
            }
            
            // Handle errors
            if (parsed.error) {
              yield { type: 'error', error: parsed.error };
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Get initial message from Alex when a document is uploaded
 */
export async function getInitialMessage(request: InitRequest): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.message;
}

/**
 * Upload a file and extract text content using the backend
 */
export async function uploadFile(file: File): Promise<{ text: string; filename: string; content_type: string | null }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to process file' }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Check if the backend is available
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch {
    return false;
  }
}
