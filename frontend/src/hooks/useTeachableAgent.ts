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
      case 'addToCanvas': {
        const args = toolCall.arguments as {
          text: string;
          column: 'left' | 'right' | 'middle';
          is_unsure?: boolean;
        };
        canvas.addCard(args.text, args.column, args.is_unsure);
        break;
      }
      case 'setColumnLabels': {
        const args = toolCall.arguments as { left: string; right: string };
        canvas.setColumnLabels(args.left, args.right);
        break;
      }
      default:
        console.warn('[useTeachableAgent] Unknown tool:', toolCall.name);
    }
  }, [canvasRef]);

  /**
   * Get canvas state for API requests
   */
  const getCanvasState = useCallback((): CanvasState | undefined => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    
    const snapshot = canvas.getSnapshot();
    return {
      cards: snapshot.cards.map(card => ({
        id: card.id,
        text: card.text,
        x: card.x,
        y: card.y,
        column: card.column,
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
