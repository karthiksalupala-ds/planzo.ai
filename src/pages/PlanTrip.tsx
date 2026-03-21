import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles, Send, MapPin, IndianRupee, Calendar, Users, ChevronRight,
  Hotel, Utensils, Camera, Loader2, Heart, Mountain, Palmtree, Baby,
  User, Shield, Backpack, CloudSun, AlertCircle, Save, Train, Plane, Bus, RefreshCw, Pencil, TramFront, Bike,
  Car, Navigation, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Share2, XCircle, ShoppingBag, Printer, Download, Plus, X, Clock, Navigation2, Map, CalendarPlus, PieChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import FloatingChatButton from "@/components/FloatingChatButton";
import Chatbot from "@/components/Chatbot";
// import PlanSkeleton from "@/pages/PlanSkeleton";
import TripPDF from "@/components/TripPDF";
import type { LocalTransportOption, TripActivity, TripDay, TripPlan, TravelOption } from "@/types/trip-plan";
import { getPexelsImage } from "@/lib/pexels";
import InteractiveMap from "@/components/InteractiveMap";
import ItineraryDisplay from "@/components/ItineraryDisplay";
import { generateAlternativeActivity } from "@/lib/stream-ai";
import { indianDestinations } from "@/data/destinations";
import TripCountdown from "@/components/TripCountdown";
import { downloadTripICS, openGoogleCalendar } from "@/lib/calendar";
import TravelMode from "@/components/TravelMode";

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
  const [showTravelMode, setShowTravelMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { text: "Hello! I'm your AI trip assistant. Ask me anything about your plan.", isUser: false },
  ]);

  // Budget state
  const parsedDays = initialDays ? parseInt(initialDays) : 3;
  const [budget, setBudget] = useState(initialBudget && initialBudget !== "NaN" ? initialBudget : "15000");
  const [days, setDays] = useState(isNaN(parsedDays) ? 3 : parsedDays);
  const [travelers, setTravelers] = useState(2);
  const [startDate, setStartDate] = useState("");
  const [vibe, setVibe] = useState("Standard");

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
      budget: parseFloat(budget) || 0,
      days,
      travelers,
      plan_data: (plan as unknown) as Json,
      start_date: startDate || null,
      status: "planned",
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
    toast({ title: "Generating PDF...", description: "Your itinerary is being exported." });
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
            vibe,
          }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data: TripPlan = await response.json();

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
            vibe,
          }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data: TripDay = await response.json();

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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
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
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <CalendarPlus className="h-3 w-3" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Vibe
            </label>
            <select
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium cursor-pointer"
            >
              <option value="Standard">Standard</option>
              <option value="Budget">Budget</option>
              <option value="Luxury">Luxury</option>
              <option value="Adventure">Adventure</option>
            </select>
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
            <p className="text-xs font-semibold text-muted-foreground">your itinerary with images...</p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 8, ease: "linear", repeat: Infinity }} className="h-full rounded-full gradient-hero" />
          </div>
        </motion.div>
      )}

      {/* Generated Plan */}
      <AnimatePresence>
        {plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            {/* Header / Summary Card */}
            <div className="p-0 rounded-[32px] bg-card shadow-elevated overflow-hidden border border-border/50 mb-8">
              {plan.destinationImage && (
                <div className="relative h-72 overflow-hidden">
                  <img src={plan.destinationImage} alt={plan.destination} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute bottom-6 left-8 right-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {plan.weatherNote && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold">
                              <CloudSun className="h-3 w-3" />
                              {(plan.weatherNote as string).split('.')[0]}
                            </div>
                          )}
                        </div>
                        <h2 className="font-display font-black text-4xl text-white tracking-tight drop-shadow-md">{plan.destination}</h2>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary-foreground text-[10px] font-bold uppercase tracking-widest">{activeMood} Adventure</span>
                          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{days} Days</span>
                          {plan.vibe && (
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-widest">{plan.vibe}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleShareTrip} className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-colors shadow-sm"><Share2 className="h-5 w-5" /></button>
                        <button onClick={handleSaveTrip} disabled={saving} className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {saving ? "Saving..." : tripId ? "Update Plan" : "Save Trip"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!plan.destinationImage && (
                <div className="p-8 border-b border-border/50">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <h2 className="font-display font-black text-3xl text-foreground tracking-tight">{plan.destination}</h2>
                    <div className="flex gap-2">
                      <button onClick={handleShareTrip} className="p-3 rounded-2xl bg-card border border-border hover:bg-muted transition-colors shadow-sm"><Share2 className="h-4 w-4 text-foreground" /></button>
                      <button onClick={handleSaveTrip} disabled={saving} className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg flex items-center gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-8 pt-6">
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-2xl">{plan.summary}</p>
                <div className="flex flex-wrap gap-4 mt-6">
                  {startDate && <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 text-xs font-bold"><Calendar className="h-3.5 w-3.5" /> Starts {new Date(startDate).toLocaleDateString()}</div>}
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl border border-primary/20 text-xs font-bold"><Users className="h-3.5 w-3.5" /> {travelers} Travelers</div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 text-xs font-bold"><IndianRupee className="h-3.5 w-3.5" /> Budget: ₹{parseInt(budget).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="space-y-6">
              <div className="flex items-center gap-1 p-1 bg-muted/40 backdrop-blur-md rounded-2xl border border-border/50 w-full md:w-fit overflow-x-auto scrollbar-hide">
                {(['itinerary', 'map', 'budget', 'logistics'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      const searchParams = new URLSearchParams(window.location.search);
                      searchParams.set('tab', tab);
                      window.history.replaceState({}, '', `?${searchParams.toString()}`);
                      window.dispatchEvent(new Event('popstate'));
                    }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${(new URLSearchParams(window.location.search).get('tab') || 'itinerary') === tab
                        ? "bg-card text-foreground shadow-card border border-border/50"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content Rendering */}
              {(() => {
                const activeTab = new URLSearchParams(window.location.search).get('tab') || 'itinerary';

                switch (activeTab) {
                  case 'itinerary':
                    return (
                      <div className="space-y-6">
                        <ItineraryDisplay
                          plan={plan}
                          activeDayIndex={activeDayIndex}
                          regeneratingDay={regeneratingDay}
                          isSwapping={isSwapping}
                          onRegenerateDay={handleRegenerateDay}
                          onSwapActivity={handleSwapActivity}
                        />
                      </div>
                    );

                  case 'map':
                    return (
                      <div className="bg-card rounded-3xl border border-border/50 shadow-elevated overflow-hidden h-[600px] relative">
                        <InteractiveMap plan={plan} />
                        <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                          <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border inline-block pointer-events-auto">
                            <p className="text-xs font-bold text-foreground">Click markers to see details</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Real-time road paths calculated via Google Directions API</p>
                          </div>
                        </div>
                      </div>
                    );

                  case 'budget':
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Budget Health Meter */}
                        {budgetInfo && (
                          <div className="p-6 rounded-[32px] bg-card shadow-card border border-border/50">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-display font-bold text-foreground text-lg">Budget Health</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Real-time Tracking</p>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className={`flex items-center gap-3 p-4 rounded-2xl ${budgetStatus.includes("🟢") || budgetStatus.includes("Within") ? "bg-emerald-500/10" : budgetStatus.includes("🟡") || budgetStatus.includes("Near") ? "bg-amber-500/10" : "bg-red-500/10"}`}>
                                <StatusIcon className={`h-6 w-6 ${getStatusColor()}`} />
                                <span className={`text-base font-bold ${getStatusColor()}`}>{budgetStatus}</span>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                  <span className="text-xs font-bold text-muted-foreground uppercase">Utilization</span>
                                  <span className="text-xl font-black text-foreground">{budgetUsagePercent}%</span>
                                </div>
                                <div className="h-4 rounded-full bg-muted overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                                    transition={{ duration: 1 }}
                                    className={`h-full rounded-full ${budgetUsagePercent <= 70 ? "bg-emerald-500" : budgetUsagePercent <= 90 ? "bg-amber-500" : "bg-red-500"}`}
                                  />
                                </div>
                                <div className="flex justify-between text-xs font-bold mt-2">
                                  <span className="text-emerald-500">₹{budgetInfo.totalEstimated?.toLocaleString() || "0"} spent</span>
                                  <span className="text-muted-foreground">Limit: ₹{parseInt(budget).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Budget Breakdown */}
                        {plan.budgetBreakdown && (
                          <div className="p-6 rounded-[32px] bg-card shadow-card border border-border/50">
                            <h3 className="font-display font-bold text-foreground text-lg mb-6 flex items-center gap-2">
                              <PieChart className="h-5 w-5 text-primary" /> Category Analysis
                            </h3>
                            <div className="space-y-4">
                              {[
                                { label: "Accommodation", value: plan.budgetBreakdown.accommodation, icon: Hotel, color: "bg-blue-500" },
                                { label: "Food", value: plan.budgetBreakdown.food, icon: Utensils, color: "bg-orange-500" },
                                { label: "Activities", value: plan.budgetBreakdown.activities, icon: Camera, color: "bg-purple-500" },
                                { label: "Transport", value: plan.budgetBreakdown.transport, icon: MapPin, color: "bg-emerald-500" },
                                { label: "Miscellaneous", value: plan.budgetBreakdown.miscellaneous, icon: ShoppingBag, color: "bg-pink-500" },
                              ].map((item) => {
                                if (!item.value) return null;
                                const total = plan.budgetHealth?.totalEstimated || 1;
                                const pct = (item.value / total) * 100;
                                return (
                                  <div key={item.label} className="group">
                                    <div className="flex justify-between text-xs mb-2 items-center">
                                      <span className="text-foreground font-bold flex items-center gap-2">
                                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                        {item.label}
                                      </span>
                                      <span className="text-foreground font-black">₹{item.value.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${item.color}`} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );

                  case 'logistics':
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Travel Options */}
                        {plan.travelOptions && plan.travelOptions.length > 0 && (
                          <div className="p-6 rounded-[32px] bg-card shadow-card border border-border/50">
                            <h3 className="font-display font-bold text-foreground text-lg mb-6 flex items-center gap-2">
                              <Navigation className="h-5 w-5 text-primary" /> How to Get There
                            </h3>
                            <div className="space-y-3">
                              {plan.travelOptions.map((opt: TravelOption, i: number) => {
                                const modeLower = opt.mode?.toLowerCase() || '';
                                const Icon = modeLower.includes("train") ? Train : modeLower.includes("flight") ? Plane : Bus;
                                return (
                                  <div key={i} className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-foreground">{opt.mode}</span><span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">{opt.duration}</span></div>
                                      <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1 tracking-wider">{opt.from} → {opt.to}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Local Transport */}
                        {plan.localTransport && (
                          <div className="p-6 rounded-[32px] bg-card shadow-card border border-border/50">
                            <h3 className="font-display font-bold text-foreground text-lg mb-6 flex items-center gap-2">
                              <Car className="h-5 w-5 text-coral" /> Local Mobility
                            </h3>
                            <div className="space-y-3">
                              {plan.localTransport.map((item: LocalTransportOption, i: number) => (
                                <div key={i} className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                  <div className="flex justify-between items-center"><span className="text-sm font-bold text-foreground">{item.mode}</span><span className="text-xs font-black text-primary">₹{item.estimatedDailyCost}/day</span></div>
                                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{item.notes}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Essentials */}
                        <div className="p-6 rounded-[32px] bg-card shadow-card border border-border/50">
                          <h3 className="font-display font-bold text-foreground text-lg mb-6 flex items-center gap-2">
                            <Backpack className="h-5 w-5 text-primary" /> Packing & Safety
                          </h3>
                          <div className="space-y-6">
                            <div>
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Checklist</p>
                              <div className="flex flex-wrap gap-2">
                                {plan.packingList?.slice(0, 10).map((item: string, i: number) => (
                                  <span key={i} className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-xs font-medium text-foreground">{item}</span>
                                ))}
                              </div>
                            </div>
                            <div className="pt-6 border-t border-border/50">
                              <p className="text-[10px] font-black uppercase text-coral tracking-widest mb-3">Safety Protocols</p>
                              <div className="space-y-2">
                                {plan.safetyTips?.slice(0, 3).map((tip: string, i: number) => (
                                  <div key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed"><Shield className="h-3.5 w-3.5 text-coral flex-shrink-0" /> {tip}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                  default: return null;
                }
              })()}
            </div>
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

      {/* Travel Mode Overlay */}
      <AnimatePresence>
        {showTravelMode && plan && (
          <TravelMode
            plan={plan}
            startDate={startDate || undefined}
            onClose={() => setShowTravelMode(false)}
          />
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
