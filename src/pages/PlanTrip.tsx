import { useState, useRef, useEffect, useMemo, useCallback, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Sparkles, Send, MapPin, IndianRupee, Calendar, Users, ChevronRight,
  Hotel, Utensils, Camera, Loader2, Heart, Mountain, Palmtree, Baby,
  User, Shield, Backpack, CloudSun, AlertCircle, Save, Train, Plane, Bus, RefreshCw, Pencil, TramFront, Bike,
  Car, Navigation, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Share2, XCircle, ShoppingBag, Printer, Download, Plus, X, Clock, Navigation2, Map, CalendarPlus, PieChart, Zap, Star, ListChecks, BellRing, ArrowLeft, IndianRupee as Rupee
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
import { getPexelsImage, isFallbackOrMissing } from "@/lib/pexels";
import ItineraryDisplay from "@/components/ItineraryDisplay";
import { generateAlternativeActivity } from "@/lib/stream-ai";
import { getAllDestinations } from "@/data/destinations";
import ErrorBoundary from "@/components/ErrorBoundary";
import TripCountdown from "@/components/TripCountdown";
import { downloadTripICS, openGoogleCalendar } from "@/lib/calendar";
import TravelMode from "@/components/TravelMode";
import TripCollabPanel from "@/components/TripCollabPanel";
import PriceWatchPanel from "@/components/PriceWatchPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { TripLogistics } from "@/components/TripLogistics";
import { type TripTwinScenario } from "@/components/TripTwinSimulator";
import {
  applyWeatherAdjustmentToPlan,
  extractPlanActivities,
  getSuggestedPriceWatches,
  getWeatherAdjustment,
  toActorName,
  toVoterKey,
  type TripCollaborator,
  type TripMessage,
  type TripPriceWatch,
  type TripVote,
} from "@/lib/trip-features";

interface Message {
  text: string;
  isUser: boolean;
}

interface WeatherForecastDay {
  day?: {
    avgtemp_c?: number;
  };
}

type RingStyle = CSSProperties & Record<"--tw-ring-color", string>;
type TravelModeKind = "flight" | "train" | "bus";
type NormalizedTravelOption = TravelOption & {
  __idx: number;
  __normalizedMode: TravelModeKind;
  id?: number | string;
};

const moods = [
  { id: "relax", label: "Relax", icon: Palmtree },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "romantic", label: "Romantic", icon: Heart },
  { id: "family", label: "Family", icon: Baby },
  { id: "solo", label: "Solo", icon: User },
];

// ── AI Caption Cycler Component ──────────────────────────────────────
const buildAICaptions = (isMultiCity: boolean, isLongTrip: boolean) => [
  {
    stage: "1/6",
    title: isMultiCity ? "Analyzing route context" : "Analyzing destination context",
    sub: isMultiCity
      ? "Reviewing each stop, transfer flow, and feasible route ordering."
      : "Reviewing region highlights, travel windows, and route constraints."
  },
  {
    stage: "2/6",
    title: isMultiCity ? "Mapping city-to-city transitions" : "Building day-by-day structure",
    sub: isMultiCity
      ? "Balancing movement days with sightseeing to reduce fatigue."
      : "Sequencing each day for pacing, variety, and commute efficiency."
  },
  {
    stage: "3/6",
    title: "Personalizing to your trip profile",
    sub: "Applying your budget, trip duration, travelers, and vibe preferences."
  },
  {
    stage: "4/6",
    title: isLongTrip ? "Designing balanced long-stay flow" : "Enriching stays and experiences",
    sub: isLongTrip
      ? "Distributing high-energy and lighter days for a sustainable pace."
      : "Selecting practical stay options, meals, and high-value activities."
  },
  {
    stage: "5/6",
    title: "Validating weather and logistics",
    sub: isMultiCity
      ? "Checking forecast guidance and transport fit across all segments."
      : "Checking forecast guidance and local transport fit for each day."
  },
  {
    stage: "6/6",
    title: "Final quality pass",
    sub: "Polishing recommendations and preparing your final itinerary output."
  },
];

