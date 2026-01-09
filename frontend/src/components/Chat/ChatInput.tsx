import { useState, useCallback, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSend, 
  disabled = false, 
  isLoading = false,
  placeholder = "Teach Alex about the material..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate the new height, but ensure minimum of 48px
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 48;
    const maxHeight = 150;
    
    // Only set height if scrollHeight is greater than minHeight, otherwise use minHeight
    if (scrollHeight > minHeight) {
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      // Show scrollbar only if content exceeds maxHeight
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    } else {
      textarea.style.height = `${minHeight}px`;
      textarea.style.overflowY = 'hidden';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed);
      setMessage('');
    }
  }, [message, disabled, isLoading, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const isDisabled = disabled || isLoading;
  const canSend = message.trim().length > 0 && !isDisabled;

  return (
    <div className="p-4 border-t border-bark-200 bg-cream-50">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className={`
              w-full px-4 py-3 pr-12 rounded-xl resize-none
              bg-white border border-bark-200 
              text-bark-800 placeholder-bark-400
              focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            `}
            style={{
              minHeight: '48px',
              maxHeight: '150px',
              overflowY: 'hidden',
            }}
          />
        </div>

        <motion.button
          onClick={handleSend}
          disabled={!canSend}
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
          className={`
            flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
            transition-all duration-200
            ${canSend 
              ? 'bg-sage-600 text-white hover:bg-sage-700 shadow-md' 
              : 'bg-bark-100 text-bark-400 cursor-not-allowed'}
          `}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      <p className="mt-2 text-xs text-bark-400 text-center">
        Press <kbd className="px-1.5 py-0.5 rounded bg-bark-100 font-mono text-[10px]">Enter</kbd> to send, 
        <kbd className="px-1.5 py-0.5 rounded bg-bark-100 font-mono text-[10px] ml-1">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
