import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface SmartCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "teal" | "coral" | "ocean" | "sunset";
  index?: number;
  onClick?: () => void;
}

const colorMap = {
  teal: "bg-teal-light text-teal",
  coral: "bg-coral/10 text-coral",
  ocean: "bg-ocean/10 text-ocean",
  sunset: "bg-sunset/10 text-sunset",
};

const SmartCard = ({ icon: Icon, title, description, color, index = 0, onClick }: SmartCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-2xl bg-card shadow-card hover:shadow-elevated transition-shadow text-left w-full"
    >
      <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-display font-semibold text-sm text-card-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
      </div>
    </motion.button>
  );
};

export default SmartCard;
