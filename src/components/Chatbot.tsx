import { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, User, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { streamChatResponse } from '@/lib/stream-ai';
import type { TripPlan } from '@/types/trip-plan';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatbotProps {
  plan?: TripPlan | null;
  onClose: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const buildPlanContext = (plan: TripPlan) => {
  const itinerary = Array.isArray(plan.itinerary)
    ? plan.itinerary.slice(0, 5).map((day) => ({
        day: day.day,
        title: day.title,
        activities: Array.isArray(day.activities)
          ? day.activities.slice(0, 4).map((activity) =>
              typeof activity === 'string'
                ? activity
                : [activity.name, activity.place].filter(Boolean).join(' - ')
            )
          : [],
        tips: day.tips,
      }))
    : [];

  const travelOptions = Array.isArray(plan.travelOptions)
    ? plan.travelOptions.slice(0, 3).map((option) => ({
        mode: option.mode,
        from: option.from,
        to: option.to,
        duration: option.duration,
        price: option.price,
        estimatedCost: option.estimatedCost,
        isRecommended: option.isRecommended,
      }))
    : [];

  const localTransport = Array.isArray(plan.localTransport)
    ? plan.localTransport.slice(0, 3).map((option) => ({
        mode: option.mode,
        estimatedDailyCost: option.estimatedDailyCost,
        notes: option.notes,
        provider: option.provider,
      }))
    : [];

  return JSON.stringify({
    destination: plan.destination,
    summary: plan.summary,
    vibe: plan.vibe,
    budget: plan.budget,
    budgetHealth: plan.budgetHealth,
    budgetBreakdown: plan.budgetBreakdown,
    weatherNote: plan.weatherNote,
    safetyTips: plan.safetyTips?.slice(0, 5),
    packingList: plan.packingList?.slice(0, 8),
    itinerary,
    travelOptions,
    localTransport,
  });
};

const Chatbot = ({ plan, onClose, messages, setMessages }: ChatbotProps) => {
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { text: messageText, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let fullResponse = '';
    setMessages((prev) => [...prev, { text: '', isUser: false }]);

    const params: { query: string; planContext?: string } = { query: messageText };
    if (plan) {
      params.planContext = buildPlanContext(plan);
    }

    await streamChatResponse({
      params,
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

  const handleSend = async () => {
    sendMessage(input);
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={`fixed right-5 z-50 bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl flex flex-col border border-primary/10 overflow-hidden ring-1 ring-white/20 ${isExpanded ? 'w-[calc(100vw-40px)] md:w-[500px] h-[600px]' : 'w-80 md:w-96 h-[500px]'}`}
      style={{ bottom: isMobile ? "calc(7.25rem + env(safe-area-inset-bottom))" : "24px" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-primary/5 bg-primary/5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center shadow-lg shadow-primary/20 ring-2 ring-white/50">
            <Sparkles className="h-5 w-5 text-primary-foreground animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm tracking-tight text-foreground">AI Assistant</h3>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Active now</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors transition-all hidden md:block"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => { setMessages([{ text: "Hello! I'm your AI trip assistant. Ask me anything about your plan.", isUser: false }]); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors transition-all"
            title="Clear Chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-5 overflow-y-auto scrollbar-hide bg-gradient-to-b from-transparent to-primary/5">
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: msg.isUser ? 10 : -10, y: 5 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                className={`flex gap-3 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.isUser ? 'bg-primary text-primary-foreground' : 'bg-white border ring-1 ring-primary/10 text-primary'}`}>
                  {msg.isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className={`relative group max-w-[80%] ${msg.isUser ? 'text-right' : 'text-left'}`}>
                  {!msg.isUser && (
                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest block mb-1 ml-1">Planzo AI</span>
                  )}
                  <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed transition-all ${
                    msg.isUser 
                      ? 'gradient-hero text-white rounded-tr-none shadow-md shadow-primary/10' 
                      : 'bg-white border border-primary/5 text-foreground rounded-tl-none font-medium'
                  }`}>
                    {msg.text ? (
                      msg.isUser ? (
                        msg.text
                      ) : (
                        <div className="space-y-2 text-[13px] leading-6">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
                              li: ({ children }) => <li>{children}</li>,
                              h1: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                              h2: ({ children }) => <h4 className="text-sm font-bold mb-2">{children}</h4>,
                              h3: ({ children }) => <h5 className="text-sm font-semibold mb-1">{children}</h5>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              code: ({ children }) => <code className="px-1 py-0.5 rounded bg-primary/10 text-[12px]">{children}</code>,
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )
                    ) : (
                      <div className="flex gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/50 border-t border-primary/5">
        <div className="relative flex items-center gap-2 bg-white/80 dark:bg-muted/80 backdrop-blur-md border border-primary/10 rounded-2xl p-1.5 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !isLoading && (e.preventDefault(), handleSend())}
            placeholder="Ask a question about your trip..."
            rows={1}
            className="flex-1 bg-transparent py-2 text-sm outline-none resize-none placeholder:text-muted-foreground/50 whitespace-pre-wrap max-h-32"
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 rounded-xl gradient-hero text-white flex items-center justify-center disabled:opacity-30 shadow-lg shadow-primary/20 transition-all flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
        <p className="text-[9px] text-center mt-3 text-muted-foreground/60 font-medium uppercase tracking-[0.2em]">
          ✨ Intelligent Itinerary Assistance
        </p>
      </div>
    </motion.div>
  );
};

export default Chatbot;
