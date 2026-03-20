import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles, Send, MapPin, IndianRupee, Calendar, Users, ChevronRight,
  Hotel, Utensils, Camera, Loader2, Heart, Mountain, Palmtree, Baby,
  User, Shield, Backpack, CloudSun, AlertCircle, Save, Train, Plane, Bus, RefreshCw, Pencil, TramFront, Bike,
  Car, Navigation, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Share2, XCircle, ShoppingBag, Printer, Download, Plus, X, Clock, Navigation2, Map
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import FloatingChatButton from "@/components/FloatingChatButton";
import Chatbot from "@/components/Chatbot";
import PlanSkeleton from "@/pages/PlanSkeleton";
import TripPDF from "@/components/TripPDF";
import type { LocalTransportOption, TripActivity, TripDay, TripPlan, TravelOption } from "@/types/trip-plan";
import { getPexelsImage } from "@/lib/pexels";
import InteractiveMap from "@/components/InteractiveMap";
import ItineraryDisplay from "@/components/ItineraryDisplay";
import { generateAlternativeActivity } from "@/lib/stream-ai";
import { indianDestinations } from "@/data/destinations";

interface Message {
  text: string;
  isUser: boolean;
}

const moods = [
  { id: "relax", label: "Relax", icon: Palmtree },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "romantic", label: "Romantic", icon: Heart },
  { id: "family", label: "Family", icon: Baby },
  { id: "solo", label: "Solo", icon: User },
];
const PlanTrip = () => {
  const [searchParams] = useSearchParams();

  // ----------------------
  // ----------------------
  const initialDest = searchParams.get("dest") || searchParams.get("q") || "";
  const initialDays = searchParams.get("days");
  const initialBudget = searchParams.get("budget");
  const tripIdParam = searchParams.get("id");
  const [tripId, setTripId] = useState<string | null>(tripIdParam);
  const [destinations, setDestinations] = useState<string[]>(initialDest ? [initialDest] : [""]);
  const destination = destinations.filter(d => d.trim()).join(" → ");
  const [isPlanning, setIsPlanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeMood, setActiveMood] = useState("adventure");
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
  const [isSwapping, setIsSwapping] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { text: "Hello! I'm your AI trip assistant. Ask me anything about your plan.", isUser: false },
  ]);

  // Budget state
  const parsedDays = initialDays ? parseInt(initialDays) : 3;
  const [budget, setBudget] = useState(initialBudget && initialBudget !== "NaN" ? initialBudget : "15000");
  const [days, setDays] = useState(isNaN(parsedDays) ? 3 : parsedDays);
  const [travelers, setTravelers] = useState(2);

  // Destination autocomplete
  const [autocompleteIndex, setAutocompleteIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleDestinationChangeWithSuggest = (index: number, value: string) => {
    handleDestinationChange(index, value);
    setAutocompleteIndex(index);
    if (value.trim().length > 1) {
      const matches = indianDestinations
        .filter(d => d.name.toLowerCase().includes(value.toLowerCase()) || d.state.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)
        .map(d => d.name);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (index: number, name: string) => {
    handleDestinationChange(index, name);
    setSuggestions([]);
    setAutocompleteIndex(null);
  };

  const updateRemotePlan = async (updatedPlan: TripPlan) => {
    if (tripId) {
       await supabase.from("saved_trips").update({ plan_data: updatedPlan as unknown as Json }).eq("id", tripId);
    }
  };

  useEffect(() => {
    if (tripId) {
      setLoading(true);
      supabase.from("saved_trips").select("*").eq("id", tripId).maybeSingle().then(({ data }) => {
        if (data && data.plan_data) {
          setPlan(data.plan_data as unknown as TripPlan);
          const dests = data.query ? data.query.split(" → ") : [data.title];
          setDestinations(dests);
          if (data.budget) setBudget(data.budget.toString());
          if (data.days) setDays(data.days);
          if (data.travelers) setTravelers(data.travelers);
          if (data.mood) setActiveMood(data.mood);
        }
        setLoading(false);
      });

      const channel = supabase.channel(`trip-${tripId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'saved_trips', filter: `id=eq.${tripId}` },
          (payload) => {
             if (payload.new && payload.new.plan_data) {
                setPlan(payload.new.plan_data as unknown as TripPlan);
             }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tripId]);

  const { toast } = useToast();
  const { user } = useAuth();
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plan?.itinerary) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-day-index"));
            setActiveDayIndex(idx);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    setTimeout(() => {
      document.querySelectorAll(".day-container").forEach((el) => observer.observe(el));
    }, 500);
    return () => observer.disconnect();
  }, [plan]);

  const handleDestinationChange = (index: number, value: string) => {
    setDestinations(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addStop = () => {
    if (destinations.length < 5) {
      setDestinations(prev => [...prev, ""]);
    }
  };

  const removeStop = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveTrip = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save trips.", variant: "destructive" });
      return;
    }
    if (!plan) return;
    setSaving(true);
    const { data, error } = await supabase.from("saved_trips").insert({
      user_id: user.id,
      title: plan.destination || destination,
      query: destination,
      mood: activeMood,
      budget,
      days,
      travelers,
      plan_data: plan as unknown as Json,
    }).select().single();
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else if (data) {
      setTripId(data.id);
      window.history.replaceState({}, '', `?id=${data.id}`);
      toast({ title: "Trip saved!", description: "You can now safely share this URL with friends for multiplayer collaboration!" });
    }
  };

  const handleShareTrip = async () => {
    if (!plan) return;
    const shareData = {
      title: `Trip to ${plan.destination}`,
      text: `Check out this trip plan to ${plan.destination}: ${plan.summary}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      toast({ title: "Link copied", description: "Trip details copied to clipboard." });
    }
  };

  const handlePrintTrip = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${plan?.destination || destination || "trip"}-itinerary.pdf`,
      image: { type: "jpeg" as const, quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };
    html2pdf().set(opt).from(pdfRef.current).save();
  };

  const regeneratePlan = async (destination: string) => {
    setIsPlanning(true);
    setError("");
    setPlan(null);
    setChatMessages([
      { text: "Hello! I'm your AI trip assistant. Ask me anything about your plan.", isUser: false },
    ]);

    try {
      // Get the current session for a valid JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plan-trip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          query: destination,
          budget,
          days: days.toString(),
          travelers: travelers.toString(),
          mood: activeMood,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      let data: TripPlan = await response.json();

      // Enrich images dynamically on the frontend to avoid duplicates
      if (data.itinerary) {
        data.itinerary = await Promise.all(
          data.itinerary.map(async (day) => {
            let heroImage = day.heroImage;
            let enrichedActivities = day.activities;

            if (day.activities) {
              enrichedActivities = await Promise.all(
                day.activities.map(async (act) => {
                  if (typeof act !== 'string') {
                    const query = act.imageSearchQuery || act.place || act.name || "travel destination";
                    const image = await getPexelsImage(query);
                    if (!heroImage) heroImage = image; // Use first activity image as day banner fallback
                    return { ...act, image };
                  }
                  return act;
                })
              );
            }
            if (!heroImage) heroImage = await getPexelsImage(`${day.title} ${destination}`);
            return { ...day, heroImage, activities: enrichedActivities };
          })
        );
      }

      setPlan(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsPlanning(false);
    }
  };

  const handlePlan = async () => {
    if (!destination.trim()) return;
    await regeneratePlan(destination);
  };

  const handleDestinationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && destination.trim() && !isPlanning) {
      setSuggestions([]);
      handlePlan();
    }
  };

  const handleRegenerateDay = async (dayIndex: number) => {
    if (!plan || regeneratingDay !== null) return;
    setRegeneratingDay(dayIndex);

    try {
      // Get the current session for a valid JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plan-trip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          existingPlan: plan,
          dayToRegenerate: dayIndex,
          query: destination,
          budget,
          days: days.toString(),
          travelers: travelers.toString(),
          mood: activeMood,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      let data: TripDay = await response.json();

      let heroImage = data.heroImage;
      if (data.activities) {
        data.activities = await Promise.all(
          data.activities.map(async (act) => {
            if (typeof act !== 'string') {
              const query = act.imageSearchQuery || act.place || act.name || "travel destination";
              const image = await getPexelsImage(query);
              if (!heroImage) heroImage = image;
              return { ...act, image };
            }
            return act;
          })
        );
      }
      if (!heroImage) heroImage = await getPexelsImage(`${data.title} ${destination}`);
      data.heroImage = heroImage;

      setPlan((currentPlan) => {
        if (!currentPlan?.itinerary) return currentPlan;
        const newItinerary = [...currentPlan.itinerary];
        // The AI returns a day object, we replace the old one at the correct index.
        data.day = dayIndex + 1; // Ensure day number is correct based on position
        newItinerary[dayIndex] = data;

        const updated = { ...currentPlan, itinerary: newItinerary };
        if (tripId) updateRemotePlan(updated);

        toast({
          title: `Day ${dayIndex + 1} Regenerated!`,
          description: "Enjoy the new suggestions.",
        });

        return { ...currentPlan, itinerary: newItinerary };
      });
    } catch (err) {
      toast({
        title: "Regeneration failed",
        description: err instanceof Error ? err.message : "Unable to regenerate this day.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingDay(null);
    }
  };

  const handleSwapActivity = async (dayNum: number, activityIndex: number, oldActivityName: string) => {
    if (!plan) return;
    const swapId = `${dayNum}-${activityIndex}`;
    setIsSwapping(swapId);
    
    try {
      const alt = await generateAlternativeActivity(plan.destination || destination, activeMood, oldActivityName);
      if (!alt) throw new Error("Could not generate alternative");

      const image = await getPexelsImage(alt.imageSearchQuery || alt.place || alt.name);
      
      setPlan(prev => {
        if (!prev || !prev.itinerary) return prev;
        const newItinerary = [...prev.itinerary];
        const targetDayParts = newItinerary.find(d => d.day === dayNum);
        if (targetDayParts && targetDayParts.activities) {
           const actArray = [...targetDayParts.activities];
           const oldAct = actArray[activityIndex];
           const oldLat = typeof oldAct !== 'string' ? oldAct.lat : plan.map?.lat;
           const oldLng = typeof oldAct !== 'string' ? oldAct.lng : plan.map?.lng;
           
           actArray[activityIndex] = {
             name: alt.name,
             place: alt.place,
             imageSearchQuery: alt.imageSearchQuery,
             image,
             lat: oldLat,
             lng: oldLng
           };
           targetDayParts.activities = actArray;
        }
        const updated = { ...prev, itinerary: newItinerary };
        if (tripId) updateRemotePlan(updated);
        return updated;
      });
      
      toast({ title: "Activity Swapped!", description: `Replaced with ${alt.name}` });
    } catch {
      toast({ title: "Failed to swap", variant: "destructive" });
    } finally {
      setIsSwapping(null);
    }
  };

  const handleNoteChange = (dayIndex: number, note: string) => {
    setPlan(currentPlan => {
      if (!currentPlan) return null;
      const newItinerary = [...currentPlan.itinerary];
      // Ensure the day object exists before modifying
      newItinerary[dayIndex] = { ...newItinerary[dayIndex], userNotes: note };
      const updated = { ...currentPlan, itinerary: newItinerary };
      if (tripId) updateRemotePlan(updated);
      return updated;
    });
  };

  // Parse budget info from plan
  const budgetInfo = plan?.budgetHealth || null;
  const budgetUsagePercent = budgetInfo?.usagePercentage || 0;
  const budgetStatus = budgetInfo?.status || "";

  const getStatusColor = () => {
    if (budgetStatus.includes("🟢") || budgetStatus.includes("Within")) return "text-emerald-500";
    if (budgetStatus.includes("🟡") || budgetStatus.includes("Near")) return "text-amber-500";
    if (budgetStatus.includes("🔴") || budgetStatus.includes("Over")) return "text-red-500";
    return "text-primary";
  };

  const getStatusIcon = () => {
    if (budgetStatus.includes("🟢") || budgetStatus.includes("Within")) return CheckCircle;
    if (budgetStatus.includes("🟡") || budgetStatus.includes("Near")) return AlertTriangle;
    if (budgetStatus.includes("🔴") || budgetStatus.includes("Over")) return XCircle;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="px-5 md:container py-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Let's Plan Your Next Adventure!</h1>
        <p className="text-sm text-muted-foreground mt-1">Your AI-powered trip planner for personalized itineraries and smart budget management.</p>
      </motion.div>

      {/* Mood Chips */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-4">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Trip Mood</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {moods.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMood(m.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeMood === m.id
                ? "gradient-hero text-primary-foreground shadow-card"
                : "bg-card text-muted-foreground hover:text-foreground shadow-card"
                }`}
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI Input */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 p-4 rounded-2xl bg-card shadow-card">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            {destinations.map((dest, index) => (
              <div key={index} className="relative">
                {index > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">→ Stop {index + 1}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={dest}
                    onChange={(e) => handleDestinationChangeWithSuggest(index, e.target.value)}
                    onKeyDown={handleDestinationKeyDown}
                    onBlur={() => setTimeout(() => { setSuggestions([]); setAutocompleteIndex(null); }, 150)}
                    placeholder={index === 0 ? 'Enter a destination (e.g. Goa)' : 'Add next stop'}
                    className="flex-1 bg-muted/50 rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-shadow"
                    autoComplete="off"
                  />
                  {destinations.length > 1 && (
                    <button
                      onClick={() => removeStop(index)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove stop"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Autocomplete dropdown */}
                {autocompleteIndex === index && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-elevated overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onMouseDown={() => handleSuggestionClick(index, s)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2"
                      >
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {destinations.length < 5 && (
              <button
                onClick={addStop}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors mt-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Stop
              </button>
            )}
            <p className="text-xs text-muted-foreground">e.g. Goa → Hampi → Coorg</p>
          </div>
        </div>

        {/* Quick Options */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <IndianRupee className="h-3 w-3" /> Budget (₹)
            </label>
            <input
              type="number"
              value={budget}
              min={500}
              onChange={(e) => setBudget(e.target.value)}
              className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="15000"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Days
            </label>
            <input
              type="number"
              value={days}
              min={1}
              max={30}
              onChange={(e) => setDays(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
              className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="3"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3" /> Travelers
            </label>
            <input
              type="number"
              value={travelers}
              min={1}
              max={20}
              onChange={(e) => setTravelers(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="2"
            />
          </div>
        </div>

        <button onClick={handlePlan} disabled={isPlanning || !destination.trim()} className="w-full mt-4 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
          {isPlanning ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating with AI...</>
          ) : (
            <><Send className="h-4 w-4" />Generate Itinerary</>
          )}
        </button>
        {!user && (
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            <User className="h-3 w-3 inline-block mr-1" />
            <button onClick={() => window.location.href = '/auth'} className="text-primary font-semibold hover:underline">Sign in</button> to save & share your trips
          </p>
        )}
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Something went wrong</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
            <button
              onClick={handlePlan}
              className="mt-2 text-xs font-semibold text-destructive underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      )}

      {/* Streaming indicator */}
      {isPlanning && !plan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">AI is crafting your itinerary with images...</p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 8, ease: "linear", repeat: Infinity }} className="h-full rounded-full gradient-hero" />
          </div>
        </motion.div>
      )}
      {/* Loading Skeleton */}
      {isPlanning && !plan && <PlanSkeleton />}

      {/* Generated Plan */}
      <AnimatePresence>
        {plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            {/* Summary with Destination Image */}
            <div className="p-4 rounded-2xl bg-card shadow-card overflow-hidden">
              {plan.destinationImage ? (
                <div className="relative -mx-4 -mt-4 mb-3 h-48 overflow-hidden">
                  <img
                    src={plan.destinationImage}
                    alt={plan.destination}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-display font-bold text-white text-xl">{plan.destination}</h3>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-foreground text-lg">{plan.destination}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{plan.summary}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={handlePrintTrip}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </button>
                    <button
                      onClick={handleShareTrip}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                    <button
                      onClick={handleSaveTrip}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </button>
                  </div>
                </div>
              )}
              {plan.destinationImage && (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{plan.summary}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handlePrintTrip}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </button>
                    <button
                      onClick={handleShareTrip}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                    <button
                      onClick={handleSaveTrip}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </button>
                  </div>
                </div>
              )}
              {plan.weatherNote && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-ocean/10">
                  <CloudSun className="h-4 w-4 text-ocean" />
                  <span className="text-xs text-ocean font-medium">{plan.weatherNote}</span>
                </div>
              )}
            </div>

            {/* Map Section */}
            {plan.map && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" /> Location Map
                  </h3>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${plan.map.lat},${plan.map.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Open in Maps <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/50 h-48">
                  {plan.map.lat && plan.map.lng ? (
                    <iframe
                      title="Trip Location"
                      width="100%"
                      height="100%"
                      loading="lazy"
                      style={{ border: 0, borderRadius: '12px' }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(plan.map.lng) - 0.05},${Number(plan.map.lat) - 0.05},${Number(plan.map.lng) + 0.05},${Number(plan.map.lat) + 0.05}&layer=mapnik&marker=${plan.map.lat},${plan.map.lng}`}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted/30 text-sm text-muted-foreground">
                      Map location unavailable
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Budget Health Meter */}
            {budgetInfo && (
              <div className="p-4 rounded-2xl bg-card shadow-card border-2 border-border">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-display font-semibold text-foreground text-sm">Budget Health</h3>
                </div>
                <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${budgetStatus.includes("🟢") || budgetStatus.includes("Within") ? "bg-emerald-500/10" :
                  budgetStatus.includes("🟡") || budgetStatus.includes("Near") ? "bg-amber-500/10" :
                    "bg-red-500/10"
                  }`}>
                  <StatusIcon className={`h-5 w-5 ${getStatusColor()}`} />
                  <span className={`text-sm font-semibold ${getStatusColor()}`}>{budgetStatus}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget Used</span>
                    <span className="font-semibold text-foreground">
                      {budgetInfo.totalEstimated || "₹0"} / {budgetInfo.userBudget || `₹${parseInt(budget).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className={`h-full rounded-full ${budgetUsagePercent <= 70 ? "bg-emerald-500" :
                        budgetUsagePercent <= 90 ? "bg-amber-500" :
                          "bg-red-500"
                        }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Remaining: {budgetInfo.remaining || "₹0"}
                    </span>
                    <span className="font-semibold">{budgetUsagePercent}% used</span>
                  </div>
                </div>
                {plan.adjustments && plan.adjustments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Budget Adjustments</p>
                    <div className="space-y-1">
                      {plan.adjustments.map((adj: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {adj}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Budget Breakdown */}
            {plan.budgetBreakdown && plan.budgetHealth && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3">Budget Breakdown</h3>
                <div className="space-y-2">
                  {[
                    { label: "Accommodation", value: plan.budgetBreakdown.accommodation, icon: Hotel },
                    { label: "Food", value: plan.budgetBreakdown.food, icon: Utensils },
                    { label: "Activities", value: plan.budgetBreakdown.activities, icon: Camera },
                    { label: "Transport", value: plan.budgetBreakdown.transport, icon: MapPin },
                    { label: "Miscellaneous", value: plan.budgetBreakdown.miscellaneous, icon: ShoppingBag },
                  ].map((item) => {
                    if (!item.value) return null;
                    const total = plan.budgetHealth.totalEstimated || 1;
                    const pct = (item.value / total) * 100;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1 items-center">
                            <span className="text-foreground font-medium flex items-center gap-2">
                              {item.label}
                              {item.label === "Accommodation" && (
                                <a 
                                  href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(plan.destination || destination)}`} 
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors font-bold"
                                >
                                  Book Hotels
                                </a>
                              )}
                            </span>
                            <span className="text-primary font-semibold">₹{item.value.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.6 }} className="h-full rounded-full gradient-hero" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">Total Estimated</span>
                  <span className="text-lg font-bold text-gradient-hero">₹{(plan.budgetHealth.totalEstimated || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* How to Get There */}
            {plan.travelOptions && plan.travelOptions.length > 0 && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <Navigation className="h-4 w-4 text-primary" /> How to Get There
                </h3>
                <div className="space-y-3">
                  {plan.travelOptions.map((opt: TravelOption, i: number) => {
                    const modeLower = opt.mode?.toLowerCase() || '';
                    const icon = modeLower.includes("train") ? Train
                      : modeLower.includes("flight") || modeLower.includes("fly") ? Plane
                        : modeLower.includes("bus") ? Bus : Car;
                    const Icon = icon;
                    const isBudget = modeLower.includes("bus") || modeLower.includes("train");
                    const route = opt.from && opt.to ? `${opt.from} to ${opt.to}` : 'N/A';
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isBudget ? "bg-emerald-500/10" : "bg-primary/10"}`}>
                          <Icon className={`h-5 w-5 ${isBudget ? "text-emerald-600" : "text-primary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground">{opt.mode}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isBudget ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                              {isBudget ? "Budget" : "Comfort"}
                            </span>
                            {modeLower.includes("flight") && (
                              <a 
                                href={`https://www.skyscanner.net/transport/flights-from/${encodeURIComponent((opt.from || 'any').toLowerCase())}/to/${encodeURIComponent((opt.to || plan.destination || destination).toLowerCase())}`} 
                                target="_blank" rel="noopener noreferrer"
                                className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full hover:bg-sky-500/20 transition-colors font-bold"
                              >
                                Search Flights
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{route}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-semibold text-foreground">₹{opt.estimatedCost?.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground">• {opt.duration}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Local Transport */}
            {plan.localTransport && plan.localTransport.length > 0 && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-coral" /> Getting Around Locally
                </h3>
                <div className="space-y-2">
                  {plan.localTransport.map((item: LocalTransportOption, i: number) => {
                    const modeLower = item.mode?.toLowerCase() || '';
                    let Icon = Car;
                    if (modeLower.includes('bus')) Icon = Bus;
                    if (modeLower.includes('metro') || modeLower.includes('train')) Icon = TramFront;
                    if (modeLower.includes('scooter') || modeLower.includes('bike')) Icon = Bike;
                    if (modeLower.includes('ride-sharing') || modeLower.includes('taxi')) Icon = Car;
                    if (modeLower.includes('rickshaw') || modeLower.includes('tuk-tuk')) Icon = Car;

                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                      >
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-coral/10">
                          <Icon className="h-5 w-5 text-coral" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{item.mode}</span>
                            {item.estimatedDailyCost > 0 && <span className="text-xs font-bold text-primary">~₹{item.estimatedDailyCost.toLocaleString()}/day</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Budget Tracker */}
            {budgetInfo && budgetInfo.usagePercentage !== undefined && (
              <div className="sticky top-4 z-40 mb-6 bg-card/90 backdrop-blur-xl p-4 rounded-2xl border border-border/50 shadow-elevated">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-5 w-5 ${getStatusColor()}`} />
                    <span className="font-bold text-sm text-foreground">Estimated Cost: ₹{budgetInfo.totalEstimated?.toLocaleString() || 0}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">Budget: ₹{budgetInfo.userBudget?.toLocaleString() || budget}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getStatusColor().replace('text-', 'bg-')}`} 
                    style={{ width: `${Math.min(100, budgetUsagePercent)}%` }} 
                  />
                </div>
                <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${getStatusColor()}`}>{budgetStatus}</p>
              </div>
            )}

            {/* Interactive Route Map (Feature 2) */}
            {plan.itinerary && plan.itinerary.length > 0 && (
              <div className={`fixed inset-0 z-50 bg-background md:static md:z-auto md:bg-transparent md:block ${showMobileMap ? 'block' : 'hidden'}`}>
                {showMobileMap && (
                   <div className="absolute top-0 left-0 w-full p-4 bg-background/80 backdrop-blur z-50 flex justify-between items-center md:hidden border-b border-border">
                     <h3 className="font-bold text-foreground">Interactive Map</h3>
                     <button onClick={() => setShowMobileMap(false)} className="p-2 bg-muted rounded-full text-foreground"><X className="h-4 w-4" /></button>
                   </div>
                )}
                <div className={`${showMobileMap ? 'pt-16 h-full' : ''}`}>
                  <InteractiveMap plan={plan} />
                </div>
              </div>
            )}

            {/* Mobile Map Toggle FAB */}
            {plan && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden">
                <button 
                  onClick={() => setShowMobileMap(!showMobileMap)}
                  className="bg-foreground text-background px-6 py-3 rounded-full shadow-elevated flex items-center gap-2 font-bold text-sm hover:scale-105 transition-transform"
                >
                  <Map className="h-4 w-4" /> {showMobileMap ? "Hide Map" : "View Map"}
                </button>
              </div>
            )}

            {/* Day-wise Itinerary with Images from AI */}
            <ItineraryDisplay 
              plan={plan}
              activeDayIndex={activeDayIndex}
              regeneratingDay={regeneratingDay}
              isSwapping={isSwapping}
              onRegenerateDay={handleRegenerateDay}
              onSwapActivity={handleSwapActivity}
            />



            {/* Packing List */}
            {plan.packingList && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <Backpack className="h-4 w-4 text-primary" /> Packing Checklist
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {plan.packingList.map((item: string, i: number) => {
                    const isPacked = plan.packedItems?.includes(item);
                    return (
                      <label key={i} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={isPacked || false}
                          onChange={() => {
                            if (!plan) return;
                            const isPacked = plan.packedItems?.includes(item);
                            const updatedItems = isPacked 
                                ? plan.packedItems?.filter(x => x !== item) 
                                : [...(plan.packedItems || []), item];
                            const updatedPlan = { ...plan, packedItems: updatedItems };
                            setPlan(updatedPlan);
                            if (tripId) updateRemotePlan(updatedPlan);
                          }}
                          className="rounded border-border text-primary focus:ring-primary/20 transition-colors" 
                        />
                        <span className={`transition-all duration-300 ${isPacked ? 'line-through opacity-50' : 'group-hover:text-foreground'}`}>
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Safety Tips */}
            {plan.safetyTips && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-coral" /> Safety Tips
                </h3>
                <div className="space-y-2">
                  {plan.safetyTips.map((tip: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-coral font-bold">{i + 1}.</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {plan && <FloatingChatButton onClick={() => setIsChatOpen(true)} />}
      <AnimatePresence>
        {isChatOpen && plan && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Chatbot
              plan={plan}
              onClose={() => setIsChatOpen(false)}
              messages={chatMessages}
              setMessages={setChatMessages}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden PDF content for export */}
      {plan && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <TripPDF ref={pdfRef} plan={plan} destination={destination} />
        </div>
      )}
    </div>
  );
};

export default PlanTrip;
