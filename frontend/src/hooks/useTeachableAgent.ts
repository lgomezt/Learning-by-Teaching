import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { streamChat, getInitialMessage } from '../lib/api';
import type { CanvasState, ToolCall } from '../lib/api';

export function useTeachableAgent() {
  const {
    activeContext,
    activeStrategy,
    messages,
    addMessage,
    updateLastMessage,
    setIsStreaming,
    canvasRef,
    setCanvasRef,
  } = useApp();

  /**
   * Execute a tool call on the canvas
   */
  const executeToolCall = useCallback((toolCall: ToolCall) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('[useTeachableAgent] No canvas reference, cannot execute tool call');
      return;
    }

    console.log('[useTeachableAgent] Executing tool call:', toolCall.name);

    switch (toolCall.name) {
      // New freeform canvas tools
      case 'createConceptBox': {
        const args = toolCall.arguments as { name: string; color: string };
        if ('createConceptBox' in canvas) {
          canvas.createConceptBox(args.name, args.color);
        } else {
          console.warn('[useTeachableAgent] Canvas does not support createConceptBox');
        }
        break;
      }
      case 'createCard': {
        const args = toolCall.arguments as { text: string; color?: string };
        if ('createCard' in canvas) {
          canvas.createCard(args.text, args.color);
        } else if ('addCard' in canvas) {
          // Fallback for legacy canvas - put in middle column
          (canvas as { addCard: (text: string, column: string, isUnsure?: boolean) => void })
            .addCard(args.text, 'middle', false);
        }
        break;
      }
      case 'suggestChunking': {
        // This is informational - the agent will include text explaining why
        // No canvas action needed, just log it
        const args = toolCall.arguments as { reason: string };
        console.log('[useTeachableAgent] Chunking suggested:', args.reason);
        break;
      }
      // Legacy tools for backward compatibility
      case 'addToCanvas': {
        const args = toolCall.arguments as {
          text: string;
          column: 'left' | 'right' | 'middle';
          is_unsure?: boolean;
        };
        if ('addCard' in canvas) {
          (canvas as { addCard: (text: string, column: string, isUnsure?: boolean) => void })
            .addCard(args.text, args.column, args.is_unsure);
        } else if ('createCard' in canvas) {
          // New canvas - create card without column assignment
          canvas.createCard(args.text);
        }
        break;
      }
      case 'setColumnLabels': {
        const args = toolCall.arguments as { left: string; right: string };
        if ('setColumnLabels' in canvas) {
          (canvas as { setColumnLabels: (left: string, right: string) => void })
            .setColumnLabels(args.left, args.right);
        } else if ('createConceptBox' in canvas) {
          // New canvas - create concept boxes instead
          canvas.createConceptBox(args.left, '#3b82f6');
          canvas.createConceptBox(args.right, '#ef4444');
        }
        break;
      }
      default:
        console.warn('[useTeachableAgent] Unknown tool:', toolCall.name);
    }
  }, [canvasRef]);

  /**
   * Get canvas state for API requests
   * Supports both new freeform canvas and legacy T-chart format
   */
  const getCanvasState = useCallback((): CanvasState | undefined => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const snapshot = canvas.getSnapshot();

    // Check if it's the new freeform canvas format
    if ('conceptBoxes' in snapshot) {
      // New freeform canvas format
      return {
        conceptBoxes: snapshot.conceptBoxes,
        cards: snapshot.cards,
        drawings: snapshot.drawings || [],
      };
    }

    // Legacy T-chart format
    return {
      cards: snapshot.cards.map((card: { id: string; text: string; x: number; y: number; column: string }) => ({
        id: card.id,
        text: card.text,
        x: card.x,
        y: card.y,
        column: card.column as 'left' | 'right' | 'middle',
      })),
      columnLabels: snapshot.columnLabels,
    };
  }, [canvasRef]);

  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(async (content: string, canvasSnapshot?: CanvasState) => {
    // Add user message
    addMessage({
      role: 'user',
      content,
      strategyId: null,
    });

    // Prepare chat history for API (exclude the message we just added)
    const history = messages.map(msg => ({
      role: msg.role === 'alex' ? 'model' : 'user',
      content: msg.content,
    }));

    // Add placeholder for Alex's response
    addMessage({
      role: 'alex',
      content: '',
      strategyId: activeStrategy.id,
    });

    setIsStreaming(true);

    try {
      let fullResponse = '';
      const pendingToolCalls: ToolCall[] = [];

      // Use provided canvas snapshot or get current state
      const canvas_state = canvasSnapshot || getCanvasState();

      for await (const event of streamChat({
        message: content,
        context: activeContext,
        strategy_id: activeStrategy.id,
        history,
        canvas_state,
      })) {
        switch (event.type) {
          case 'text':
            if (event.text) {
              fullResponse += event.text;
              updateLastMessage(fullResponse);
            }
            break;
          
          case 'tool_call':
            if (event.tool_call) {
              // Execute tool calls immediately for real-time canvas updates
              executeToolCall(event.tool_call);
              pendingToolCalls.push(event.tool_call);
            }
            break;
          
          case 'error':
            console.error('[Streaming] Error:', event.error);
            break;
          
          case 'done':
            console.log('[Streaming] Complete. Tool calls executed:', pendingToolCalls.length);
            break;
        }
      }

      // If no text was received but tool calls were made, add a fallback message
      if (fullResponse.trim() === '' && pendingToolCalls.length > 0) {
        updateLastMessage(`*updating the board...*`);
      } else if (fullResponse.trim() === '') {
        // No text and no tool calls - something went wrong
        updateLastMessage("Hmm, let me think about that...");
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      updateLastMessage(
        "Hmm, I'm having trouble connecting right now. Can you try again? " +
        "(Make sure the backend server is running on localhost:8000)"
      );
    } finally {
      setIsStreaming(false);
    }
  }, [activeContext, activeStrategy, messages, addMessage, updateLastMessage, setIsStreaming, getCanvasState, executeToolCall]);

  /**
   * Request an initial message from Alex when a new document is loaded
   */
  const requestInitialMessage = useCallback(async (strategyId?: string) => {
    // Use provided strategyId or fall back to activeStrategy
    const strategyToUse = strategyId || activeStrategy.id;
    
    setIsStreaming(true);

    // Add placeholder for Alex's response
    addMessage({
      role: 'alex',
      content: '',
      strategyId: strategyToUse,
    });

    try {
      const message = await getInitialMessage({
        context: activeContext,
        strategy_id: strategyToUse,
      });
      updateLastMessage(message);
    } catch (error) {
      console.error('Error getting initial message:', error);
      updateLastMessage(
        "Hey! I'm excited to study together! What should we focus on first? " +
        "(Note: Backend connection failed - running in demo mode)"
      );
    } finally {
      setIsStreaming(false);
    }
  }, [activeContext, activeStrategy.id, addMessage, updateLastMessage, setIsStreaming]);

  return {
    sendMessage,
    requestInitialMessage,
    setCanvasRef,
    canvasRef,
  };
}
