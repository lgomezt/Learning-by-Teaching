import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { streamChat, getInitialMessage } from '../lib/api';

export function useTeachableAgent() {
  const {
    activeContext,
    activeStrategy,
    messages,
    addMessage,
    updateLastMessage,
    setIsStreaming,
  } = useApp();

  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(async (content: string) => {
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

      for await (const chunk of streamChat({
        message: content,
        context: activeContext,
        strategy_id: activeStrategy.id,
        history,
      })) {
        fullResponse += chunk;
        console.log('[Streaming] Chunk size:', chunk.length, 'Total length:', fullResponse.length, 'Chunk:', chunk.substring(0, 50));
        updateLastMessage(fullResponse);
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
  }, [activeContext, activeStrategy, messages, addMessage, updateLastMessage, setIsStreaming]);

  /**
   * Request an initial message from Alex when a new document is loaded
   * @param strategyId - Optional strategy ID to use. If not provided, uses activeStrategy.
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
  };
}
