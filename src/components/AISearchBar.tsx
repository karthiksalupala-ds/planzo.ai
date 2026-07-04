import { Search, Sparkles, Mic, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAllDestinations } from "@/data/destinations";

const SCROLLING_PLACEHOLDERS = [
  "Where to next?",
  "Kerala Backwaters",
  "Hidden gems in Rajasthan",
  "Beaches in Goa",
  "Adventure in Manali",
  "Explore the Himalayas",
  "Search destinations..."
];

const AISearchBar = () => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const handleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please try Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (event.error === "no-speech") {
        alert("No speech detected. Please speak clearly into your microphone.");
      } else {
        alert(`Voice search error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SCROLLING_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/plan?dest=${encodeURIComponent(query)}`);
    } else {
      const currentPlaceholder = SCROLLING_PLACEHOLDERS[placeholderIndex];
      if (currentPlaceholder !== "Where to next?" && currentPlaceholder !== "Search destinations...") {
         navigate(`/plan?dest=${encodeURIComponent(currentPlaceholder)}`);
      }
    }
  };

  // Dynamic suggestions from real destinations data
  const suggestions = query.trim().length > 1
    ? getAllDestinations()
        .filter(d =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.state.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
    : getAllDestinations().slice(0, 4); // Top 4 as default when focused

  return (
    <div className="relative w-full max-w-3xl mx-auto z-50">
      <form onSubmit={handleSubmit}>
        <div
          className={`relative flex items-center gap-2 px-5 py-4 rounded-2xl md:rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-300 ${
            isFocused ? "shadow-[0_8px_32px_0_rgba(31,38,135,0.3)] ring-2 ring-primary/40 bg-white/40 dark:bg-black/40 scale-[1.02]" : "hover:bg-white/30 dark:hover:bg-black/30"
          }`}
        >
          <Search className="h-5 w-5 text-foreground/80 flex-shrink-0 ml-1" />
          
          <div className="relative flex-1 h-6 flex items-center overflow-hidden">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="absolute inset-0 w-full h-full bg-transparent text-base md:text-lg text-foreground font-semibold placeholder:text-transparent outline-none z-10"
            />
            {/* Typewriter Placeholder */}
            {!query && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={placeholderIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 w-full h-full flex items-center text-base md:text-lg text-foreground/60 font-medium pointer-events-none"
                >
                  {SCROLLING_PLACEHOLDERS[placeholderIndex]}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSpeech();
            }}
            className={`p-2 rounded-full transition-all hidden sm:block ${
              isListening
                ? "text-red-500 bg-red-500/10 animate-pulse border border-red-500/30 scale-110 shadow-sm"
                : "text-foreground/70 hover:text-foreground hover:bg-white/20 border border-transparent"
            }`}
            title="Voice search"
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl md:rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Search
          </button>
        </div>
      </form>
      {isFocused && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 p-2 bg-card rounded-2xl shadow-elevated z-10 border border-border"
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-2 pb-1">
            {query.trim().length > 1 ? "Matching destinations" : "Popular destinations"}
          </p>
          {suggestions.length > 0 ? (
            suggestions.map((d) => (
              <button
                key={d.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(d.name);
                  navigate(`/plan?dest=${encodeURIComponent(d.name)}`);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-lg transition-colors text-left"
              >
                <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground ml-auto">{d.state}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground italic">No standard destinations found.</p>
          )}

          {query.trim().length > 1 && (
            <>
              <div className="h-px bg-border my-2 mx-1" />
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  navigate(`/plan?dest=${encodeURIComponent(query)}`);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-primary/20 flex items-center justify-center">
                     <Sparkles className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary leading-tight">Ask AI to plan trip</p>
                    <p className="text-[10px] text-muted-foreground">Generate itinerary for "{query}"</p>
                  </div>
                </div>
                <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AISearchBar;
