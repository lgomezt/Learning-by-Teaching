import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode, MutableRefObject } from 'react';
import type { Strategy } from '../config/pedagogy';
import { DEFAULT_STRATEGY } from '../config/pedagogy';

// Canvas handle interface for tool calls
export interface CanvasHandle {
  addCard: (text: string, column: 'left' | 'right' | 'middle', isUnsure?: boolean) => string;
  setColumnLabels: (left: string, right: string) => void;
  getSnapshot: () => { cards: any[]; columnLabels: { left: string; right: string } };
}

// Message types
export type Message = {
  id: string;
  role: 'user' | 'alex';
  content: string;
  strategyId: string | null;
  timestamp: Date;
};

// Document types
export type UploadedDocument = {
  id: string;
  name: string;
  type: string;
  textContent: string;
  uploadedAt: Date;
};

// Conversation thread for each document
export type ConversationThread = {
  documentId: string;
  messages: Message[];
  strategySequence: string[];
};

// Context state interface
interface AppState {
  // Document state - multiple documents
  documents: UploadedDocument[];
  activeDocumentId: string | null;
  activeDocument: UploadedDocument | null;
  activeContext: string;
  
  // Pedagogy state
  activeStrategy: Strategy;
  
  // Chat state - per document conversation threads
  conversationThreads: Record<string, ConversationThread>;
  activeThread: ConversationThread | null;
  messages: Message[]; // Derived from activeThread
  isStreaming: boolean;
  isAnimating: boolean;
  
  // Session tracking for research export
  strategySequence: string[];
  
  // Canvas reference for tool calls (shared across all hook instances)
  canvasRef: MutableRefObject<CanvasHandle | null>;
}

// Context actions interface
interface AppActions {
  addDocument: (doc: Omit<UploadedDocument, 'id'>) => string; // Returns document ID
  setActiveDocument: (documentId: string | null) => void;
  removeDocument: (documentId: string) => void;
  setActiveStrategy: (strategy: Strategy) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsAnimating: (animating: boolean) => void;
  clearChat: () => void;
  getSessionData: () => SessionExport;
  setCanvasRef: (ref: CanvasHandle | null) => void;
}

// Session export format for research
export type SessionExport = {
  timestamp: string;
  document: {
    name: string;
    type: string;
    textLength: number;
  } | null;
  strategySequence: string[];
  messages: {
    role: string;
    content: string;
    strategy: string | null;
    timestamp: string;
  }[];
};

