import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import type { Message } from '../../context/AppContext';
import { useChat } from '../../context/AppContext';
import { getStrategyById, DEFAULT_STRATEGY } from '../../config/pedagogy';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isLastAlexMessage?: boolean;
}

// Generate typing delay using normal distribution
function getTypingDelay(): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const delay = 25 + (z * 10); // mean=25ms, std=10ms
  return Math.max(10, Math.min(50, delay)); // clamp between 10-50ms
}

// Component for character-by-character typing animation
function TypedText({ text, isNew, onAnimationComplete }: { text: string; isNew: boolean; onAnimationComplete?: () => void }) {
  const [revealedLength, setRevealedLength] = useState(0);
  // Track if we should animate - once set to false (old message), never animate
  const shouldAnimateRef = useRef(isNew);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNotifiedRef = useRef(false);

  // Animation effect - runs whenever we need to reveal more characters
  useEffect(() => {
    // If this was never a "new" message, show all text immediately
    if (!shouldAnimateRef.current) {
      setRevealedLength(text.length);
      return;
    }

    // Clear any pending timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Schedule next character if there's more to reveal
    if (revealedLength < text.length) {
      const delay = getTypingDelay();
      animationTimeoutRef.current = setTimeout(() => {
        setRevealedLength(prev => prev + 1);
      }, delay);
    } else if (revealedLength >= text.length && text.length > 0 && !hasNotifiedRef.current && onAnimationComplete) {
      // Animation complete - only when there's actual content (text.length > 0)
      hasNotifiedRef.current = true;
      // Small delay to ensure the last character is rendered
      setTimeout(() => {
        onAnimationComplete();
      }, 50);
    }
    
    // Reset hasNotifiedRef if text was empty but now has content (content arrived after initial empty state)
    if (text.length > 0 && hasNotifiedRef.current && revealedLength < text.length) {
      hasNotifiedRef.current = false;
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [text.length, revealedLength, onAnimationComplete]);

  const revealedText = text.slice(0, revealedLength);
  // Show cursor when animating (including when empty/waiting for text)
  const showCursor = shouldAnimateRef.current && (text.length === 0 || revealedLength < text.length);
  
  // If animation is complete (no cursor needed), render plain text for performance
  if (!showCursor && revealedLength >= text.length) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {revealedText}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0.3] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block w-2 h-[1.1em] ml-0.5 bg-current align-text-bottom rounded-sm"
        />
      )}
    </span>
  );
}

export function MessageBubble({ message, isStreaming = false, isLastAlexMessage = false }: MessageBubbleProps) {
  const isAlex = message.role === 'alex';
  const { setIsAnimating } = useChat();
  
  // Determine if this is a "new" message that should be animated
  // A message is new if it's streaming OR was created very recently (within 500ms)
  // This is only checked on initial mount - TypedText tracks its own animation state
  const messageAgeMs = Date.now() - message.timestamp.getTime();
  const isNewMessage = isStreaming || messageAgeMs < 500;
  
  // Get strategy for Alex messages (fallback to default if not found)
  const strategy = isAlex && message.strategyId 
    ? (getStrategyById(message.strategyId) || DEFAULT_STRATEGY)
    : null;

  // Handle animation completion - only for the last Alex message
  const handleAnimationComplete = () => {
    if (isLastAlexMessage && isAlex) {
      setIsAnimating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 mb-8"
    >
      {/* Avatar */}
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white"
        style={{
          backgroundColor: isAlex ? '#2d5a4d' : '#d97757'
        }}
      >
        {isAlex ? (
          <span className="text-sm font-semibold">A</span>
        ) : (
          <User className="w-5 h-5" />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Name and Role Badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
            {isAlex ? 'Alex' : 'You'}
          </span>
          <span 
            className="px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider"
            style={{
              backgroundColor: isAlex && strategy ? strategy.color : (isAlex ? 'rgba(217, 119, 87, 0.15)' : '#2d5a4d'),
              color: isAlex && strategy ? '#ffffff' : (isAlex ? '#d97757' : '#ffffff'),
              letterSpacing: '0.06em'
            }}
          >
            {isAlex ? (strategy ? strategy.label : 'STUDENT') : 'TEACHER'}
          </span>
        </div>

        {/* Message content - no bubble for Alex, container for Teacher */}
        {isAlex ? (
          // Student message: no container, text flows naturally
          <div>
            <p 
              className="text-base leading-[1.7] whitespace-pre-wrap"
              style={{ color: '#1a1a1a' }}
            >
              <TypedText 
                text={message.content} 
                isNew={isNewMessage} 
                onAnimationComplete={isLastAlexMessage ? handleAnimationComplete : undefined}
              />
            </p>
            <div 
              className="mt-1.5 text-xs"
              style={{ color: '#8a8a8a' }}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ) : (
          // Teacher message: beige container with padding
          <div 
            className="rounded-[20px] px-6 py-5"
            style={{
              backgroundColor: '#f5f1eb'
            }}
          >
            <p 
              className="text-base leading-[1.7] whitespace-pre-wrap"
              style={{ color: '#1a1a1a' }}
            >
              {message.content}
            </p>
            <div 
              className="mt-2 text-xs"
              style={{ color: '#8a8a8a' }}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
