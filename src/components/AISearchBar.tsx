import { Search, Sparkles, Mic } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AISearchBar = () => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/plan?q=${encodeURIComponent(query)}`);
    }
  };

  const suggestions = [
    "Plan a 3-day Goa trip under ₹15,000",
    "Weekend getaway to Udaipur for couples",
    "Best adventure spots in Himachal Pradesh",
    "Family trip to Kerala backwaters",
  ];

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div
          className={`relative flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-card shadow-card transition-shadow ${
            isFocused ? "shadow-elevated ring-2 ring-primary/20" : ""
          }`}
        >
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Ask AI to plan your trip..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="submit"
            className="p-2 rounded-xl gradient-hero text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            <Search className="h-4 w-4" />
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