// Combined context type
type AppContextType = AppState & AppActions;

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  // Document state - multiple documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  
  // Pedagogy state
  const [activeStrategy, setActiveStrategyState] = useState<Strategy>(DEFAULT_STRATEGY);
  
  // Chat state - conversation threads per document
  const [conversationThreads, setConversationThreads] = useState<Record<string, ConversationThread>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Track strategy changes for research (from active thread)
  const [strategySequence, setStrategySequence] = useState<string[]>([DEFAULT_STRATEGY.id]);
  
  // Canvas reference for tool calls (shared across all components)
  const canvasRef = useRef<CanvasHandle | null>(null);
  
  const setCanvasRef = useCallback((ref: CanvasHandle | null) => {
    canvasRef.current = ref;
  }, []);

  // Derived state
  const activeDocument = documents.find(d => d.id === activeDocumentId) || null;
  const activeContext = activeDocument?.textContent || '';
  const activeThread = activeDocumentId ? conversationThreads[activeDocumentId] : null;
  const messages = activeThread?.messages || [];

  // Actions
  const addDocument = useCallback((doc: Omit<UploadedDocument, 'id'>): string => {
    const docId = generateId();
    const newDoc: UploadedDocument = {
      ...doc,
      id: docId,
    };
    
    setDocuments(prev => [...prev, newDoc]);
    
    // Create a new conversation thread for this document
    setConversationThreads(prev => ({
      ...prev,
      [docId]: {
        documentId: docId,
        messages: [],
        strategySequence: [activeStrategy.id],
      },
    }));
    
    // Set as active document
    setActiveDocumentId(docId);
    
    return docId;
  }, [activeStrategy.id]);

  const setActiveDocument = useCallback((documentId: string | null) => {
    setActiveDocumentId(documentId);
    
    // Initialize thread if it doesn't exist
    if (documentId && !conversationThreads[documentId]) {
      setConversationThreads(prev => ({
        ...prev,
        [documentId]: {
          documentId,
          messages: [],
          strategySequence: [activeStrategy.id],
        },
      }));
    }
    
    // Update strategy sequence from active thread
    if (documentId && conversationThreads[documentId]) {
      setStrategySequence(conversationThreads[documentId].strategySequence);
    }
  }, [conversationThreads, activeStrategy.id]);

  const removeDocument = useCallback((documentId: string) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== documentId);
      
      // If removing active document, switch to another or clear
      if (activeDocumentId === documentId) {
        setActiveDocumentId(updated.length > 0 ? updated[0].id : null);
      }
      
      return updated;
    });
    
    setConversationThreads(prev => {
      const updated = { ...prev };
      delete updated[documentId];
      return updated;
    });
  }, [activeDocumentId]);

  const setActiveStrategy = useCallback((strategy: Strategy) => {
    setActiveStrategyState(strategy);
    
    // Update strategy sequence in active thread
    if (activeDocumentId) {
      setConversationThreads(prev => {
        if (!prev[activeDocumentId]) return prev;
        return {
          ...prev,
          [activeDocumentId]: {
            ...prev[activeDocumentId],
            strategySequence: [...prev[activeDocumentId].strategySequence, strategy.id],
          },
        };
      });
      setStrategySequence(prev => [...prev, strategy.id]);
    }
  }, [activeDocumentId]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!activeDocumentId) return;
    
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    
    setConversationThreads(prev => {
      if (!prev[activeDocumentId]) return prev;
      return {
        ...prev,
        [activeDocumentId]: {
          ...prev[activeDocumentId],
          messages: [...prev[activeDocumentId].messages, newMessage],
        },
      };
    });
  }, [activeDocumentId]);

  const updateLastMessage = useCallback((content: string) => {
    if (!activeDocumentId) return;
    
    setConversationThreads(prev => {
      if (!prev[activeDocumentId] || prev[activeDocumentId].messages.length === 0) return prev;
      
      const updated = { ...prev };
      const messages = [...updated[activeDocumentId].messages];
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content,
      };
      
      return {
        ...updated,
        [activeDocumentId]: {
          ...updated[activeDocumentId],
          messages,
        },
      };
    });
  }, [activeDocumentId]);

  const setIsStreamingState = useCallback((streaming: boolean) => {
    setIsStreaming(streaming);
    // When streaming starts, animation also starts
    // When streaming ends, animation continues until all characters are revealed
    if (streaming) {
      setIsAnimating(true);
    }
    // Note: isAnimating is set to false by MessageBubble when animation completes
  }, []);

  const setIsAnimatingState = useCallback((animating: boolean) => {
    setIsAnimating(animating);
  }, []);

  const clearChat = useCallback(() => {
    if (!activeDocumentId) return;
    
    setConversationThreads(prev => {
      if (!prev[activeDocumentId]) return prev;
      return {
        ...prev,
        [activeDocumentId]: {
          ...prev[activeDocumentId],
          messages: [],
          strategySequence: [activeStrategy.id],
        },
      };
    });
    setStrategySequence([activeStrategy.id]);
  }, [activeDocumentId, activeStrategy.id]);

  const getSessionData = useCallback((): SessionExport => {
    return {
      timestamp: new Date().toISOString(),
      document: activeDocument ? {
        name: activeDocument.name,
        type: activeDocument.type,
        textLength: activeDocument.textContent.length,
      } : null,
      strategySequence: activeThread?.strategySequence || strategySequence,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        strategy: msg.strategyId,
        timestamp: msg.timestamp.toISOString(),
      })),
    };
  }, [activeDocument, activeThread, strategySequence, messages]);

  const value: AppContextType = {
    // State
    documents,
    activeDocumentId,
    activeDocument,
    activeContext,
    activeStrategy,
    conversationThreads,
    activeThread,
    messages,
    isStreaming,
    isAnimating,
    strategySequence,
    canvasRef,
    
    // Actions
    addDocument,
    setActiveDocument,
    removeDocument,
    setActiveStrategy,
    addMessage,
    updateLastMessage,
    setIsStreaming: setIsStreamingState,
    setIsAnimating: setIsAnimatingState,
    clearChat,
    getSessionData,
    setCanvasRef,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks for specific parts of state
export function useDocument() {
  const { 
    documents, 
    activeDocument, 
    activeContext, 
    activeDocumentId,
    addDocument, 
    setActiveDocument, 
    removeDocument 
  } = useApp();
  return { 
    documents, 
    activeDocument, 
    activeContext, 
    activeDocumentId,
    addDocument, 
    setActiveDocument, 
    removeDocument 
  };
}

export function useStrategy() {
  const { activeStrategy, setActiveStrategy } = useApp();
  return { activeStrategy, setActiveStrategy };
}

export function useChat() {
  const { messages, isStreaming, isAnimating, addMessage, updateLastMessage, setIsStreaming, setIsAnimating, clearChat } = useApp();
  return { messages, isStreaming, isAnimating, addMessage, updateLastMessage, setIsStreaming, setIsAnimating, clearChat };
}

export function useSession() {
  const { getSessionData, strategySequence } = useApp();
  return { getSessionData, strategySequence };
}
