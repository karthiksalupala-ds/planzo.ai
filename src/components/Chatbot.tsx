import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';
import { streamChatResponse } from '@/lib/stream-ai';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatbotProps {
  plan: any; 
  onClose: () => void;
}

const Chatbot = ({ plan, onClose }: ChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! How can I help you with this trip plan?", isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let fullResponse = '';
    const botMessage: Message = { text: '', isUser: false };
    setMessages((prev) => [...prev, botMessage]);

    await streamChatResponse({
      params: { query: input, planContext: JSON.stringify(plan) },
      onDelta: (chunk) => {
        fullResponse += chunk;
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, text: fullResponse } : msg
          )
        );
      },
      onDone: () => {
        setIsLoading(false);
      },
      onError: (err) => {
        console.error(err);
        const errorText = "Sorry, I couldn't get a response. Please try again.";
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, text: errorText } : msg
          )
        );
        setIsLoading(false);
      },
    });
  };

  return (
    <div className="fixed bottom-24 right-5 w-80 h-[28rem] bg-card shadow-xl rounded-2xl flex flex-col z-50 border">
      <div className="p-4 flex items-center justify-between border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI Assistant</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
            {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                {!msg.isUser && (
                    <div className="h-7 w-7 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                )}
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                {msg.text}
                </div>
            </div>
            ))}
            {isLoading && messages[messages.length-1].text === '' && (
                 <div className="flex items-end gap-2 justify-start">
                    <div className="h-7 w-7 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="p-3 rounded-2xl max-w-[85%] text-sm bg-muted rounded-bl-none">
                        <div className="h-2 w-2 animate-pulse bg-muted-foreground rounded-full" />
                    </div>
                </div>
            )}
        </div>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t bg-card">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !isLoading && (e.preventDefault(), handleSend())}
            placeholder="Ask a question..."
            rows={1}
            className="w-full bg-muted rounded-lg px-4 py-2.5 pr-12 text-sm outline-none resize-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
