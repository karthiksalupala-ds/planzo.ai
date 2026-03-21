import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingChatButtonProps {
  onClick: () => void;
}

const FloatingChatButton = ({ onClick }: FloatingChatButtonProps) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full gradient-hero text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center z-50 transition-all group overflow-hidden"
      aria-label="Open AI Assistant"
    >
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Sparkles className="h-6 w-6 relative z-10" />
      
      {/* Pulse effect */}
      <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 -z-10" />
    </motion.button>
  );
};

export default FloatingChatButton;
