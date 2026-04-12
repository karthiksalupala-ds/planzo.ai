import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingChatButtonProps {
  onClick: () => void;
}

const FloatingChatButton = ({ onClick }: FloatingChatButtonProps) => {
  const isMobile = useIsMobile();

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed right-5 h-14 w-14 rounded-full gradient-hero text-primary-foreground shadow-[0_12px_24px_rgba(var(--primary-rgb),0.28)] flex items-center justify-center z-[65] transition-all group overflow-hidden md:bottom-6 md:right-6"
      style={{ bottom: isMobile ? "calc(7rem + env(safe-area-inset-bottom))" : undefined }}
      aria-label="Open AI Assistant"
    >
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Sparkles className="h-6 w-6 relative z-10" />
      
      {/* Pulse effect */}
      {!isMobile && <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 -z-10" />}
    </motion.button>
  );
};

export default FloatingChatButton;
