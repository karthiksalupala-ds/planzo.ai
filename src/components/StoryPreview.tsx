import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Share2, Download, Music } from "lucide-react";

interface JournalEntry {
  id: string;
  date: string;
  day: number;
  mood: string;
  text: string;
  photos?: string[];
}

interface StoryPreviewProps {
  entries: JournalEntry[];
  destination: string;
  onClose: () => void;
}

const StoryPreview = ({ entries, destination, onClose }: StoryPreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < entries.length - 1) {
            setCurrentIndex(prevIdx => prevIdx + 1);
            return 0;
          }
          return 100;
        }
        return prev + 1;
      });
    }, 50); // 5 seconds per slide (50ms * 100)

    return () => clearInterval(timer);
  }, [currentIndex, entries.length]);

  const nextSlide = () => {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const currentEntry = entries[currentIndex];
  // Simple color mapping for moods
  const moodColors: Record<string, string> = {
    "😊": "from-amber-400 to-orange-500",
    "🤩": "from-purple-500 to-pink-500",
    "😴": "from-blue-400 to-indigo-500",
    "🏖️": "from-teal-400 to-emerald-500",
    "🧗": "from-red-500 to-rose-600",
    "🍝": "from-orange-400 to-red-500",
    "🎒": "from-sky-400 to-blue-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-0 md:p-4"
    >
      {/* Background Blur */}
      <div className="absolute inset-0 z-0">
        <div className={`w-full h-full bg-gradient-to-br ${moodColors[currentEntry.mood] || "from-gray-700 to-gray-900"} opacity-30 blur-3xl`} />
      </div>

      <div className="relative z-10 w-full max-w-[450px] aspect-[9/16] bg-card rounded-none md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col border border-white/10">
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-50 flex gap-1.5">
          {entries.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? "100%" : "0%" 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-6 right-6 z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-lg border border-white/20">
              {currentEntry.mood}
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-tight drop-shadow-md">Day {currentEntry.day} in {destination}</h3>
              <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{currentEntry.date}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="flex-1 relative flex flex-col"
          >
            {/* Background Texture/Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b ${moodColors[currentEntry.mood] || "from-slate-800 to-slate-950"} opacity-90`} />
            
            {/* Decor Elements */}
            <div className="absolute top-0 right-0 p-12 opacity-10">
                <Music className="h-64 w-64 text-white rotate-12" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center p-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <div className="h-1 w-12 bg-white/40 rounded-full mb-8" />
                
                <p className="text-white text-2xl font-display font-medium leading-relaxed italic">
                   "{currentEntry.text}"
                </p>
                
                <div className="pt-8">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="h-px w-8 bg-white/20" />
                        Captured Memories
                    </p>
                </div>
              </motion.div>
            </div>

            {/* Bottom Branding */}
            <div className="relative z-10 p-8 pt-0 flex justify-center">
                <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-xl border border-white/10">
                    <span className="text-white/80 text-[10px] font-black tracking-[0.2em] uppercase">Built with Planzo.ai</span>
                </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays (Invisible) */}
        <div className="absolute inset-x-0 inset-y-24 z-30 flex">
          <div className="flex-1 cursor-pointer" onClick={prevSlide} />
          <div className="flex-1 cursor-pointer" onClick={nextSlide} />
        </div>

        {/* Action Bar */}
        <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-4 px-8">
          <button className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-transform">
            <Share2 className="h-4 w-4" /> Share Story
          </button>
          <button className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all shadow-lg">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Side Navigation Buttons (Desktop) */}
      <div className="hidden md:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-12 pointer-events-none">
        <button 
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30 pointer-events-auto"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <button 
          onClick={nextSlide}
          disabled={currentIndex === entries.length - 1}
          className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30 pointer-events-auto"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>
    </motion.div>
  );
};

export default StoryPreview;
