import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Sparkles, Send, MapPin, IndianRupee, Calendar, Users, ChevronRight,
  Hotel, Utensils, Camera, Loader2, Heart, Mountain, Palmtree, Baby,
  User, Shield, Backpack, CloudSun, AlertCircle, Save, Train, Plane, Bus, RefreshCw, Pencil, TramFront, Bike,
  Car, Navigation, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Share2, XCircle, ShoppingBag, Printer, Download, Plus, X, Clock, Navigation2, Map, CalendarPlus, PieChart, Zap, Star, ListChecks, IndianRupee as Rupee
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
import { getAllDestinations } from "@/data/destinations";
import ErrorBoundary from "@/components/ErrorBoundary";
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

// ── AI Caption Cycler Component ──────────────────────────────────────
const AI_CAPTIONS = [
  { icon: "✈️", title: "Booking your imagination...", sub: "Scanning 185+ destinations for the perfect match" },
  { icon: "🗺️", title: "Charting unexplored routes...", sub: "Calculating optimal day-by-day experiences" },
  { icon: "🌤️", title: "Checking the skies...", sub: "Fetching live weather & seasonal insights" },
  { icon: "🏨", title: "Curating your stay...", sub: "Matching stays to your budget & vibe" },
  { icon: "🍜", title: "Scouting local eats...", sub: "Finding must-try dishes and hidden gems" },
  { icon: "💡", title: "Crafting insider tips...", sub: "Sourcing pro travel advice for your itinerary" },
  { icon: "🎒", title: "Packing your bags...", sub: "Building a smart packing list for your journey" },
  { icon: "🎯", title: "Almost there...", sub: "Putting the final touches on your perfect trip" },
];

