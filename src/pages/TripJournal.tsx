import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Camera, Smile, Calendar, Loader2,
  Trash2, MapPin, Clock, Sparkles, BookOpen, Image as ImageIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StoryPreview from "@/components/StoryPreview";

interface JournalEntry {
  id: string;
  day: number;
  text: string;
  mood: string;
  photos: string[];
  created_at: string;
  date: string;
}

const moodOptions = [
  { emoji: "😍", label: "Amazing" },
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Relaxed" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😢", label: "Homesick" },
  { emoji: "🌧️", label: "Rainy" },
  { emoji: "🏔️", label: "Adventurous" },
];

const TripJournal = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [tripTitle, setTripTitle] = useState("");
  const [tripDays, setTripDays] = useState(3);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [newText, setNewText] = useState("");
  const [newMood, setNewMood] = useState("😊");
  const [saving, setSaving] = useState(false);
  const [isGeneratingAIText, setIsGeneratingAIText] = useState(false);
  const [showStory, setShowStory] = useState(false);

  const fetchTripAndEntries = useCallback(async () => {
    if (!tripId || !user) { setLoading(false); return; }

    const { data: trip } = await supabase
      .from("saved_trips")
      .select("title, days, plan_data")
      .eq("id", tripId)
      .single();

    if (trip) {
      setTripTitle(trip.title);
      setTripDays(trip.days || 3);
    }

    const stored = localStorage.getItem(`journal_${tripId}`);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (e) {
        console.error("Journal loading error", e);
      }
    }

    setLoading(false);
  }, [tripId, user]);

  useEffect(() => {
    void fetchTripAndEntries();
  }, [fetchTripAndEntries]);

  const saveEntries = (updated: JournalEntry[]) => {
    setEntries(updated);
    localStorage.setItem(`journal_${tripId}`, JSON.stringify(updated));
  };

  const handleAddEntry = () => {
    if (!newText.trim()) {
      toast({ title: "Write something!", description: "Your journal entry can't be empty.", variant: "destructive" });
      return;
    }

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      day: selectedDay,
      text: newText.trim(),
      mood: newMood,
      photos: [],
      created_at: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    const updated = [...entries, entry].sort((a, b) => a.day - b.day || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    saveEntries(updated);
    setNewText("");
    setShowAddForm(false);
    toast({ title: "Entry saved! 📝", description: `Day ${selectedDay} journal entry added.` });
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    saveEntries(updated);
    toast({ title: "Entry removed" });
  };

  const handleMagicWrite = () => {
    setIsGeneratingAIText(true);
    setTimeout(() => {
      const templates = [
        `Today was absolutely incredible in ${tripTitle || "this beautiful place"}. We stumbled upon a hidden gem that wasn't even on the itinerary. The local vibe here is just magic, and I couldn't have asked for a better day.`,
        `Spent the entire day exploring the heart of ${tripTitle || "the city"}. The local food was out of this world, and the weather stayed perfect. Truly a memorable experience.`,
        `Feeling completely relaxed after today's adventures in ${tripTitle || "nature"}. We took things slow, soaked in the culture, and caught a stunning sunset to cap it off.`,
        `Day ${selectedDay} exceeded all expectations. The energy of ${tripTitle || "the streets"} is contagious. We walked for miles but every step was worth it.`,
        `A travel day full of surprises! Found a quiet spot away from the crowds to just breathe and enjoy the scenery. ${tripTitle || "This place"} has a special kind of charm.`
      ];
      const randomText = templates[Math.floor(Math.random() * templates.length)];
      setNewText(randomText);
      setIsGeneratingAIText(false);
      toast({ title: "✨ AI Journal Entry Generated" });
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dayGroups: Record<number, JournalEntry[]> = {};
  entries.forEach(e => {
    if (!dayGroups[e.day]) dayGroups[e.day] = [];
    dayGroups[e.day].push(e);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative h-44 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full glass text-foreground hover:bg-card/90 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex flex-col md:flex-row justify-between items-end gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="font-display text-xl font-bold text-foreground">Trip Journal</h1>
              </div>
              <p className="text-sm text-muted-foreground">{tripTitle} · {tripDays} days</p>
            </div>
            
            {entries.length > 0 && (
              <button
                onClick={() => setShowStory(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Story
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 md:container max-w-2xl mx-auto -mt-2">
        {/* Add Entry Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all mb-6"
        >
          <Plus className="h-4 w-4" /> Add Journal Entry
        </motion.button>

        {/* Add Entry Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> New Journal Entry
                </h3>

                {/* Day selector */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 block">
                    <Calendar className="h-3 w-3 inline mr-1" /> Select Day
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: tripDays }, (_, i) => i + 1).map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        className={`h-9 w-9 rounded-lg text-xs font-bold transition-all ${
                          selectedDay === d
                            ? "gradient-hero text-white shadow-card"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 block">
                    <Smile className="h-3 w-3 inline mr-1" /> How do you feel?
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {moodOptions.map(m => (
                      <button
                        key={m.emoji}
                        onClick={() => setNewMood(m.emoji)}
                        className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 ${
                          newMood === m.emoji
                            ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
                            : "bg-muted border-2 border-transparent hover:bg-muted/80"
                        }`}
                      >
                        <span className="text-base">{m.emoji}</span>
                        <span className="text-xs font-medium text-foreground">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                      ✍️ What happened today?
                    </label>
                    <button 
                      onClick={handleMagicWrite}
                      disabled={isGeneratingAIText}
                      className="text-[10px] font-bold text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors border border-primary/20 bg-primary/5"
                    >
                      {isGeneratingAIText ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      AI MAGIC WRITE
                    </button>
                  </div>
                  <textarea
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    rows={4}
                    placeholder="Write about your experiences, discoveries, surprises..."
                    className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEntry}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl gradient-hero text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries */}
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mb-2">Your journal is empty</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Capture your trip memories! Add your first entry with notes, mood, and highlights from your day.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(dayGroups)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, groupEntries]) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Day Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{day}</span>
                    </div>
                    <h3 className="font-display font-bold text-foreground text-sm">Day {day}</h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Entries */}
                  <div className="space-y-3 ml-4 pl-4 border-l-2 border-primary/20">
                    {groupEntries.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-2xl bg-card border border-border shadow-card relative group"
                      >
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        {/* Mood & Time */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{entry.mood}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.created_at).toLocaleString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>

                        {/* Text */}
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {entry.text}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showStory && (
          <StoryPreview
            entries={entries}
            destination={tripTitle}
            onClose={() => setShowStory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripJournal;
