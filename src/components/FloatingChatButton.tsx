import { MessageSquare } from 'lucide-react';

interface FloatingChatButtonProps {
  onClick: () => void;
}

const FloatingChatButton = ({ onClick }: FloatingChatButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 h-14 w-14 rounded-full gradient-hero text-primary-foreground shadow-lg flex items-center justify-center z-50 hover:opacity-90 transition-opacity"
      aria-label="Open chat"
    >
      <MessageSquare className="h-6 w-6" />
    </button>
  );
};

export default FloatingChatButton;
