import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles, Send, MapPin, IndianRupee, Calendar, Users, ChevronRight,
  Hotel, Utensils, Camera, Loader2, Heart, Mountain, Palmtree, Baby,
  User, Shield, Backpack, CloudSun, AlertCircle, Save, Train, Plane, Bus,
  Car, Navigation, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Share2, XCircle, ShoppingBag, Printer
} from "lucide-react";
import { streamTripPlan, parseItineraryJSON } from "@/lib/stream-ai";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const moods = [
  { id: "relax", label: "Relax", icon: Palmtree },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "romantic", label: "Romantic", icon: Heart },
  { id: "family", label: "Family", icon: Baby },
  { id: "solo", label: "Solo", icon: User },
];

const PlanTrip = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [isPlanning, setIsPlanning] = useState(false);
  const [activeMood, setActiveMood] = useState("adventure");
  const [plan, setPlan] = useState<any>(null);
  const [rawStream, setRawStream] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Budget state
  const [budget, setBudget] = useState("15000");
  const [days, setDays] = useState("3");
  const [travelers, setTravelers] = useState("2");

  const { toast } = useToast();
  const { user } = useAuth();

  const handleSaveTrip = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save trips.", variant: "destructive" });
      return;
    }
    if (!plan) return;
    setSaving(true);
    const { error } = await supabase.from("saved_trips").insert({
      user_id: user.id,
      title: plan.destination || query,
      query,
      mood: activeMood,
      budget,
      days: parseInt(days) || 3,
      travelers: parseInt(travelers) || 2,
      plan_data: plan,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip saved!", description: "View it in your profile." });
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

  const regeneratePlan = async (q: string, b: string, d: string, t: string, m: string) => {
    setIsPlanning(true);
    setError("");
    setPlan(null);
    setRawStream("");

    let fullText = "";

    await streamTripPlan({
      params: { query: q, budget: b, days: d, travelers: t, mood: m },
      onDelta: (chunk) => {
        fullText += chunk;
        setRawStream(fullText);
      },
      onDone: () => {
        let parsed = null;
        try {
          // Try parsing as standard JSON first (backend now returns clean JSON)
          parsed = JSON.parse(fullText);
        } catch (e) {
          console.warn("Standard JSON parse failed, attempting fallback...", e);
          // Fallback to the stream parser if direct parsing fails
          parsed = parseItineraryJSON(fullText);
        }

        if (parsed && !parsed.error) {
          setPlan(parsed);
        } else {
          console.error("Failed to parse AI response. Raw text received:", fullText);
          setError(parsed?.error || "Could not parse the AI response. Please try again.");
        }
        setIsPlanning(false);
      },
      onError: (err) => {
        setError(err);
        setIsPlanning(false);
        toast({ title: "AI Error", description: err, variant: "destructive" });
      },
    });
  };

  const handlePlan = async () => {
    if (!query.trim()) return;
    await regeneratePlan(query, budget, days, travelers, activeMood);
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
        <h1 className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Plan Your Trip</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered itinerary with strict budget control</p>
      </motion.div>

      {/* Mood Chips */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-4">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Trip Mood</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {moods.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMood(m.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeMood === m.id
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
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Describe your dream trip</p>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "Plan a 3-day Goa trip under ₹15,000 for couples"'
              rows={3}
              className="w-full bg-muted/50 rounded-xl px-3 py-2.5 text-sm outline-none resize-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-shadow"
            />
          </div>
        </div>

        {/* Quick Options */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <IndianRupee className="h-3 w-3" /> Budget 
            </label>
            <input 
              type="number" 
              value={budget} 
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
              type="text" 
              value={days} 
              onChange={(e) => setDays(e.target.value)} 
              className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
              placeholder="3" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3" /> Travelers
            </label>
            <input 
              type="text" 
              value={travelers} 
              onChange={(e) => setTravelers(e.target.value)} 
              className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
              placeholder="2" 
            />
          </div>
        </div>

        <button onClick={handlePlan} disabled={isPlanning || !query.trim()} className="w-full mt-4 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
          {isPlanning ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating with AI...</>
          ) : (
            <><Send className="h-4 w-4" />Generate Itinerary</>
          )}
        </button>
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
      {isPlanning && rawStream && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">AI is crafting your itinerary with images...</p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 8, ease: "linear" }} className="h-full rounded-full gradient-hero" />
          </div>
        </motion.div>
      )}

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
                  <iframe
                    title="Trip Location"
                    src={plan.map.embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
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
                <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${
                  budgetStatus.includes("🟢") || budgetStatus.includes("Within") ? "bg-emerald-500/10" :
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
                      className={`h-full rounded-full ${
                        budgetUsagePercent <= 70 ? "bg-emerald-500" :
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
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground font-medium">{item.label}</span>
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
                  {plan.travelOptions.map((opt: any, i: number) => {
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
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground">{opt.mode}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isBudget ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                              {isBudget ? "Budget" : "Comfort"}
                            </span>
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
                <div className="space-y-3">
                  {plan.localTransport.map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-foreground">{item.mode}</span>
                        {item.estimatedDailyCost > 0 && <span className="text-xs font-bold text-primary">~₹{item.estimatedDailyCost.toLocaleString()}/day</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day-wise Itinerary with Images from AI */}
            {plan.itinerary && (
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-foreground text-sm">Your Itinerary</h3>
                {plan.itinerary.map((day: any, i: number) => (
                  <motion.div key={day.day} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="p-4 rounded-2xl bg-card shadow-card overflow-hidden">
                    {/* Day Hero Image from AI */}
                    {day.heroImage && (
                      <div className="relative -mx-4 -mt-4 mb-3 h-32 overflow-hidden">
                        <img 
                          src={day.heroImage} 
                          alt={day.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-4">
                          <div className="h-6 w-6 rounded-lg gradient-warm flex items-center justify-center">
                            <span className="text-xs font-bold text-accent-foreground">{day.day}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {!day.heroImage && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-lg gradient-warm flex items-center justify-center">
                          <span className="text-xs font-bold text-accent-foreground">{day.day}</span>
                        </div>
                        <h4 className="font-display font-semibold text-foreground text-sm">{day.title}</h4>
                      </div>
                    )}
                    
                    {/* Activities with Images from AI */}
                    {day.activities && Array.isArray(day.activities) && day.activities.map((activity: any, j: number) => (
                      <div key={j} className="mb-3">
                        {activity.image ? (
                          <div className="flex gap-3">
                            <img 
                              src={activity.image} 
                              alt={activity.name || activity.place}
                              className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
                                <span className="font-medium text-foreground">{activity.name || activity}</span>
                              </div>
                              {activity.place && <p className="text-[10px] text-muted-foreground ml-5">{activity.place}</p>}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
                            <span>{typeof activity === 'string' ? activity : activity.name || activity}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Meals */}
                    {day.meals && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Suggested Meals</h5>
                        <div className="grid gap-2">
                          {Object.entries(day.meals).map(([meal, suggestion]) => (
                            <div key={meal} className="flex items-start gap-2 text-xs">
                              <span className="font-semibold text-coral capitalize min-w-[60px]">{meal}</span>
                              <span className="text-muted-foreground">{suggestion as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Daily Tip */}
                    {day.tips && (
                      <div className="mt-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-xs text-primary/90 italic flex gap-2">
                          <span className="font-bold not-italic">💡 Daily Tip:</span>
                          {day.tips}
                        </p>
                      </div>
                    )}
                    
                  </motion.div>
                ))}
              </div>
            )}

            {/* Packing List */}
            {plan.packingList && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <Backpack className="h-4 w-4 text-primary" /> Packing Checklist
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {plan.packingList.map((item: string, i: number) => (
                    <label key={i} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input type="checkbox" className="rounded border-border text-primary focus:ring-primary/20" />
                      {item}
                    </label>
                  ))}
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
    </div>
  );
};

export default PlanTrip;
