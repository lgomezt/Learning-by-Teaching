import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Upload } from 'lucide-react';
import { useChat, useDocument, useStrategy } from '../../context/AppContext';
import type { Message } from '../../context/AppContext';
import { useTeachableAgent } from '../../hooks/useTeachableAgent';
import { MessageBubble } from '../Chat/MessageBubble';
import { TypingIndicator } from '../Chat/TypingIndicator';
import { ChatInput } from '../Chat/ChatInput';
import { SimpleCanvas } from './SimpleCanvas';
import type { SimpleCanvasHandle, CanvasSnapshot } from './SimpleCanvas';

interface ComparisonWorkspaceProps {
  onSendMessage: (message: string, canvasSnapshot?: CanvasSnapshot) => void;
}

export function ComparisonWorkspace({ onSendMessage }: ComparisonWorkspaceProps) {
  const { messages, isStreaming } = useChat();
  const { activeDocument, activeContext } = useDocument();
  const { activeStrategy } = useStrategy();
  const { requestInitialMessage, setCanvasRef } = useTeachableAgent();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<SimpleCanvasHandle>(null);

  // Handle canvas ready - called by SimpleCanvas when it's loaded
  const handleCanvasReady = useCallback((handle: SimpleCanvasHandle) => {
    setCanvasRef(handle);
  }, [setCanvasRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setCanvasRef(null);
    };
  }, [setCanvasRef]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Trigger initial message when a new document is uploaded
  useEffect(() => {
    if (activeDocument && activeContext && messages.length === 0 && !isStreaming) {
      const timer = setTimeout(() => {
        requestInitialMessage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeDocument?.id, activeContext, messages.length, isStreaming, requestInitialMessage]);

  // Handle canvas changes
  const handleCanvasChange = useCallback((snapshot: CanvasSnapshot) => {
    // Store the latest snapshot for when user sends a message
    // This is handled by the parent component through getSnapshot
    console.log('[Canvas] State changed:', snapshot.cards.length, 'cards');
  }, []);

  // Handle sending message with canvas state
  const handleSendMessage = useCallback((content: string) => {
    const snapshot = canvasRef.current?.getSnapshot();
    onSendMessage(content, snapshot);
  }, [onSendMessage]);

  const hasDocument = !!activeDocument;
  const hasMessages = messages.length > 0;

  // No document state
  if (!hasDocument) {
    return (
      <div className="flex flex-col h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Whiteboard Area - 60% */}
      <motion.div
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative"
        style={{ 
          height: '60%',
          backgroundColor: '#f8f5f0',
        }}
      >
        <SimpleCanvas
          ref={canvasRef}
          onShapeChange={handleCanvasChange}
          onReady={handleCanvasReady}
          initialLeftLabel="Category A"
          initialRightLabel="Category B"
        />
      </motion.div>

      {/* Chat Area - 40% */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col"
        style={{ 
          height: '40%',
          backgroundColor: '#fdfcfa',
        }}
      >
        {/* Compact Header */}
        <div 
          className="flex-shrink-0 px-4 py-2 flex items-center gap-3"
          style={{ borderTop: '1px solid #e8e4de' }}
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: '#2d5a4d' }}
          >
            <span className="text-xs font-semibold">A</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
              Teaching Alex
            </h2>
            <p className="text-xs" style={{ color: '#5a5a5a' }}>
              {activeDocument.name}
            </p>
          </div>
        </div>

        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {!hasMessages ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-sm">
                <p className="text-sm text-bark-500">
                  Alex will start by helping you set up the comparison board.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
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
                <div className="flex gap-3">
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: '#2d5a4d' }}
                  >
                    <span className="text-xs font-semibold">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Alex</span>
                      <span 
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
                        style={{
                          backgroundColor: activeStrategy.color,
                          color: '#ffffff',
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
            </div>
          )}
        </div>

        {/* Compact Input */}
        <div className="flex-shrink-0 px-4 pb-3">
          <ChatInput
            onSend={handleSendMessage}
            disabled={!hasDocument}
            isLoading={isStreaming}
            placeholder="Teach Alex about the concepts..."
          />
        </div>
      </motion.div>
    </div>
  );
}

// Export the canvas ref getter for external access
export function useComparisonCanvas() {
  const canvasRef = useRef<SimpleCanvasHandle>(null);
  return canvasRef;
}
