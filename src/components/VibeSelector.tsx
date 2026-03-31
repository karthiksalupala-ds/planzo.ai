import React from "react";
import { motion } from "framer-motion";
import { Palmtree, Mountain, Heart, Baby, Sparkles, Map, Camera, Music, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const vibes = [
  { id: "relax", label: "Relax", icon: Palmtree, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "adventure", label: "Adventure", icon: Mountain, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "romantic", label: "Romantic", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: "family", label: "Family", icon: Baby, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "culture", label: "Culture", icon: Music, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "foodie", label: "Foodie", icon: Utensils, color: "text-orange-500", bg: "bg-orange-500/10" },
];

interface VibeSelectorProps {
  activeVibe?: string;
  onSelect: (id: string) => void;
  className?: string;
}

const VibeSelector: React.FC<VibeSelectorProps> = ({ activeVibe, onSelect, className }) => {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center gap-2 mb-4 px-1">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Choose Your Vibe</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
        {vibes.map((vibe, i) => (
          <motion.button
            key={vibe.id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(vibe.id)}
            className={cn(
              "flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-[24px] min-w-[100px] border transition-all duration-300",
              activeVibe === vibe.id
                ? "bg-primary border-primary shadow-lg shadow-primary/20"
                : "bg-card border-border/50 hover:border-primary/30 shadow-sm"
            )}
          >
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
              activeVibe === vibe.id ? "bg-white/20" : vibe.bg
            )}>
              <vibe.icon className={cn("h-6 w-6", activeVibe === vibe.id ? "text-white" : vibe.color)} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              activeVibe === vibe.id ? "text-white" : "text-muted-foreground"
            )}>
              {vibe.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default VibeSelector;
