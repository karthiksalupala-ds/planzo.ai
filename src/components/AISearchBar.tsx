import { Search, Sparkles, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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
      navigate(`/plan?q=${encodeURIComponent(query)}`);
    } else {
      // If empty, navigate to the current placeholder text if it's a location
      const currentPlaceholder = SCROLLING_PLACEHOLDERS[placeholderIndex];
      if (currentPlaceholder !== "Where to next?" && currentPlaceholder !== "Search destinations...") {
         navigate(`/plan?q=${encodeURIComponent(currentPlaceholder)}`);
      }
    }
  };

  const suggestions = [
    "Udaipur, Rajasthan",
    "Goa Beaches",
    "Munnar, Kerala",
    "Leh Ladakh",
  ];

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

          <button type="button" className="p-2 text-foreground/70 hover:text-foreground hover:bg-white/20 rounded-full transition-colors hidden sm:block">
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
            Try asking
          </p>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                navigate(`/plan?q=${encodeURIComponent(s)}`);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-lg transition-colors text-left"
            >
              <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
              {s}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AISearchBar;