function AICaptionCycler({ destination }: { destination: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % AI_CAPTIONS.length), 2800);
    return () => clearInterval(t);
  }, []);
  const cap = AI_CAPTIONS[index];
  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-5xl">{cap.icon}</span>
          <p className="text-xl font-black text-white tracking-tight">{cap.title}</p>
          <p className="text-sm text-white/40 font-medium">
            {destination ? `${destination} — ${cap.sub}` : cap.sub}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const PlanTrip = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [tripOwnerId, setTripOwnerId] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [showTravelMode, setShowTravelMode] = useState(false);
  const [logisticsTab, setLogisticsTab] = useState<"all" | "flights" | "trains" | "buses">("all");
  const [packingChecked, setPackingChecked] = useState<Set<number>>(new Set());
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
      const matches = getAllDestinations()
        .filter(d =>
          d.name.toLowerCase().includes(value.toLowerCase()) ||
          d.state.toLowerCase().includes(value.toLowerCase())
        )
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

  const { toast } = useToast();
  const { user } = useAuth();

  // ── STAGE 3: MICRO-INTERACTION STATES ──
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const moveX = (clientX - window.innerWidth / 2) / 45;
    const moveY = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x: moveX, y: moveY });
  };

  const vibeConfig: Record<string, { color: string, glow: string, bg: string }> = {
    "Standard": { color: "rgb(99, 102, 241)", glow: "rgba(99, 102, 241, 0.4)", bg: "bg-indigo-600" },
    "Budget": { color: "rgb(16, 185, 129)", glow: "rgba(16, 185, 129, 0.4)", bg: "bg-emerald-600" },
    "Luxury": { color: "rgb(245, 158, 11)", glow: "rgba(245, 158, 11, 0.4)", bg: "bg-amber-500" },
    "Adventure": { color: "rgb(244, 63, 94)", glow: "rgba(244, 63, 94, 0.4)", bg: "bg-rose-500" },
  };
  const activeConfig = vibeConfig[vibe] || vibeConfig["Standard"];

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
          if (data.user_id) setTripOwnerId(data.user_id);
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
  const isOwner = !tripId || (user && tripOwnerId === user.id);
  const isGuest = !user;
  const isViewer = user && tripOwnerId && tripOwnerId !== user.id;
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
      setSearchParams({ id: data.id }, { replace: true });
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
            userTravelStyle: user?.user_metadata?.travel_style || [],
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
        if (tripId) {
          void updateRemotePlan(updated);
        }

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
        if (tripId) {
          void updateRemotePlan(updated);
        }
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
      if (tripId) {
        void updateRemotePlan(updated);
      }
      return updated;
    });
  };

  // Parse budget info from plan
  const budgetInfo = plan?.budgetHealth || null;
  const budgetUsagePercent = budgetInfo?.usagePercentage || 0;
  const budgetStatus = budgetInfo?.status || "";

  const getStatusColor = () => {
    if (budgetStatus.includes("Ã°Å¸Å¸Â¢") || budgetStatus.includes("Within")) return "text-emerald-500";
    if (budgetStatus.includes("Ã°Å¸Å¸Â¡") || budgetStatus.includes("Near")) return "text-amber-500";
    if (budgetStatus.includes("Ã°Å¸â€Â´") || budgetStatus.includes("Over")) return "text-red-500";
    return "text-primary";
  };

  const getStatusIcon = () => {
    if (budgetStatus.includes("Ã°Å¸Å¸Â¢") || budgetStatus.includes("Within")) return CheckCircle;
    if (budgetStatus.includes("Ã°Å¸Å¸Â¡") || budgetStatus.includes("Near")) return AlertTriangle;
    if (budgetStatus.includes("Ã°Å¸â€ Â´") || budgetStatus.includes("Over")) return XCircle;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HERO SECTION ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: "560px" }}>
        {/* Gradient backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #0f0c29 0%, #1a1a4e 30%, #24243e 60%, #0d1b4b 100%)",
          }}
        />
        
        {/* Decorative mask for bottom transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-95" />

        {/* Animated blobs */}
        <motion.div
          className="absolute top-[-80px] left-[-60px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ width: 380, height: 380, background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-100px] right-[-80px] rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ width: 460, height: 460, background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
          animate={{ x: [0, -25, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-48">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <span
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em]"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#a5b4fc",
                backdropFilter: "blur(12px)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Trip Planner
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-10 font-display font-black leading-tight tracking-tighter"
            style={{ fontSize: "clamp(2.8rem, 7vw, 4.8rem)", color: "#ffffff" }}
          >
            Your Next Adventure{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #818cf8, #38bdf8, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Starts Here
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 max-w-2xl text-base md:text-xl opacity-80 leading-relaxed mx-auto"
            style={{ color: "rgba(196,213,255,0.85)" }}
          >
            Craft a stunning, fully personalized itinerary — complete with budgets, logistics &amp; day-by-day activities in seconds.
          </motion.p>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-8 md:gap-16 pt-4">
            {[
              { val: "1.2M+", label: "Trips Orchestrated" },
              { val: "185+", label: "Destinations" },
              { val: "4.9/5", label: "User Trust Score" }
            ].map(s => (
              <div key={s.label} className="text-center group">
                <p className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">{s.val}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── SEARCH CARD ── */}
      <div className="relative z-30 px-4 md:px-6 max-w-4xl mx-auto -mt-36 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring", damping: 20 }}
          className="rounded-[40px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border-t border-white/40"
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(48px) saturate(200%)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, 0.5), 0 32px 64px -16px ${activeConfig.glow}`,
          }}
        >
          {/* Card header – Mood chips */}
          <div className="px-10 pt-10 pb-6 border-b" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-5" style={{ color: activeConfig.color }}>
              Personalize Your Journey
            </p>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMood(m.id)}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-[20px] text-xs font-black transition-all duration-300 ${
                    activeMood === m.id
                      ? `${activeConfig.bg} text-white shadow-[0_12px_24px_-4px_${activeConfig.glow}] scale-[1.05]`
                      : "bg-slate-100/60 text-slate-500 hover:bg-slate-200/60 hover:text-slate-700"
                  }`}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card body */}
          <div className="p-10 pt-8">
            {/* AI Input */}
            <div className="flex items-start gap-6">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-xl shadow-indigo-600/20 ring-1 ring-white/20"
              >
                <Sparkles className="h-7 w-7 text-white" />
              </motion.div>
              <div className="flex-1 space-y-4">
                <AnimatePresence mode="popLayout">
                  {destinations.map((dest, index) => (
                    <motion.div 
                      key={index} 
                      layout
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative group"
                    >
                      {index > 0 && (
                        <div className="flex items-center gap-4 py-2 opacity-30">
                          <div className="h-px flex-1 bg-slate-200" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: activeConfig.color }}>Next Stop</span>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>
                      )}
                      <div className="relative flex items-center gap-4">
                        <div className="flex-1 relative">
                          <input
                            value={dest}
                            onChange={(e) => handleDestinationChangeWithSuggest(index, e.target.value)}
                            onKeyDown={handleDestinationKeyDown}
                            onBlur={() => setTimeout(() => { setSuggestions([]); setAutocompleteIndex(null); }, 150)}
                            placeholder={index === 0 ? 'Where to? (e.g. Kyoto, Japan)' : 'Next destination...'}
                            className="w-full bg-slate-100/40 rounded-[22px] px-6 py-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 transition-all font-bold border border-slate-200/60 group-hover:bg-slate-100/80 group-focus-within:border-transparent group-focus-within:bg-white overflow-hidden shadow-inner"
                            style={{ 
                              '--tw-ring-color': activeConfig.glow,
                            } as any}
                            autoComplete="off"
                          />
                          {/* Autocomplete dropdown */}
                          <AnimatePresence>
                            {autocompleteIndex === index && suggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute left-0 right-0 top-full mt-2 z-50 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[28px] shadow-2xl overflow-hidden py-3"
                              >
                                {suggestions.map((s, idx) => (
                                  <motion.button
                                    key={s}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onMouseDown={() => handleSuggestionClick(index, s)}
                                    className="w-full text-left px-7 py-3.5 text-sm text-slate-700 hover:bg-slate-50 hover:pl-9 transition-all flex items-center gap-4 font-bold active:scale-[0.99]"
                                  >
                                    <MapPin className="h-4 w-4" style={{ color: activeConfig.color }} />
                                    {s}
                                  </motion.button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {destinations.length > 1 && (
                          <button
                            onClick={() => removeStop(index)}
                            className="p-3.5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all active:scale-90"
                            title="Remove stop"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {destinations.length < 5 && (
                  <button
                    onClick={addStop}
                    className="flex items-center gap-2 text-[11px] font-black hover:opacity-80 transition-all mt-2 uppercase tracking-widest pl-2"
                    style={{ color: activeConfig.color }}
                  >
                    <Plus className="h-4 w-4" /> Add Destination
                  </button>
                )}
              </div>
            </div>

            {/* Quick Options */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mt-10">
              {[
                { label: "Budget (₹)", icon: IndianRupee, value: budget, onChange: setBudget, type: "number", min: 500 },
                { label: "Days", icon: Calendar, value: days, onChange: (v: string) => setDays(Math.min(30, Math.max(1, parseInt(v) || 1))), type: "number", min: 1, max: 30 },
                { label: "Travelers", icon: Users, value: travelers, onChange: (v: string) => setTravelers(Math.min(20, Math.max(1, parseInt(v) || 1))), type: "number", min: 1, max: 20 },
              ].map((opt) => (
                <div key={opt.label} className="flex flex-col gap-2">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                    <opt.icon className="h-3 w-3" style={{ color: activeConfig.color }} /> {opt.label}
                  </label>
                  <input
                    type={opt.type}
                    value={opt.value}
                    min={opt.min}
                    max={opt.max}
                    onChange={(e) => opt.onChange(e.target.value)}
                    className="px-5 py-4 rounded-[22px] bg-slate-100/40 text-sm text-slate-900 outline-none focus:ring-4 border border-slate-200/60 transition-all font-bold focus:bg-white"
                    style={{ '--tw-ring-color': activeConfig.glow } as any}
                  />
                </div>
              ))}
              
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                  <CalendarPlus className="h-3 w-3" style={{ color: activeConfig.color }} /> Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-5 py-4 rounded-[22px] bg-slate-100/40 text-sm text-slate-900 outline-none focus:ring-4 border border-slate-200/60 transition-all font-bold focus:bg-white"
                  style={{ '--tw-ring-color': activeConfig.glow } as any}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01, boxShadow: `0 20px 40px -12px ${activeConfig.glow}` }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlan}
              disabled={isPlanning || !destination.trim()}
              className={`w-full mt-10 py-5 rounded-[26px] ${activeConfig.bg} text-white font-black text-[11px] uppercase tracking-[0.28em] flex items-center justify-center gap-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden`}
              style={{ boxShadow: `0 15px 35px -12px ${activeConfig.glow}` }}
            >
              {isPlanning && (
                <motion.div 
                   initial={{ x: "-100%" }} 
                   animate={{ x: "100%" }} 
                   transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              )}
              {isPlanning ? (
                <><Loader2 className="h-6 w-6 animate-spin" /> Orchestrating Itinerary...</>
              ) : (
                <><Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" /> Create My Adventure</>
              )}
            </motion.button>
            
            {!user && (
              <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-widest">
                <User className="h-3 w-3 inline-block mr-1 mb-0.5 opacity-50" />
                <button onClick={() => navigate('/auth')} className="hover:underline transition-colors" style={{ color: activeConfig.color }}>Sign in</button> to preserve your global explorations
              </p>
            )}
          </div>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-8 p-6 rounded-[32px] bg-white border border-rose-100 shadow-xl flex items-start gap-4 mx-auto max-w-2xl">
              <AlertCircle className="h-6 w-6 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-rose-600 uppercase tracking-widest leading-none mb-2">Systems Interrupted</p>
                <p className="text-xs text-rose-500/80 font-medium leading-relaxed">{error}</p>
                <button onClick={handlePlan} className="mt-4 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-all">Re-attempt Generation</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streaming indicator */}
        <AnimatePresence>
          {isPlanning && !plan && (
            <motion.div
              key="ai-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center"
              style={{ background: "rgba(10, 8, 30, 0.92)", backdropFilter: "blur(24px)" }}
            >
              {/* Animated blobs */}
              <motion.div
                className="absolute top-1/4 left-1/4 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ width: 500, height: 500, background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-1/4 right-1/4 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ width: 400, height: 400, background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              />

              <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-lg w-full">
                {/* Spinning orb */}
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="h-24 w-24 rounded-full border-2 border-indigo-500/30"
                    style={{ borderTopColor: "#6366f1" }}
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-2 border-cyan-500/20"
                    style={{ borderBottomColor: "#06b6d4" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-indigo-400" />
                  </div>
                </div>

                {/* Cycling captions */}
                <AICaptionCycler destination={destination} />

                {/* Progress bar */}
                <div className="w-full max-w-xs">
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                    />
                  </div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-4">Powered by Planzo AI</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-widest">{String(plan.vibe)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleShareTrip} className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-colors shadow-sm"><Share2 className="h-5 w-5" /></button>
                        <button
                          onClick={isOwner ? handleSaveTrip : isGuest ? () => navigate("/auth") : handleSaveTrip}
                          disabled={saving}
                          className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {saving ? "Processing..." : isOwner ? (tripId ? "Update Plan" : "Save Trip") : isGuest ? "Sign Up to Save" : "Duplicate to My Trips"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!plan.destinationImage && (
                <div className="p-8 border-b border-border/50">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <h2 className="font-display font-black text-3xl text-slate-800 dark:text-slate-100 tracking-tight">{plan.destination}</h2>
                    <div className="flex gap-2">
                      <button onClick={handleShareTrip} className="p-3 rounded-2xl bg-card border border-border hover:bg-muted transition-colors shadow-sm"><Share2 className="h-4 w-4 text-slate-800 dark:text-slate-100" /></button>
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
                  {startDate && <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 text-xs font-bold whitespace-nowrap"><Calendar className="h-3.5 w-3.5 flex-shrink-0" /> Starts {new Date(startDate).toLocaleDateString()}</div>}
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl border border-primary/20 text-xs font-bold whitespace-nowrap"><Users className="h-3.5 w-3.5 flex-shrink-0" /> {travelers} Travelers</div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 text-xs font-bold whitespace-nowrap"><IndianRupee className="h-3.5 w-3.5 flex-shrink-0" /> Budget: ₹{parseInt(budget).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="space-y-6">
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-[400px] md:static md:w-fit md:translate-x-0 md:max-w-none flex items-center justify-between md:justify-start gap-1 p-1.5 md:p-1 bg-background/95 md:bg-muted/40 backdrop-blur-xl md:backdrop-blur-md rounded-2xl border border-border shadow-2xl md:shadow-none">
                {(['itinerary', 'map', 'budget', 'logistics'] as const).map((tab) => {
                  const isActive = (searchParams.get('tab') || 'itinerary') === tab;
                  const getTabIcon = () => {
                    switch(tab) {
                      case 'itinerary': return <ListChecks className="h-5 w-5 md:hidden" />;
                      case 'map': return <Map className="h-5 w-5 md:hidden" />;
                      case 'budget': return <IndianRupee className="h-5 w-5 md:hidden" />;
                      case 'logistics': return <Navigation className="h-5 w-5 md:hidden" />;
                    }
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set('tab', tab);
                        setSearchParams(next, { replace: true });
                      }}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 md:block md:flex-none md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                        isActive
                          ? "bg-card text-slate-800 dark:text-slate-100 shadow-card border border-border/50 scale-105 md:scale-100"
                          : "text-muted-foreground hover:text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {getTabIcon()}
                      <span className={isActive ? "block" : "hidden md:block"}>{tab}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Rendering */}
              {(() => {
                const activeTab = searchParams.get('tab') || 'itinerary';

                switch (activeTab) {
                  case 'itinerary':
                    return (
                      <div className="space-y-6">
                        <ItineraryDisplay
                          plan={plan}
                          activeDayIndex={activeDayIndex}
                          regeneratingDay={regeneratingDay}
                          isSwapping={isSwapping}
                          isReadOnly={!isOwner}
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
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Click markers to see details</p>
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
                                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg">Budget Health</h3>
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
                                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">{budgetUsagePercent}%</span>
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
                              
                              <button
                                onClick={() => {
                                  if (tripId) {
                                    navigate(`/trip/${tripId}/expenses`);
                                  } else {
                                    toast({
                                      title: "Save Trip First",
                                      description: "Please save this trip before tracking actual expenses.",
                                    });
                                    // Optional: handleSaveTrip() if we want auto-save
                                  }
                                }}
                                className="w-full mt-4 py-3 bg-foreground text-background font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                              >
                                <IndianRupee className="h-4 w-4" />
                                {tripId ? "Track Real Expenses" : "Save Trip to Track Expenses"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Budget Breakdown */}
                        {plan.budgetBreakdown && (
                          <div className="p-6 rounded-[32px] bg-card shadow-card border border-border/50">
                            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
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
                                      <span className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-2">
                                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                        {item.label}
                                      </span>
                                      <span className="text-slate-800 dark:text-slate-100 font-black">₹{item.value.toLocaleString()}</span>
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
                    {
                      const flights = plan.travelOptions?.filter((o: any) => o.mode?.toLowerCase().includes('flight')) || [];
                      const trains = plan.travelOptions?.filter((o: any) => o.mode?.toLowerCase().includes('train')) || [];
                      const buses = plan.travelOptions?.filter((o: any) => o.mode?.toLowerCase().includes('bus')) || [];

                      const filteredOptions = logisticsTab === "flights" ? flights
                        : logisticsTab === "trains" ? trains
                        : logisticsTab === "buses" ? buses
                        : plan.travelOptions || [];

                      const allPrices = (plan.travelOptions || []).map((o: any) => o.price ?? o.estimatedCost ?? 0).filter((p: number) => p > 0);
                      const cheapestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
                      const fastestDuration = (plan.travelOptions || []).reduce((acc: string | null, o: any) => {
                        if (!o.duration) return acc;
                        return acc ? acc : o.duration;
                      }, null);

                      const getModeConfig = (mode?: string) => {
                        const m = mode?.toLowerCase() || '';
                        if (m.includes('flight')) return { Icon: Plane, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'FLIGHT', btnClass: 'from-blue-600 to-blue-500' };
                        if (m.includes('train')) return { Icon: Train, color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'TRAIN', btnClass: 'from-emerald-600 to-emerald-500' };
                        return { Icon: Bus, color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'BUS', btnClass: 'from-orange-600 to-orange-500' };
                      };

                      const generateDeepLink = (opt: any) => {
                        if (opt.bookingUrl && opt.bookingUrl.startsWith('http')) return opt.bookingUrl;
                        
                        const m = opt.mode?.toLowerCase() || '';
                        const toDest = (opt.to || plan.destination || '').split(',')[0].trim().toLowerCase();
                        const dateObj = startDate ? new Date(startDate) : new Date();
                        const yymm = dateObj.toISOString().substring(2, 7).replace('-', '');
                        
                        if (m.includes('flight')) return `https://www.skyscanner.co.in/transport/flights/any/${toDest}?oym=${yymm}`;
                        if (m.includes('train')) return `https://www.makemytrip.com/railways/`;
                        if (m.includes('bus')) return `https://www.redbus.in/buses/${toDest}-tickets`;
                        return `https://www.google.com/search?q=book+${opt.mode}+to+${toDest}`;
                      };


                      const packingItems = plan.packingList || [];
                      const packingCategories = [
                        { label: 'ESSENTIALS', items: packingItems.slice(0, Math.ceil(packingItems.length / 2)) },
                        { label: 'CLOTHING & GEAR', items: packingItems.slice(Math.ceil(packingItems.length / 2)) },
                      ];

                      return (
                        <div className="space-y-6 pb-20">
                          {/* Stats Summary Bar */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <ListChecks className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{plan.travelOptions?.length ?? 0}</p>
                                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Options</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
                              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <IndianRupee className="h-5 w-5 text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{cheapestPrice ? `₹${cheapestPrice.toLocaleString()}` : '—'}</p>
                                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Cheapest</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
                              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <Zap className="h-5 w-5 text-amber-500" />
                              </div>
                              <div>
                                <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{fastestDuration ?? '—'}</p>
                                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Fastest</p>
                              </div>
                            </div>
                          </div>

                          {/* Filter Tabs */}
                          <div className="flex items-center gap-1.5 p-1.5 bg-muted/40 backdrop-blur-md rounded-2xl border border-border/50 w-fit">
                            {([
                              { id: "all", label: "All", count: plan.travelOptions?.length },
                              { id: "flights", label: "Flights", count: flights.length },
                              { id: "trains", label: "Trains", count: trains.length },
                              { id: "buses", label: "Buses", count: buses.length },
                            ] as const).map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setLogisticsTab(t.id as "all" | "flights" | "trains" | "buses")}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${logisticsTab === t.id
                                  ? "bg-card text-slate-800 dark:text-slate-100 shadow-card border border-border/50"
                                  : "text-muted-foreground hover:text-slate-800 dark:text-slate-100"}`}
                              >
                                {t.label}{t.count && t.count > 0 ? ` (${t.count})` : ''}
                              </button>
                            ))}
                          </div>

                          {/* Empty State */}
                          {filteredOptions.length === 0 && (
                            <div className="py-16 text-center rounded-[32px] border border-dashed border-border/30 bg-card">
                              <div className="h-14 w-14 rounded-full bg-muted/30 mx-auto flex items-center justify-center mb-4">
                                <AlertTriangle className="h-7 w-7 text-muted-foreground" />
                              </div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No {logisticsTab} options</p>
                              <p className="text-xs text-muted-foreground mt-1">Try switching to 'All' to see all transport options.</p>
                            </div>
                          )}

                          {/* BOARDING PASS CARDS */}
                          <div className="space-y-5">
                            {filteredOptions.map((opt: any, i: number) => {
                              const { Icon, color, bg, label, btnClass } = getModeConfig(opt.mode);
                              const price = opt.price ?? opt.estimatedCost;
                              const operatorName = opt.operator || opt.mode || 'Operator';
                              const isRecommended = opt.isRecommended || i === 0;

                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.06 }}
                                  className="relative"
                                >
                                  {isRecommended && (
                                    <div className="absolute -top-2.5 left-5 z-10 flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg" style={{ background: color, color: '#000' }}>
                                      <Sparkles className="h-2.5 w-2.5" /> Best Choice
                                    </div>
                                  )}

                                  <div className="rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card border border-border">
                                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                                          <Icon className="h-5 w-5" style={{ color }} />
                                        </div>
                                        <div>
                                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight tracking-tight">{operatorName}</p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md" style={{ background: bg, color }}>
                                              {label}
                                            </span>
                                            {opt.type && <span className="text-[9px] font-bold text-muted-foreground">{opt.type}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">from</p>
                                        <p className="text-xl font-black leading-none" style={{ color }}>
                                          {price ? `₹${price.toLocaleString()}` : '— '}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5">incl. taxes</p>
                                      </div>
                                    </div>

                                    {(opt.rating || (opt.amenities && opt.amenities.length > 0)) && (
                                      <div className="flex items-center gap-2 px-5 pb-3">
                                        {opt.rating && (
                                          <div className="flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-100">{opt.rating}</span>
                                          </div>
                                        )}
                                        {opt.amenities?.slice(0, 3).map((a: string, idx: number) => (
                                          <span key={idx} className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                                            {a}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="mx-5 h-px bg-border/50" />

                                    <div className="px-5 py-4 flex items-center justify-between gap-2">
                                      <div className="text-left flex-shrink-0">
                                        <p className="text-[22px] font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight">{opt.departureTime || '— '}</p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">{opt.from || '— '}</p>
                                        <p className="text-[9px] font-bold mt-0.5" style={{ color }}>{opt.departureTerminal || 'Main Station'}</p>
                                      </div>

                                      <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                                        <span className="text-[9px] font-black text-muted-foreground">{opt.duration || '— '}</span>
                                        <div className="relative w-full flex items-center">
                                          <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${color}40, transparent)` }} />
                                          <div className="absolute left-0 h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                                          <div className="absolute left-1/2 -translate-x-1/2 p-1 rounded-full bg-card border border-border">
                                            <Icon className="h-3 w-3" style={{ color }} />
                                          </div>
                                          <div className="absolute right-0 h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: '#4ade80' }}>On-Time</span>
                                      </div>

                                      <div className="text-right flex-shrink-0">
                                        <p className="text-[22px] font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight">{opt.arrivalTime || '— '}</p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">{opt.to || '— '}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground mt-0.5">{opt.arrivalTerminal || 'Terminal 1'}</p>
                                      </div>
                                    </div>

                                    <div className="px-5 pb-5">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                          {opt.policy && (
                                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                              <Shield className="h-3 w-3" /> {opt.policy}
                                            </span>
                                          )}
                                          {opt.availability && (
                                            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                              <Zap className="h-3 w-3" /> {opt.availability} seats left
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => window.open(generateDeepLink(opt), '_blank')}
                                        className={`w-full py-3 rounded-2xl bg-gradient-to-r ${btnClass} text-white text-[10px] font-black uppercase tracking-[0.12em] shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all`}
                                      >
                                        Select {label} <ChevronRight className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* ON-GROUND MOBILITY */}
                          {plan.localTransport && plan.localTransport.length > 0 && (
                            <div className="pt-2">
                              <div className="flex items-center gap-2 mb-5">
                                <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-primary/10">
                                  <Car className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100 tracking-tight">On-Ground Mobility</h3>
                              </div>

                              <div className="space-y-3">
                                {plan.localTransport.map((item: any, i: number) => {
                                  const isBike = item.mode?.toLowerCase().includes('bike') || item.mode?.toLowerCase().includes('rapido');
                                  const isAuto = item.mode?.toLowerCase().includes('auto');
                                  const TransIcon = isBike ? Bike : Car;
                                  const iconColor = isBike ? '#a78bfa' : isAuto ? '#fb923c' : '#4ade80';
                                  const iconBg = isBike ? 'rgba(167,139,250,0.12)' : isAuto ? 'rgba(251,146,60,0.12)' : 'rgba(74,222,128,0.12)';
                                  const appUrl = item.provider?.toLowerCase().includes('uber') ? 'https://www.uber.com'
                                    : item.provider?.toLowerCase().includes('rapido') ? 'https://www.rapido.bike'
                                    : 'https://www.olacabs.com';

                                  return (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-[24px] bg-card border border-border">
                                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
                                        <TransIcon className="h-6 w-6" style={{ color: iconColor }} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{item.provider || item.mode}</h4>
                                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            {item.availability || 'Available'}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{item.mode}</p>
                                        {item.rating && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                            <span className="text-[9px] font-black text-slate-800 dark:text-slate-100">{item.rating}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="text-base font-black text-primary">₹{item.estimatedDailyCost || '— '}</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">/day avg</p>
                                        <button
                                          onClick={() => window.open(appUrl, '_blank')}
                                          className="mt-2 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                                          style={{ background: iconBg, color: iconColor }}
                                        >
                                          Open App <Navigation2 className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* SMART PACKING CHECKLIST */}
                          {packingItems.length > 0 && (
                            <div className="rounded-[32px] overflow-hidden bg-card border border-border">
                              <div className="flex items-center justify-between p-5 pb-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-primary/10">
                                    <Backpack className="h-4 w-4 text-primary" />
                                  </div>
                                  <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">Smart Pack</h3>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  AI Recommended
                                </span>
                              </div>

                              <div className="px-5 pb-5 space-y-5">
                                {packingCategories.map((cat, ci) => cat.items.length > 0 && (
                                  <div key={ci}>
                                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3">{cat.label}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {cat.items.map((item: string, itemIdx: number) => {
                                        const globalIdx = ci * packingCategories[0].items.length + itemIdx;
                                        const isChecked = packingChecked.has(globalIdx);
                                        return (
                                          <button
                                            key={itemIdx}
                                            onClick={() => setPackingChecked(prev => {
                                              const next = new Set(prev);
                                              if (next.has(globalIdx)) next.delete(globalIdx);
                                              else next.add(globalIdx);
                                              return next;
                                            })}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${isChecked ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'bg-muted/30 hover:bg-muted/50 ring-1 ring-border/50'}`}
                                          >
                                            <div className={`h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-emerald-500 shadow-md' : 'bg-muted border border-border/50'}`}>
                                              {isChecked && <CheckCircle className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className={`text-[10px] font-bold truncate transition-all ${isChecked ? 'text-muted-foreground line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                                              {item}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* SAFETY TIPS */}
                          {plan.safetyTips && plan.safetyTips.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-amber-500/10">
                                  <Shield className="h-4 w-4 text-orange-400" />
                                </div>
                                <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">On-Trip Security</h3>
                              </div>
                              {plan.safetyTips.slice(0, 4).map((tip: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-orange-500/5 border-l-[3px] border-orange-500/40">
                                  <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">{tip}</p>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      );
                    }

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



