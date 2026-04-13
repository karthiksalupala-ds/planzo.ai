import { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingChatButtonProps {
  onClick: () => void;
}

const FloatingChatButton = ({ onClick }: FloatingChatButtonProps) => {
  const isMobile = useIsMobile();
  const [dragging, setDragging] = useState(false);

  const constraintsRef = useRef(null);

  const handleClick = () => {
    console.log("Chat button clicked, dragging:", dragging, "onClick func:", typeof onClick);
    if (!dragging) {
      onClick();
    }
  };

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[45]" />
      <motion.button
        drag={!isMobile}
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className="fixed right-5 h-14 w-14 rounded-full gradient-hero text-primary-foreground shadow-[0_12px_24px_rgba(var(--primary-rgb),0.28)] flex items-center justify-center z-[45] transition-all group overflow-hidden md:bottom-6 md:right-6 touch-none cursor-grab active:cursor-grabbing"
        style={{ bottom: isMobile ? "calc(7.25rem + env(safe-area-inset-bottom))" : undefined }}
        aria-label="Open AI Assistant"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles className="h-6 w-6 relative z-10" />
        
        {/* Pulse effect */}
        {!isMobile && <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 -z-10" />}
      </motion.button>
    </>
  );
};

export default FloatingChatButton;