function AICaptionCycler({
  destination,
  stopCount,
  days
}: {
  destination: string;
  stopCount: number;
  days: number;
}) {
  const isMultiCity = stopCount > 1;
  const isLongTrip = days >= 6;
  const captions = buildAICaptions(isMultiCity, isLongTrip);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [isMultiCity, isLongTrip, destination]);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % captions.length), 2600);
    return () => clearInterval(t);
  }, [captions.length]);

  const cap = captions[index];
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
        <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">Planzo Engine</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">{cap.stage}</p>
          <p className="text-2xl font-black text-white tracking-tight">{cap.title}</p>
          <p className="max-w-xl text-sm text-white/65 font-medium leading-relaxed">
            {destination ? `${destination}: ${cap.sub}` : cap.sub}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-1.5">
        {captions.map((_, dotIndex) => (
          <span
            key={`caption-dot-${dotIndex}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              dotIndex === index ? "w-6 bg-indigo-300" : "w-1.5 bg-white/35"
            }`}
          />
        ))}
      </div>
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
  const [logisticsSortBy, setLogisticsSortBy] = useState<"recommended" | "price" | "duration" | "departure">("recommended");
  const [logisticsPanel, setLogisticsPanel] = useState<"transport" | "essentials" | "insights">("transport");
  const [pinnedLogistics, setPinnedLogistics] = useState<number[]>([]);
  const [packingChecked, setPackingChecked] = useState<Set<number>>(new Set());
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { text: "Hello! I'm your AI trip assistant. Ask me anything about your plan.", isUser: false },
  ]);
  const [collaborators, setCollaborators] = useState<TripCollaborator[]>([]);
  const [tripMessages, setTripMessages] = useState<TripMessage[]>([]);
  const [tripVotes, setTripVotes] = useState<TripVote[]>([]);
  const [priceWatches, setPriceWatches] = useState<TripPriceWatch[]>([]);
  const [weatherApplied, setWeatherApplied] = useState(false);
  const isMobile = useIsMobile();

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

  const applyTripTwinScenario = async (scenario: TripTwinScenario) => {
    if (!plan) return;

    const existingItinerary = plan.itinerary || [];
    const currentDays = existingItinerary.length || days;
    let nextItinerary = [...existingItinerary];

    if (scenario.targetDays < currentDays) {
      nextItinerary = nextItinerary.slice(0, scenario.targetDays);
    } else if (scenario.targetDays > currentDays) {
      for (let d = currentDays + 1; d <= scenario.targetDays; d++) {
        nextItinerary.push({
          day: d,
          title: `Flexible Day ${d}`,
          activities: [
            `Explore local neighborhoods at your own pace in ${plan.destination || destination || "your destination"}`,
            "Keep this slot open for weather-friendly alternatives",
          ],
          tips: "Use this day as a recovery or buffer day for smooth pacing.",
        });
      }
    }

    nextItinerary = nextItinerary.map((item, idx) => ({ ...item, day: idx + 1 }));

    const currentTotal = Number(plan.budgetHealth?.totalEstimated || scenario.projectedSpend);
    const ratio = currentTotal > 0 ? scenario.projectedSpend / currentTotal : 1;

    const nextBreakdown = plan.budgetBreakdown
      ? {
          accommodation: Math.round(Number(plan.budgetBreakdown.accommodation || 0) * ratio),
          food: Math.round(Number(plan.budgetBreakdown.food || 0) * ratio),
          activities: Math.round(Number(plan.budgetBreakdown.activities || 0) * ratio),
          transport: Math.round(Number(plan.budgetBreakdown.transport || 0) * ratio),
          miscellaneous: Math.round(Number(plan.budgetBreakdown.miscellaneous || 0) * ratio),
        }
      : plan.budgetBreakdown;

    const nextUsage = scenario.projectedBudget > 0
      ? Math.round((scenario.projectedSpend / scenario.projectedBudget) * 100)
      : plan.budgetHealth?.usagePercentage;
    const remaining = scenario.projectedBudget - scenario.projectedSpend;

    const nextVibe = scenario.recommendedMode === "flight"
      ? "Premium"
      : scenario.recommendedMode === "train"
        ? "Budget"
        : "Standard";

    const nextPlan: TripPlan = {
      ...plan,
      vibe: nextVibe,
      itinerary: nextItinerary,
      budgetHealth: {
        ...plan.budgetHealth,
        userBudget: scenario.projectedBudget,
        totalEstimated: scenario.projectedSpend,
        usagePercentage: nextUsage,
        remaining,
        withinBudget: remaining >= 0,
        status: remaining >= 0 ? "healthy" : "warning",
      },
      budgetBreakdown: nextBreakdown,
      adjustments: [
        ...(plan.adjustments || []),
        `Trip Twin applied: ${scenario.name} (${scenario.scoreLabel}).`,
      ],
    };

    setBudget(String(scenario.projectedBudget));
    setDays(scenario.targetDays);
    setTravelers(scenario.targetTravelers);
    setVibe(nextVibe);
    setPlan(nextPlan);

    await updateRemotePlan(nextPlan);
    toast({
      title: "Trip Twin applied",
      description: `${scenario.name} is now active with updated timeline and budget strategy.`,
    });
  };

  const fetchClientWeatherNote = async (dest: string) => {
    if (!dest?.trim()) return null;
    const weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY || import.meta.env.VITE_WEATHERAPI_KEY;
    const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY || import.meta.env.VITE_WEATHER_API_KEY;

    if (weatherApiKey) {
      try {
        const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(dest)}&days=3&aqi=no`);
        if (res.ok) {
          const data = await res.json();
          const condition = data?.current?.condition?.text || "Unknown";
          const temp = data?.current?.temp_c;
          const humidity = data?.current?.humidity;
          const forecastDays = (data?.forecast?.forecastday || []) as WeatherForecastDay[];
          const avg = forecastDays.length
            ? Math.round(forecastDays.reduce((sum: number, day) => sum + (day?.day?.avgtemp_c || 0), 0) / forecastDays.length)
            : null;
          return `Current: ${condition}, ${temp ?? "N/A"}°C, ${humidity ?? "N/A"}% humidity.${avg !== null ? ` Forecast avg: ${avg}°C.` : ""}`;
        }
      } catch {
        // try fallback provider below
      }
    }

    if (openWeatherKey) {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(dest)}&appid=${openWeatherKey}&units=metric`);
        if (!res.ok) return null;
        const data = await res.json();
        const condition = data?.weather?.[0]?.main || "Unknown";
        const temp = data?.main?.temp;
        const humidity = data?.main?.humidity;
        return `Current: ${condition}, ${temp ?? "N/A"}°C, ${humidity ?? "N/A"}% humidity.`;
      } catch {
        return null;
      }
    }

    // Keyless fallback provider (Open-Meteo) so users still get real weather guidance.
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dest)}&count=1`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        const lat = geo?.results?.[0]?.latitude;
        const lon = geo?.results?.[0]?.longitude;
        if (typeof lat === "number" && typeof lon === "number") {
          const wRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`
          );
          if (wRes.ok) {
            const w = await wRes.json();
            const temp = w?.current?.temperature_2m;
            const humidity = w?.current?.relative_humidity_2m;
            const maxArr = w?.daily?.temperature_2m_max || [];
            const minArr = w?.daily?.temperature_2m_min || [];
            const avg =
              maxArr.length && minArr.length
                ? Math.round(
                    maxArr.reduce((sum: number, v: number, idx: number) => sum + (v + (minArr[idx] || 0)) / 2, 0) /
                      maxArr.length
                  )
                : null;
            return `Current: ${temp ?? "N/A"}°C, ${humidity ?? "N/A"}% humidity.${avg !== null ? ` Forecast avg: ${avg}°C.` : ""}`;
          }
        }
      }
    } catch {
      // ignore and return null below
    }
    return null;
  };

  const geocodeDestination = async (dest: string) => {
    const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!mapsKey || !dest?.trim()) return null;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(dest)}&key=${mapsKey}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const loc = data?.results?.[0]?.geometry?.location;
      if (typeof loc?.lat === "number" && typeof loc?.lng === "number") {
        return { lat: loc.lat, lng: loc.lng };
      }
      return null;
    } catch {
      return null;
    }
  };

  const invokePlanTrip = async (payload: unknown) => {
    const {
      data: { session: initialSession },
    } = await supabase.auth.getSession();

    if (!initialSession?.access_token) {
      throw new Error("Please sign in to generate a trip plan.");
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      await supabase.auth.signOut();
      navigate("/auth");
      throw new Error("Your session expired. Please sign in again.");
    }

    // Always use the latest session token after getUser() in case a refresh happened.
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (!currentSession?.access_token) {
      await supabase.auth.signOut();
      navigate("/auth");
      throw new Error("Your session expired. Please sign in again.");
    }

    const callPlanTrip = async (accessToken: string) => {
      supabase.functions.setAuth(accessToken);
      const { data, error } = await supabase.functions.invoke("plan-trip", {
        body: payload,
      });

      const context = (error as { context?: Response } | null)?.context;
      let status = context?.status ?? null;
      let message = error?.message ?? null;

      if (context) {
        try {
          const body = await context.clone().json();
          message = body?.error || body?.message || message;
        } catch {
          try {
            const text = await context.clone().text();
            if (text) message = text;
          } catch {
            // Ignore parse failures and fall back to SDK message.
          }
        }
      }

      return { data, status, message };
    };

    const { data: firstRefreshData } = await supabase.auth.refreshSession();
    const firstToken = firstRefreshData.session?.access_token || currentSession.access_token;

    let result = await callPlanTrip(firstToken);

    // Retry once with a freshly refreshed token when Supabase returns 401.
    if (result.status === 401) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData.session?.access_token) {
        result = await callPlanTrip(refreshData.session.access_token);
      }
    }

    if (result.status && result.status >= 400) {
      if (result.status === 401) {
        await supabase.auth.signOut();
        navigate("/auth");
        throw new Error(result.message || "Unauthorized request. Please sign in again.");
      }
      throw new Error(result.message || `Server error: ${result.status}`);
    }

    if (result.message) {
      throw new Error(result.message);
    }

    return result.data;
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

  // Debug: Log chat state changes
  useEffect(() => {
    console.log("Chat state changed - isChatOpen:", isChatOpen, "plan exists:", !!plan);
  }, [isChatOpen, plan]);

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

  useEffect(() => {
    if (!tripId) return;
    const title = plan?.destination || destination || "Trip";
    localStorage.setItem("planzo_current_trip", JSON.stringify({ id: tripId, title }));
  }, [tripId, plan?.destination, destination]);

  useEffect(() => {
    setWeatherApplied(false);
  }, [plan?.weatherNote, tripId]);

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    const enrich = async () => {
      const dest = plan.destination || destination;
      const patch: Partial<TripPlan> = {};
      if (!plan.weatherNote || String(plan.weatherNote).toLowerCase().includes("unavailable")) {
        const weather = await fetchClientWeatherNote(dest);
        if (weather) patch.weatherNote = weather;
      }
      const hasMapCenter = typeof plan?.map?.lat === "number" && typeof plan?.map?.lng === "number";
      if (!hasMapCenter) {
        const geo = await geocodeDestination(dest);
        if (geo) {
          patch.map = {
            lat: geo.lat,
            lng: geo.lng,
            embedUrl: `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(dest)}&zoom=11`,
          };
        }
      }
      if (!cancelled && Object.keys(patch).length > 0) {
        setPlan((prev) => (prev ? { ...prev, ...patch } : prev));
      }
    };
    void enrich();
    return () => {
      cancelled = true;
    };
  }, [plan, destination]);

  useEffect(() => {
    const handler = () => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", "budget");
      setSearchParams(next, { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("planzo-open-budget", handler);
    return () => window.removeEventListener("planzo-open-budget", handler);
  }, [searchParams, setSearchParams]);
  const isOwner = !tripId || (user && tripOwnerId === user.id);
  const isGuest = !user;
  const isViewer = user && tripOwnerId && tripOwnerId !== user.id;
  const pdfRef = useRef<HTMLDivElement>(null);
  const actorName = toActorName(
    (user?.user_metadata?.display_name as string | undefined) || user?.email?.split("@")[0],
    user?.email
  );
  const actorKey = toVoterKey(user?.id, actorName, user?.email);
  const weatherAdjustment = useMemo(() => getWeatherAdjustment(String(plan?.weatherNote || "")), [plan?.weatherNote]);
  const activityRefs = useMemo(() => (plan ? extractPlanActivities(plan) : []), [plan]);
  const suggestedPriceWatches = useMemo(() => (plan ? getSuggestedPriceWatches(plan) : []), [plan]);

  const ensureOwnerCollaborator = useCallback(async (currentTripId: string) => {
    if (!user) return;
    await supabase.from("trip_collaborators").upsert({
      trip_id: currentTripId,
      user_id: user.id,
      email: user.email || null,
      display_name: actorName,
      role: "owner",
      status: "active",
      invited_by: user.id,
    }, { onConflict: "trip_id,user_id" });
  }, [actorName, user]);

  const loadSharedTripData = useCallback(async (currentTripId: string) => {
    const [
      collaboratorsRes,
      messagesRes,
      votesRes,
      watchesRes,
    ] = await Promise.all([
      supabase.from("trip_collaborators").select("*").eq("trip_id", currentTripId).order("created_at", { ascending: true }),
      supabase.from("trip_messages").select("*").eq("trip_id", currentTripId).order("created_at", { ascending: false }).limit(20),
      supabase.from("trip_votes").select("*").eq("trip_id", currentTripId).order("created_at", { ascending: false }),
      supabase.from("trip_price_watches").select("*").eq("trip_id", currentTripId).order("created_at", { ascending: false }),
    ]);

    if (!collaboratorsRes.error) setCollaborators(collaboratorsRes.data || []);
    if (!messagesRes.error) setTripMessages(messagesRes.data || []);
    if (!votesRes.error) setTripVotes(votesRes.data || []);
    if (!watchesRes.error) setPriceWatches(watchesRes.data || []);
  }, []);

  useEffect(() => {
    if (!tripId) {
      setCollaborators([]);
      setTripMessages([]);
      setTripVotes([]);
      setPriceWatches([]);
      return;
    }

    void loadSharedTripData(tripId);
    if (user?.id && tripOwnerId === user.id) {
      void ensureOwnerCollaborator(tripId);
    }

    const channel = supabase.channel(`trip-social-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_collaborators", filter: `trip_id=eq.${tripId}` }, () => {
        void loadSharedTripData(tripId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_messages", filter: `trip_id=eq.${tripId}` }, () => {
        void loadSharedTripData(tripId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_votes", filter: `trip_id=eq.${tripId}` }, () => {
        void loadSharedTripData(tripId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_price_watches", filter: `trip_id=eq.${tripId}` }, () => {
        void loadSharedTripData(tripId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ensureOwnerCollaborator, loadSharedTripData, tripId, tripOwnerId, user?.id]);

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

  const handleInviteCollaborator = async ({ displayName, email }: { displayName: string; email?: string }) => {
    if (!tripId) {
      toast({ title: "Save trip first", description: "Create the trip before inviting people." });
      return;
    }

    const payload = {
      trip_id: tripId,
      display_name: displayName,
      email: email || null,
      role: "editor",
      status: email ? "invited" : "active",
      invited_by: user?.id || null,
    };
    const { error } = email
      ? await supabase.from("trip_collaborators").upsert(payload, { onConflict: "trip_id,email" })
      : await supabase.from("trip_collaborators").insert(payload);

    if (error) {
      toast({ title: "Invite failed", description: error.message, variant: "destructive" });
      return;
    }

    await loadSharedTripData(tripId);
    toast({ title: "Collaborator added", description: `${displayName} can now join this trip.` });
  };

  const handleSendTripMessage = async (message: string) => {
    if (!tripId) return;
    const { error } = await supabase.from("trip_messages").insert({
      trip_id: tripId,
      user_id: user?.id || null,
      display_name: actorName,
      message,
    });

    if (error) {
      toast({ title: "Message failed", description: error.message, variant: "destructive" });
      return;
    }

    await loadSharedTripData(tripId);
  };

  const handleActivityVote = async (
    activity: { key: string; label: string },
    voteValue: 1 | -1
  ) => {
    if (!tripId) {
      toast({ title: "Save trip first", description: "Voting starts after the trip is saved." });
      return;
    }

    const { error } = await supabase.from("trip_votes").upsert({
      trip_id: tripId,
      subject_type: "activity",
      subject_key: activity.key,
      subject_label: activity.label,
      voter_key: actorKey,
      voter_name: actorName,
      user_id: user?.id || null,
      vote_value: voteValue,
    }, { onConflict: "trip_id,subject_type,subject_key,voter_key" });

    if (error) {
      toast({ title: "Vote failed", description: error.message, variant: "destructive" });
      return;
    }

    await loadSharedTripData(tripId);
  };

  const handleCreatePriceWatch = async (watch: {
    label: string;
    category: string;
    baseline_price: number;
    current_price: number;
    target_price: number;
    notes?: string | null;
  }) => {
    if (!tripId) {
      toast({ title: "Save trip first", description: "Price alerts need a saved trip." });
      return;
    }

    const status = watch.current_price <= watch.target_price ? "alert" : "watching";
    const { error } = await supabase.from("trip_price_watches").insert({
      trip_id: tripId,
      label: watch.label,
      category: watch.category,
      baseline_price: watch.baseline_price,
      current_price: watch.current_price,
      target_price: watch.target_price,
      status,
      notes: watch.notes || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: "Watch creation failed", description: error.message, variant: "destructive" });
      return;
    }

    await loadSharedTripData(tripId);
    toast({ title: "Price watch added", description: `${watch.label} is now being tracked.` });
  };

  const handleUpdatePriceWatch = async (watchId: string, nextPrice: number) => {
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) return;
    const existing = priceWatches.find((watch) => watch.id === watchId);
    if (!existing) return;
    const status = nextPrice <= Number(existing.target_price) ? "alert" : existing.status === "booked" ? "booked" : "watching";

    const { error } = await supabase.from("trip_price_watches").update({
      current_price: nextPrice,
      status,
      updated_at: new Date().toISOString(),
    }).eq("id", watchId);

    if (error) {
      toast({ title: "Price update failed", description: error.message, variant: "destructive" });
      return;
    }

    await loadSharedTripData(tripId!);
    toast({
      title: status === "alert" ? "Target reached" : "Price updated",
      description: status === "alert" ? "This watch is now below the target price." : "Latest market price saved.",
    });
  };

  const handleApplyWeatherAdjustment = async () => {
    if (!plan || !weatherAdjustment) return;
    const adjustedPlan = applyWeatherAdjustmentToPlan(plan);
    setPlan(adjustedPlan);
    setWeatherApplied(true);
    if (tripId) {
      await updateRemotePlan(adjustedPlan);
    }
    toast({ title: "Weather-smart update applied", description: weatherAdjustment.title });
  };

  const handleSaveTrip = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save trips.", variant: "destructive" });
      return;
    }
    if (!plan) return;
    setSaving(true);
    const payload = {
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
    };

    const nextTripId = tripId || crypto.randomUUID();
    const { error } = tripId
      ? await supabase.from("saved_trips").update(payload).eq("id", tripId)
      : await supabase.from("saved_trips").insert({ id: nextTripId, ...payload });

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setTripId(nextTripId);
      setTripOwnerId(user.id);
      setSearchParams({ id: nextTripId }, { replace: true });
      await ensureOwnerCollaborator(nextTripId);
      await loadSharedTripData(nextTripId);
      toast({
        title: tripId ? "Trip updated" : "Trip saved!",
        description: tripId
          ? "Your latest itinerary, collaboration, and watch settings are saved."
          : "You can now safely share this URL with friends for multiplayer collaboration!",
      });
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
      const responseData: TripPlan = await invokePlanTrip({
        query: destination,
        budget,
        days: days.toString(),
        travelers: travelers.toString(),
        mood: activeMood,
        vibe,
        userTravelStyle: user?.user_metadata?.travel_style || [],
      });

      if (isFallbackOrMissing(responseData.destinationImage)) {
        responseData.destinationImage = await getPexelsImage(responseData.destination || destination, {
          context: "destination",
          destination: responseData.destination || destination,
        });
      }

      // Enrich images dynamically on the frontend to avoid duplicates
      if (responseData.itinerary) {
        responseData.itinerary = await Promise.all(
          responseData.itinerary.map(async (day) => {
            let heroImage = day.heroImage;
            let enrichedActivities = day.activities;

            if (day.activities) {
              enrichedActivities = await Promise.all(
                day.activities.map(async (act) => {
                  if (typeof act !== 'string') {
                    const query = act.imageSearchQuery || act.place || act.name || "travel destination";
                    const image = await getPexelsImage(query, {
                      context: "activity",
                      destination: responseData.destination || destination,
                      dayTitle: day.title,
                    });
                    if (!heroImage) heroImage = image; // Use first activity image as day banner fallback
                    return { ...act, image };
                  }
                  return act;
                })
              );
            }
            if (!heroImage || isFallbackOrMissing(heroImage)) {
              heroImage = await getPexelsImage(`${day.title} ${destination}`, {
                context: "day",
                destination: responseData.destination || destination,
                dayTitle: day.title,
              });
            }
            return { ...day, heroImage, activities: enrichedActivities };
          })
        );
      }

      if (!responseData.weatherNote || String(responseData.weatherNote).toLowerCase().includes("unavailable")) {
        const weatherNote = await fetchClientWeatherNote(responseData.destination || destination);
        if (weatherNote) {
          responseData.weatherNote = weatherNote;
        }
      }

      const hasMapCenter = typeof responseData?.map?.lat === "number" && typeof responseData?.map?.lng === "number";
      if (!hasMapCenter) {
        const geo = await geocodeDestination(responseData.destination || destination);
        if (geo) {
          responseData.map = {
            lat: geo.lat,
            lng: geo.lng,
            embedUrl: `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(responseData.destination || destination)}&zoom=11`,
          };
          if (responseData.itinerary) {
            responseData.itinerary = responseData.itinerary.map((day) => ({
              ...day,
              activities: day.activities?.map((act) =>
                typeof act === "string"
                  ? act
                  : {
                      ...act,
                      lat: typeof act.lat === "number" ? act.lat : geo.lat,
                      lng: typeof act.lng === "number" ? act.lng : geo.lng,
                    }
              ),
            }));
          }
        }
      }

      setPlan(responseData);
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
      const responseDay: TripDay = await invokePlanTrip({
        existingPlan: plan,
        dayToRegenerate: dayIndex,
        query: destination,
        budget,
        days: days.toString(),
        travelers: travelers.toString(),
        mood: activeMood,
        vibe,
      });

      let heroImage = responseDay.heroImage;
      if (responseDay.activities) {
        responseDay.activities = await Promise.all(
          responseDay.activities.map(async (act) => {
            if (typeof act !== 'string') {
              const query = act.imageSearchQuery || act.place || act.name || "travel destination";
              const image = await getPexelsImage(query, {
                context: "activity",
                destination: plan?.destination || destination,
                dayTitle: responseDay.title,
              });
              if (!heroImage) heroImage = image;
              return { ...act, image };
            }
            return act;
          })
        );
      }
      if (!heroImage || isFallbackOrMissing(heroImage)) {
        heroImage = await getPexelsImage(`${responseDay.title} ${destination}`, {
          context: "day",
          destination: plan?.destination || destination,
          dayTitle: responseDay.title,
        });
      }
      responseDay.heroImage = heroImage;

      setPlan((currentPlan) => {
        if (!currentPlan?.itinerary) return currentPlan;
        const newItinerary = [...currentPlan.itinerary];
        // The AI returns a day object, we replace the old one at the correct index.
        responseDay.day = dayIndex + 1; // Ensure day number is correct based on position
        newItinerary[dayIndex] = responseDay;

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

      const image = await getPexelsImage(alt.imageSearchQuery || alt.place || alt.name, {
        context: "activity",
        destination: plan.destination || destination,
      });

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
      <div className="relative w-full overflow-hidden" style={{ minHeight: "540px" }}>
        {/* Gradient backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #0f0c29 0%, #1a1a4e 30%, #24243e 60%, #0d1b4b 100%)",
          }}
        />
        
        {/* Decorative mask for bottom transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent opacity-95" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/45 via-black/15 to-transparent pointer-events-none" />

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
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-6 pt-20 pb-20 text-center md:pb-24">
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
            className="mt-7 max-w-2xl text-sm md:text-lg opacity-85 leading-relaxed mx-auto"
            style={{ color: "rgba(196,213,255,0.85)" }}
          >
            Craft a stunning, fully personalized itinerary — complete with budgets, logistics &amp; day-by-day activities in seconds.
          </motion.p>
      {/* ── SEARCH CARD ── */}
      {!plan && (
      <>
      <div className="relative z-30 mt-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring", damping: 20 }}
          className="rounded-[30px] overflow-hidden shadow-[0_32px_68px_-26px_rgba(0,0,0,0.24)] border-t border-white/40"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(32px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, 0.5), 0 32px 64px -16px ${activeConfig.glow}`,
          }}
        >
          {/* Card header – Mood chips */}
          <div className="px-6 pt-7 pb-5 md:px-8 md:pt-8 md:pb-6 border-b" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-5" style={{ color: activeConfig.color }}>
              Personalize Your Journey
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1.5">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMood(m.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 whitespace-nowrap ${
                    activeMood === m.id
                      ? `${activeConfig.bg} text-white shadow-md`
                      : "bg-slate-100/60 text-slate-500 hover:bg-slate-200/60 hover:text-slate-700"
                  }`}
                  style={activeMood === m.id ? { boxShadow: `0 10px 18px -8px ${activeConfig.glow}` } : undefined}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card body */}
          <div className="p-6 pt-6 md:p-8 md:pt-7">
            {/* AI Input */}
            <div className="flex items-start gap-4 md:gap-5">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20 ring-1 ring-white/20"
              >
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
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
                            placeholder={index === 0 ? 'Where to? (e.g. goa, hyderabad)' : 'Next destination...'}
                            className="w-full bg-slate-100/40 rounded-2xl px-5 py-3.5 text-sm md:text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 transition-all font-bold border border-slate-200/60 group-hover:bg-slate-100/80 group-focus-within:border-transparent group-focus-within:bg-white overflow-hidden shadow-inner"
                            style={{ 
                              '--tw-ring-color': activeConfig.glow,
                            } as RingStyle}
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
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Budget (₹)", icon: IndianRupee, value: budget, onChange: setBudget, type: "number", min: 500 },
                { label: "Days", icon: Calendar, value: days, onChange: (v: string) => setDays(Math.min(30, Math.max(1, parseInt(v) || 1))), type: "number", min: 1, max: 30 },
                { label: "Travelers", icon: Users, value: travelers, onChange: (v: string) => setTravelers(Math.min(20, Math.max(1, parseInt(v) || 1))), type: "number", min: 1, max: 20 },
              ].map((opt) => (
                <div key={opt.label} className="rounded-2xl border border-slate-200/60 bg-white/50 p-3">
                  <label className="mb-2 text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <opt.icon className="h-3 w-3" style={{ color: activeConfig.color }} /> {opt.label}
                  </label>
                  <input
                    type={opt.type}
                    value={opt.value}
                    min={opt.min}
                    max={opt.max}
                    onChange={(e) => opt.onChange(e.target.value)}
                    className="h-[52px] w-full rounded-xl border border-slate-200/70 bg-slate-100/60 px-4 text-sm text-slate-900 outline-none transition-all font-bold focus:bg-white focus:ring-4"
                    style={{ '--tw-ring-color': activeConfig.glow } as RingStyle}
                  />
                </div>
              ))}
              
              <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-3">
                <label className="mb-2 text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <CalendarPlus className="h-3 w-3" style={{ color: activeConfig.color }} /> Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-[52px] w-full px-4 py-3 rounded-2xl bg-slate-100/40 text-sm text-slate-900 outline-none focus:ring-4 border border-slate-200/60 transition-all font-bold focus:bg-white"
                  style={{ '--tw-ring-color': activeConfig.glow } as RingStyle}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01, boxShadow: `0 20px 40px -12px ${activeConfig.glow}` }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlan}
              disabled={isPlanning || !destination.trim()}
              className={`w-full mt-8 py-4 rounded-2xl ${activeConfig.bg} text-white font-black text-[11px] uppercase tracking-[0.24em] flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden`}
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
      </div>

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
                <AICaptionCycler
                  destination={destination}
                  stopCount={destinations.filter((d) => d.trim()).length}
                  days={days}
                />

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
      </>
      )}
      </div>
      </div>

      {/* Generated Plan */}
      <AnimatePresence>
        {plan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            {/* Mobile-only Back Button */}
            <div className="mb-6 md:hidden px-4">
              <button 
                onClick={() => setPlan(null)}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="h-9 w-9 rounded-full border border-border bg-white flex items-center justify-center shadow-sm group-hover:bg-muted transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <span>Back to Planner</span>
              </button>
            </div>
            {/* Header / Summary Card */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {plan.destinationImage && (
                <div className="relative h-72 md:h-80 overflow-hidden">
                  <img src={plan.destinationImage} alt={plan.destination} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                    <div className="flex flex-col gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {plan.weatherNote && (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                              <CloudSun className="h-3.5 w-3.5" />
                              {(plan.weatherNote as string).split('.')[0]}
                            </div>
                          )}
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-md">{plan.destination}</h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white">{activeMood}</span>
                          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white">{days} days</span>
                          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white">{travelers} travelers</span>
                          {plan.vibe && (
                            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white">{String(plan.vibe)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setPlan(null)}
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                        >
                          <RefreshCw className="h-4 w-4" />
                          New search
                        </button>
                        <button onClick={handleShareTrip} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={isOwner ? handleSaveTrip : isGuest ? () => navigate("/auth") : handleSaveTrip}
                          disabled={saving}
                          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {saving ? "Processing..." : isOwner ? (tripId ? "Update plan" : "Save trip") : isGuest ? "Sign up to save" : "Duplicate trip"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!plan.destinationImage && (
                <div className="border-b border-border p-6 md:p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <h2 className="font-display text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">{plan.destination}</h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">{activeMood}</span>
                        <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">{days} days</span>
                        <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">{travelers} travelers</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlan(null)}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-muted dark:text-slate-100"
                      >
                        <RefreshCw className="h-4 w-4" />
                        New search
                      </button>
                      <button onClick={handleShareTrip} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-slate-800 transition-colors hover:bg-muted dark:text-slate-100">
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button onClick={handleSaveTrip} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-60">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save trip
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 md:p-7">
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">{plan.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {startDate && <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-foreground"><Calendar className="h-3.5 w-3.5 flex-shrink-0" /> Starts {new Date(startDate).toLocaleDateString()}</div>}
                  <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-foreground"><Users className="h-3.5 w-3.5 flex-shrink-0" /> {travelers} travelers</div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-foreground"><IndianRupee className="h-3.5 w-3.5 flex-shrink-0" /> Budget ₹{parseInt(budget).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="space-y-6">
              <div
                className="relative w-full overflow-x-auto border-b border-border bg-white py-2 shadow-sm md:static md:w-fit md:mx-auto md:max-w-none md:translate-x-0 md:overflow-visible md:bg-muted/40 md:p-1 md:shadow-none md:border-none"
                style={{
                  backdropFilter: "none",
                }}
              >
                <div className="flex min-w-max items-center justify-start gap-1">
                {(['itinerary', 'map', 'budget', 'logistics', 'group', 'watch'] as const).map((tab) => {
                  const isActive = (searchParams.get('tab') || 'itinerary') === tab;
                  const getTabIcon = () => {
                    switch(tab) {
                      case 'itinerary': return <ListChecks className="h-5 w-5 md:hidden" />;
                      case 'map': return <Map className="h-5 w-5 md:hidden" />;
                      case 'budget': return <IndianRupee className="h-5 w-5 md:hidden" />;
                      case 'logistics': return <Navigation className="h-5 w-5 md:hidden" />;
                      case 'group': return <Users className="h-5 w-5 md:hidden" />;
                      case 'watch': return <BellRing className="h-5 w-5 md:hidden" />;
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
                      className={`min-w-[72px] flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all md:min-w-0 md:block md:flex-none md:px-6 md:text-xs ${
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
              </div>

              {/* Tab Content Rendering */}
              {(() => {
                const activeTab = searchParams.get('tab') || 'itinerary';

                switch (activeTab) {
                  case 'itinerary':
                    return (
                      <div className="space-y-6">
                        {weatherAdjustment && (
                          <div className={`rounded-2xl border p-5 shadow-sm ${
                            weatherAdjustment.severity === "high"
                              ? "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/20"
                              : weatherAdjustment.severity === "medium"
                                ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                                : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                          }`}>
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Phase 3</p>
                                <h3 className="mt-1 text-xl font-black text-foreground">{weatherAdjustment.title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{weatherAdjustment.summary}</p>
                                <div className="mt-3 space-y-1.5">
                                  {weatherAdjustment.actions.map((action) => (
                                    <p key={action} className="text-sm text-foreground/85">• {action}</p>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={handleApplyWeatherAdjustment}
                                disabled={weatherApplied}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60"
                              >
                                <CloudSun className="h-4 w-4" />
                                {weatherApplied ? "Applied" : "Apply smart replanning"}
                              </button>
                            </div>
                          </div>
                        )}
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
                  case 'group':
                    return (
                      <TripCollabPanel
                        shareUrl={window.location.href}
                        canManage={Boolean(isOwner && tripId)}
                        collaborators={collaborators}
                        messages={tripMessages}
                        votes={tripVotes.filter((vote) => vote.subject_type === "activity")}
                        activities={activityRefs}
                        onInvite={handleInviteCollaborator}
                        onSendMessage={handleSendTripMessage}
                        onVote={handleActivityVote}
                      />
                    );
                  case 'watch':
                    return (
                      <PriceWatchPanel
                        watches={priceWatches}
                        suggestions={suggestedPriceWatches}
                        onCreateWatch={handleCreatePriceWatch}
                        onUpdateWatch={handleUpdatePriceWatch}
                      />
                    );

                  case 'map':
                    {
                      const fallbackEmbed =
                        plan.map?.embedUrl ||
                        `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(plan.destination || destination)}&zoom=11`;
                      const hasMapCoords = typeof plan?.map?.lat === "number" && typeof plan?.map?.lng === "number";
                      const osmEmbed = hasMapCoords
                        ? `https://www.openstreetmap.org/export/embed.html?bbox=${(plan.map!.lng as number) - 0.06}%2C${(plan.map!.lat as number) - 0.04}%2C${(plan.map!.lng as number) + 0.06}%2C${(plan.map!.lat as number) + 0.04}&layer=mapnik&marker=${plan.map!.lat}%2C${plan.map!.lng}`
                        : `https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C15.2%2C74.5%2C16.4&layer=mapnik&marker=15.5%2C73.8`;
                    return (
                      <div className="bg-card rounded-3xl border border-border/50 shadow-elevated overflow-hidden h-[600px] relative">
                        <iframe
                          title={`Map preview for ${plan.destination || destination}`}
                          src={hasMapCoords ? osmEmbed : fallbackEmbed}
                          className="h-full w-full"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                        <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                          <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border inline-block pointer-events-auto">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              Map preview mode
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Stable route preview for itinerary stops.
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.destination || destination)}`, "_blank")}
                                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-semibold text-foreground hover:bg-muted transition-colors"
                              >
                                Open in Google Maps
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    }

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
                    if (!plan) return null;
                    return (
                      <TripLogistics
                        plan={plan}
                        destination={destination}
                        pinnedLogistics={pinnedLogistics}
                        setPinnedLogistics={setPinnedLogistics}
                        packingChecked={packingChecked}
                        setPackingChecked={setPackingChecked}
                        logisticsTab={logisticsTab}
                        setLogisticsTab={setLogisticsTab}
                        logisticsPanel={logisticsPanel}
                        setLogisticsPanel={setLogisticsPanel}
                        logisticsSortBy={logisticsSortBy}
                        setLogisticsSortBy={setLogisticsSortBy}
                        budget={budget}
                        days={days}
                        travelers={travelers}
                        vibe={vibe}
                        applyTripTwinScenario={applyTripTwinScenario}
                        activeConfig={activeConfig}
                      />
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
