import { useState, useEffect, useRef } from "react";

// what a single event in our conversation history looks like.
type HistoryEvent = {
  author: 'user' | 'agent';
  type: 'chat' | 'code';
  content: string;
};

type ChatbotProps = {
  messages: HistoryEvent[];
  setMessages: React.Dispatch<React.SetStateAction<HistoryEvent[]>>;
  problemStatement: string;
  userCodeT0: string;
  userCodeT1: string;
  agentCodeT0: string;
  agentCodeT1: string;
  onAgentCodeUpdate: (newCode: string) => void;
  lessonGoals: string[];
  commonMistakes: string[];
};

function Chatbot({
    messages,
    setMessages,
    problemStatement, 
    userCodeT0,
    userCodeT1,
    agentCodeT0,
    agentCodeT1,
    onAgentCodeUpdate,
    lessonGoals,
    commonMistakes,
}: ChatbotProps) {

    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages.length > 0) {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    async function sendMessage() {
        if (!input.trim()) return;

        // Construct the user's turn in the conversation history
        const userChatEvent: HistoryEvent = { 
            author: 'user', 
            type: 'chat', 
            content: input 
        };

        // Create the complete, updated history that we will use for BOTH the API call and for setting the new state.
        const updatedMessages = [...messages, userChatEvent];

        // We update the UI with the user's message immediately.
        setMessages(updatedMessages);
        setInput("");

        // Build the full `conversationHistory` payload for the backend.
        const conversationHistory: HistoryEvent[] = [
            ...messages, // All previous events
            { author: 'agent', type: 'code', content: agentCodeT1 }, // Agent's last code
            userChatEvent, // The new user message we just created
            { author: 'user', type: 'code', content: userCodeT1 }, // User's current code
        ];

        try {
            const res = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_history: conversationHistory,
                    problem_statement: problemStatement,
                    lesson_goals: lessonGoals,
                    common_mistakes: commonMistakes
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            // Create new HistoryEvent objects from the agent's response.
            // The agent's turn consists of a chat message and potentially new code.
            const newEvents: HistoryEvent[] = [];

            // Add the agent's chat response.
            newEvents.push({
                author: 'agent',
                type: 'chat',
                content: data.content,
            });

            // If the agent provided new code, update the parent component's state
            // and also add a 'code' event to our history.
            if (data.updated_code) {
                onAgentCodeUpdate(data.updated_code);
                newEvents.push({
                    author: 'agent',
                    type: 'code',
                    content: data.updated_code,
                });
            }

            // Update the history state with the agent's complete turn.
            // setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
            setMessages(prevMessages => [...prevMessages, ...newEvents]);

        } catch (err) {
            console.error(err);
            // setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong..." }]);

            // If something goes wrong, add an error message to the chat.
            const errorEvent: HistoryEvent = { 
                author: 'agent', 
                type: 'chat', 
                content: "Sorry, something went wrong..." 
            };
            
            setMessages(prevMessages => [...prevMessages, errorEvent]);
        }
    }
        
    return (
        <div className="flex flex-row flex-2 min-h-0 bg-slate-900 border-slate-700">
            <div className={`flex flex-col flex-2`}>
                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-m font-medium text-slate-100">Coding Peer</h2>
                        </div>
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`flex-1 ${messages.length > 0 ? 'overflow-y-auto' : ''} p-4 space-y-4`}>
                    {messages.length === 0 ? (
                        /* Welcome message */
                        <div className="flex flex-col h-full items-center justify-center text-center text-slate-400">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                            <p className="text-sm max-w-sm">Ask me anything about your code, get suggestions, or discuss the problem approach.</p>
                        </div>
                    ) : (
                        messages
                            .filter(msg => msg.type === 'chat')
                            .map((msg, index) => (
                                <div key={index} className={`flex ${msg.author === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                        msg.author === "user" 
                                            ? "bg-emerald-500 text-white rounded-br-md" 
                                            : "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-md"
                                    } overflow-auto whitespace-pre-wrap break-words`}>
                                        {msg.content}
                                    </div>
                                </div>
                        ))
                    )}
                    <div ref={scrollRef}/>
                </div>

                {/* Input Box */}
                <div className="flex p-4 bg-slate-800 border-t border-slate-700">
                    <div className="flex-1 relative">
                        <input
                            className="w-full border border-slate-700 rounded-full px-6 py-3 pr-12 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-500 transition-all"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Talk to your AI peer..."
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );}

export default Chatbot;