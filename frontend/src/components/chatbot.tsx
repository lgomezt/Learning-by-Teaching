import { useState, useEffect, useRef } from "react";

type ChatbotProps = {
  isOpen: boolean;
  userCode?: string;
  setUserCode?: any;
  agentCode?: string;
  setAgentCode?: any;
};

function Chatbot({ isOpen, userCode, setUserCode, agentCode, setAgentCode }: ChatbotProps) {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim()) return;

        // Add user message to messages state
        const updatedMessages = [...messages, { role: "user", content: input }];
        setMessages(updatedMessages);
        setInput("");

        console.log(userCode);

        try {
            const res = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    user_code: userCode,
                    agent_code: agentCode,
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            // Update agent code if backend returned new or modified code
            if (data.updated_code) {
                setAgentCode(data.updated_code);
            }

            // Append assistant's response message
            setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong..." }]);
        }
    }

    return (
        <div className={`flex flex-col flex-1 h-[calc(99vh-5rem)]`}>
            {/* Header */}
            <div className="flex my-4 mx-15 p-2 bg-[#3a3a54] rounded-full items-center justify-center">
                <div className="h-3 w-3 bg-green-400 rounded-full mr-2"></div>
                <span className="text-white font-mono text-m font-semibold">AI Peer</span>
            </div>
            
            {/* Chat Window */}
            <div className={`flex-1 overflow-y-auto p-4 ${isOpen ? "w-[calc((100vw/3)-4rem)]" : "w-[calc(100vw/3)]"}`}>
            {messages.map((msg, index) => (
                <div key={index} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`px-8 py-2 rounded-2xl ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"} overflow-auto whitespace-pre-wrap break-words`}>
                        {msg.content}
                    </div>
                </div>
            ))} <div ref={scrollRef}/>
            </div>

            {/* Input box */}
            <div className="flex p-4">
                <input
                    className="flex-1 border rounded-full px-6 py-2 mr-2 bg-white"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                />
                <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default Chatbot;
