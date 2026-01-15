import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Upload } from 'lucide-react';
import { useChat, useDocument, useStrategy } from '../../context/AppContext';
import type { Message } from '../../context/AppContext';
import { useTeachableAgent } from '../../hooks/useTeachableAgent';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { ComparisonWorkspace } from '../Canvas/ComparisonWorkspace';
import type { CanvasSnapshot } from '../Canvas/TldrawCanvas';

interface ChatWindowProps {
  onSendMessage: (message: string, canvasSnapshot?: CanvasSnapshot) => void;
}

export function ChatWindow({ onSendMessage }: ChatWindowProps) {
  const { messages, isStreaming } = useChat();
  const { activeDocument, activeContext } = useDocument();
  const { activeStrategy } = useStrategy();
  const { requestInitialMessage } = useTeachableAgent();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if we're in comparison mode
  const isComparisonMode = activeStrategy.id === 'comparison';

  // Auto-scroll to bottom on new messages (for regular chat mode)
  useEffect(() => {
    if (!isComparisonMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, isComparisonMode]);

  // Trigger initial message when a new document is uploaded or switched to a document with no messages
  // Only for regular chat mode - comparison workspace handles its own initial message
  useEffect(() => {
    if (!isComparisonMode && activeDocument && activeContext && messages.length === 0 && !isStreaming) {
      // Use a small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        requestInitialMessage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeDocument?.id, activeContext, messages.length, isStreaming, requestInitialMessage, isComparisonMode]);

  // Render comparison workspace for comparison strategy
  if (isComparisonMode) {
    return <ComparisonWorkspace onSendMessage={onSendMessage} />;
  }

  const hasDocument = !!activeDocument;
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Alex's name and current document */}
      {hasDocument && (
        <div 
          className="flex-shrink-0 px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: '#ddd6cb' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: '#2d5a4d' }}
            >
              <span className="text-sm font-semibold">A</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#1a1a1a' }}>
                Teaching Alex
              </h2>
              <p className="text-sm" style={{ color: '#5a5a5a' }}>
                Currently studying: {activeDocument.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!hasDocument ? (
            // Empty state - No document
            <motion.div
              key="no-document"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center p-8"
            >
              <div className="text-center max-w-md">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center mb-6"
                >
                  <Upload className="w-10 h-10 text-sage-600" />
                </motion.div>
                <h2 className="text-xl font-semibold text-bark-800 mb-2">
                  Start Studying with Alex
                </h2>
                <p className="text-bark-500 leading-relaxed">
                  Upload a document to begin. Alex will ask you questions about the material, 
                  helping you learn by teaching.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-sage-600">
                  <BookOpen className="w-4 h-4" />
                  <span>PDF, TXT, or Markdown supported</span>
                </div>
              </div>
            </motion.div>
          ) : !hasMessages ? (
            // Empty state - Document loaded, waiting for conversation
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center p-8"
            >
              <div className="text-center max-w-md">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center mb-6"
                >
                  <span className="text-3xl font-bold text-white">A</span>
                </motion.div>
                <h2 className="text-xl font-semibold text-bark-800 mb-2">
                  Alex is Ready to Learn!
                </h2>
                <p className="text-bark-500 leading-relaxed">
                  Start the conversation by sending a message. Alex will ask questions 
                  using the <span className="font-medium text-sage-600">{activeStrategy.label}</span> strategy.
                </p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 rounded-xl bg-cream-100 border border-bark-200"
                >
                  <p className="text-sm text-bark-600 italic">
                    Try: "Hey Alex, let's study {activeDocument.name} together!"
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            // Messages
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6"
            >
              {messages.map((message: Message, index: number) => {
                const isLastMessage = index === messages.length - 1;
                const isLastAlexMessage = isLastMessage && message.role === 'alex';
                return (
                  <MessageBubble 
                    key={message.id} 
                    message={message}
                    isStreaming={isStreaming && isLastAlexMessage}
                    isLastAlexMessage={isLastAlexMessage}
                  />
                );
              })}
              
              {isStreaming && messages[messages.length - 1]?.role !== 'alex' && (
                <div className="flex gap-4 mb-8">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: '#2d5a4d' }}
                  >
                    <span className="text-sm font-semibold">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Alex</span>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider"
                        style={{
                          backgroundColor: activeStrategy.color,
                          color: '#ffffff',
                          letterSpacing: '0.06em'
                        }}
                      >
                        {activeStrategy.label}
                      </span>
                    </div>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <ChatInput
        onSend={onSendMessage}
        disabled={!hasDocument}
        isLoading={isStreaming}
        placeholder={
          !hasDocument 
            ? "Upload a document first..." 
            : "Teach Alex about the material..."
        }
      />
    </div>
  );
}
