import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Settings, Heart, Map, MapPin, Trash2, Receipt, BookOpen, Search, Mail, 
  Sparkles, Shield, CheckCircle, Clock, ChevronRight, AlertCircle, Globe, 
  Calendar, CalendarPlus, Trophy, TrendingUp, Award, Compass, ArrowRight, 
  Share2, Eye, Lock, Zap, X, Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllDestinations } from "@/data/destinations";
import type { Tables } from "@/integrations/supabase/types";
import TripCountdown from "@/components/TripCountdown";
import { formatPrice, parsePriceToINR } from "@/lib/currency";

type ProfileRow = Tables<"profiles">;
type SavedTripRow = Tables<"saved_trips">;
type ProfileTab = "trips" | "stats" | "achievements" | "wishlist";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop"
];

const TRAVEL_RECOMMENDATIONS = [
  {
    id: "udaipur",
    name: "Udaipur, Rajasthan",
    why: "Matches your preference for rich culture and romantic vibe.",
    budget: 14000,
    season: "October to March",
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=600"
  },
  {
    id: "goa",
    name: "Goa Coastline",
    why: "Perfect relaxing retreat for sun, beaches, and leisure.",
    budget: 9500,
    season: "November to February",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600"
  },
  {
    id: "ladakh",
    name: "Leh Ladakh, Himalayas",
    why: "Voted top adventure spot. Perfect for high altitude treks.",
    budget: 25000,
    season: "June to September",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600"
  }
];

const ConfettiEffect = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {Array.from({ length: 18 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const duration = 1.2 + Math.random() * 0.8;
        const color = ["bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400", "bg-pink-400", "bg-purple-400"][Math.floor(Math.random() * 6)];
        return (
          <span
            key={i}
            className={`absolute bottom-0 h-2 w-2 rounded-full ${color} animate-confetti`}
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
};

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTripRow[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("trips");
  
  // Filters & Search
  const [tripSearch, setTripSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "adventure" | "luxury" | "beach" | "nature" | "recent">("all");
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStyles, setEditStyles] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Hovered Achievement ID for Confetti trigger
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setProfile(data);
          setEditName(data.display_name || "");
          setEditStyles(data.travel_style || []);
          setSelectedAvatar(data.avatar_url || "");
        }
      });
      supabase.from("saved_trips").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setSavedTrips(data);
      });
    }

    const localWishlist = JSON.parse(localStorage.getItem("planzo_wishlist") || "[]");
    setWishlist(localWishlist);
  }, [user]);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/auth` }
      });
      if (error) throw error;
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the confirmation link.",
      });
    } catch (err) {
      toast({
        title: "Error Resending Email",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive"
      });
    } finally {
      setResending(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    const { error } = await supabase.from("profiles").update({
      display_name: editName,
      travel_style: editStyles,
      avatar_url: selectedAvatar
    }).eq("user_id", user.id);

    if (error) {
      setSavingProfile(false);
      return toast({ title: "Error saving profile", variant: "destructive" });
    }

    await supabase.auth.updateUser({
      data: { display_name: editName, avatar_url: selectedAvatar }
    });

    setSavingProfile(false);
    toast({ title: "Profile updated successfully!" });
    setProfile(prev => prev ? { 
      ...prev, 
      display_name: editName, 
      travel_style: editStyles, 
      avatar_url: selectedAvatar 
    } : null);
    setIsEditing(false);
    setShowAvatarSelector(false);
  };

  const deleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("saved_trips").delete().eq("id", id);
    if (error) {
      return toast({ title: "Could not delete trip", variant: "destructive" });
    }
    setSavedTrips((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Trip permanently deleted" });
  };

  const removeWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = wishlist.filter(w => w !== id);
    setWishlist(updated);
    localStorage.setItem("planzo_wishlist", JSON.stringify(updated));
    toast({ title: "Removed from wishlist" });
  };

  const toggleStyle = (style: string) => {
    setEditStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-[32px] border border-border bg-card p-8 text-center shadow-xl">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Compass className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Sign in to view your profile</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your traveler profile, personalized dashboard, and saved journeys are securely synced across devices once you authenticate.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-6 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 active:scale-98 transition-all shadow-lg shadow-primary/20"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Traveler Stats Calculations
  const displayName = profile?.display_name || user.user_metadata?.display_name || "Traveler";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url as string | undefined;
  const tripsCount = savedTrips.length;
  const daysCount = savedTrips.reduce((sum, t) => sum + (t.days || 0), 0);
  const totalBudget = savedTrips.reduce((sum, t) => sum + parsePriceToINR(t.budget || 0), 0);
  const avgDuration = tripsCount > 0 ? (daysCount / tripsCount).toFixed(1) : "0";
  const avgBudget = tripsCount > 0 ? Math.round(totalBudget / tripsCount) : 0;
  
  // Trends
  const tripsTrend = tripsCount > 0 ? `+${Math.min(tripsCount, 2)} this month` : "+0 this month";
  const daysTrend = daysCount > 0 ? `+${Math.min(daysCount, 6)} this month` : "+0 this month";
  const budgetTrend = totalBudget > 0 ? "Average per journey" : "No budget logged";
  const wishlistTrend = wishlist.length > 0 ? "Pinned destinations" : "Empty wishlist";

  // Join Date Formatting
  const joinDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  // Level & Explorer Score Calculations
  const travelLevel = Math.max(1, Math.min(10, Math.floor(tripsCount * 1.5 + daysCount * 0.2)));
  const explorerScore = Math.min(100, tripsCount * 12 + daysCount * 2.5 + wishlist.length * 3);

  // Vibe Breakdown Count
  const moodCounts: Record<string, number> = {};
  savedTrips.forEach(t => {
    const mood = t.mood || "Standard";
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });
  const favoriteStyle = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Adventure";

  // Achievements evaluation
  const achievements = [
    {
      id: "first_journey",
      title: "First Journey",
      desc: "Planned and completed your first journey.",
      icon: "🏆",
      unlocked: tripsCount >= 1
    },
    {
      id: "beach_explorer",
      title: "Beach Explorer",
      desc: "Visited Goa, Kerala, or set a relaxing getaway vibe.",
      icon: "🌴",
      unlocked: savedTrips.some(t => 
        t.title.toLowerCase().includes("goa") || 
        t.title.toLowerCase().includes("kerala") || 
        t.mood === "relax"
      )
    },
    {
      id: "adventure_seeker",
      title: "Adventure Seeker",
      desc: "Conquered heights in Manali or Ladakh.",
      icon: "🧭",
      unlocked: savedTrips.some(t => 
        t.title.toLowerCase().includes("manali") || 
        t.title.toLowerCase().includes("ladakh") || 
        t.mood === "adventure"
      )
    },
    {
      id: "frequent_traveler",
      title: "Frequent Traveler",
      desc: "Saved 5 or more travel itineraries.",
      icon: "✈️",
      unlocked: tripsCount >= 5
    },
    {
      id: "world_explorer",
      title: "World Explorer",
      desc: "Saved 10 or more travel itineraries.",
      icon: "🌎",
      unlocked: tripsCount >= 10
    },
    {
      id: "luxury_nomad",
      title: "Luxury Nomad",
      desc: "Planned a high-value journey above ₹75,000.",
      icon: "💎",
      unlocked: savedTrips.some(t => parsePriceToINR(t.budget || 0) >= 75000)
    }
  ];

  // Travel Map Component
  const TravelMap = () => {
    const markers = [
      { name: "Ladakh", x: 48, y: 15, key: "ladakh" },
      { name: "Manali", x: 46, y: 22, key: "manali" },
      { name: "Jaipur", x: 38, y: 44, key: "jaipur" },
      { name: "Udaipur", x: 32, y: 52, key: "udaipur" },
      { name: "Agra (Taj)", x: 49, y: 42, key: "tajmahal" },
      { name: "Varanasi", x: 66, y: 48, key: "varanasi" },
      { name: "Goa", x: 30, y: 76, key: "goa" },
      { name: "Kerala", x: 37, y: 90, key: "kerala" },
    ];

    const activeMarkers = markers.filter(m => 
      savedTrips.some(t => t.title.toLowerCase().includes(m.key) || m.key.includes(t.title.toLowerCase()))
    );

    return (
      <div className="relative rounded-[32px] border border-border bg-card p-6 shadow-sm flex flex-col justify-between h-[400px] overflow-hidden">
        <div>
          <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-primary" /> Visited Places Map
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">Geographical Travel Coordinates</p>
        </div>

        <div className="relative w-full h-[270px] mt-4 flex items-center justify-center bg-muted/20 dark:bg-muted/5 rounded-2xl border border-border/40 overflow-hidden">
          <svg viewBox="0 0 100 100" className="absolute h-full w-auto text-slate-350 dark:text-zinc-850" fill="none" stroke="currentColor" strokeWidth="0.5">
            <defs>
              <pattern id="grid-map" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" className="fill-slate-300 dark:fill-zinc-700" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-map)" />
            
            {/* India Boundary Outline */}
            <path d="M 46 10 L 52 14 L 54 20 L 51 28 L 56 31 L 62 30 L 67 33 L 73 34 L 75 42 L 85 45 L 88 50 L 76 52 L 72 58 L 68 62 L 62 60 L 52 64 L 46 72 L 40 82 L 37 92 L 35 94 L 33 90 L 32 80 L 29 74 L 28 66 L 25 61 L 22 55 L 18 51 L 24 49 L 28 42 L 32 38 L 35 34 L 38 28 L 41 20 L 43 14 Z" strokeWidth="0.8" strokeDasharray="1 2" className="stroke-slate-350 dark:stroke-zinc-700" />
            
            {/* Connection path */}
            {activeMarkers.length > 1 && (
              <path
                d={`M ${activeMarkers.map(m => `${m.x} ${m.y}`).join(" L ")}`}
                fill="none"
                className="stroke-primary/50"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                strokeLinecap="round"
              />
            )}

            {/* Nodes */}
            {markers.map(m => {
              const isVisited = activeMarkers.some(am => am.name === m.name);
              return (
                <g key={m.name}>
                  <circle cx={m.x} cy={m.y} r={isVisited ? 2.5 : 1} className={isVisited ? "fill-primary" : "fill-muted-foreground/30"} />
                  {isVisited && (
                    <circle cx={m.x} cy={m.y} r="6" className="fill-primary/25 animate-ping" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Label Tooltips */}
          <div className="absolute inset-0 pointer-events-none">
            {activeMarkers.map((m) => (
              <div
                key={m.name}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 dark:bg-zinc-950/95 border border-border/40 text-[8px] font-black uppercase text-white tracking-widest px-2 py-0.5 rounded shadow-lg flex items-center gap-1.5 backdrop-blur-sm pointer-events-auto"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {m.name}
              </div>
            ))}
          </div>

          {activeMarkers.length === 0 && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[0.5px] flex items-center justify-center p-4 text-center">
              <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground leading-relaxed max-w-[200px]">
                Your travel destinations will map here automatically
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950/50 pb-24">
      {/* CSS Confetti keyframes */}
      <style>{`
        @keyframes confetti-rise {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          55% { opacity: 1; }
          100% { transform: translateY(-130px) rotate(360deg) scale(1.1); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-rise 1.4s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      {/* Hero background banner */}
      <div className="h-40 md:h-56 w-full bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/20 relative border-b border-border/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-slate-50/50 dark:from-zinc-950/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 md:container">
        
        {/* PREMIUM HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-border bg-card/75 p-6 backdrop-blur-2xl shadow-xl relative overflow-hidden"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative flex-shrink-0 group">
                <Avatar className="h-24 w-24 rounded-3xl object-cover ring-4 ring-card shadow-lg md:h-28 md:w-28 transition-transform group-hover:scale-103 duration-300">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-3xl bg-gradient-to-tr from-primary to-indigo-600 text-white text-3xl font-black">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-950 font-black text-xs shadow-elevated border border-border">
                  L{travelLevel}
                </span>
              </div>

              <div className="text-center sm:text-left space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="font-display text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 md:text-3xl">
                    {displayName}
                  </h1>
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                    <Award className="h-3 w-3" /> Explorer Level {travelLevel}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground font-medium">
                  <p className="flex items-center justify-center sm:justify-start gap-1">
                    <Mail className="h-3.5 w-3.5 opacity-65" /> {user.email}
                  </p>
                  <span className="hidden sm:inline text-muted-foreground/30">•</span>
                  <p className="flex items-center justify-center sm:justify-start gap-1">
                    <Calendar className="h-3.5 w-3.5 opacity-65" /> Joined {joinDate}
                  </p>
                </div>

                <div className="pt-1.5 flex justify-center sm:justify-start">
                  {(!!user.email_confirmed_at || user.email === "test@planzo.ai") ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <CheckCircle className="h-3 w-3 text-emerald-500" /> Verified Traveler
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        <AlertCircle className="h-3 w-3 text-amber-500" /> Verify Email
                      </span>
                      <button
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="text-[9px] font-black uppercase tracking-wider text-indigo-500 hover:underline transition-colors disabled:opacity-50"
                      >
                        {resending ? "Resending..." : "Resend"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col md:flex-row gap-2 justify-center">
              <button 
                onClick={() => navigate("/settings")} 
                aria-label="Settings"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all shadow-sm active:scale-95"
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
              
              {isEditing ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsEditing(false); setShowAvatarSelector(false); }} 
                    className="rounded-2xl border border-border/85 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={savingProfile} 
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                  >
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-100 dark:text-slate-900 shadow-lg transition-all active:scale-95"
                >
                  <User className="h-3.5 w-3.5" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Preset Avatar Selector Expanded inline */}
          <AnimatePresence>
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-border/40 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full rounded-2xl border border-border/80 bg-background/50 px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="Display Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Choose Premium Avatar</label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                        className="px-4 py-3 rounded-2xl border border-border/85 bg-background text-xs font-bold hover:bg-muted/40 transition-colors"
                      >
                        Choose Photo
                      </button>
                      {selectedAvatar && (
                        <div className="relative">
                          <img src={selectedAvatar} alt="Chosen" className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary" />
                          <button onClick={() => setSelectedAvatar("")} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold"><X className="h-2.5 w-2.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {showAvatarSelector && (
                  <div className="p-3 rounded-2xl bg-muted/20 border border-border/30 flex gap-3 flex-wrap">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => { setSelectedAvatar(preset); setShowAvatarSelector(false); }}
                        className={`h-14 w-14 rounded-2xl overflow-hidden ring-2 transition-all ${selectedAvatar === preset ? "ring-primary scale-105 shadow-md" : "ring-transparent opacity-85 hover:opacity-100"}`}
                      >
                        <img src={preset} alt="preset" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Level Progress */}
          <div className="mt-6 pt-5 border-t border-border/30">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2">
              <span className="text-slate-650 dark:text-slate-350">Explorer Score</span>
              <span className="text-primary">{explorerScore} / 100 XP</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${explorerScore}%` }}
                className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
              />
            </div>
          </div>
        </motion.div>

        {/* 1. TRAVEL DASHBOARD STAT ROW */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Trips", value: tripsCount, trend: tripsTrend, icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Travel Days", value: daysCount, trend: daysTrend, icon: CalendarPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Total Budget", value: formatPrice(totalBudget), trend: budgetTrend, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Wishlist Count", value: wishlist.length, trend: wishlistTrend, icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10" }
          ].map(stat => (
            <motion.div 
              key={stat.label}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-5 rounded-[28px] border border-border/80 bg-card shadow-sm flex flex-col justify-between h-36"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-tight">{stat.label}</span>
                <div className={`h-8 w-8 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <p className="font-display text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{stat.value}</p>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">{stat.trend}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* PROFILE NAVIGATION TABS */}
        <div className="mt-8 flex items-center justify-start gap-2 border-b border-border/40 pb-px overflow-x-auto">
          {[
            { id: "trips", icon: Map, label: "My Journeys", count: tripsCount },
            { id: "stats", icon: TrendingUp, label: "Analytics & Insights" },
            { id: "achievements", icon: Trophy, label: "Achievements", count: achievements.filter(a => a.unlocked).length },
            { id: "wishlist", icon: Heart, label: "Wishlist", count: wishlist.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`flex items-center gap-2 px-5 py-4 border-b-2 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap -mb-px ${
                activeTab === tab.id 
                  ? "border-primary text-slate-800 dark:text-slate-100 font-black" 
                  : "border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <tab.icon className="h-4 w-4" /> 
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-md text-[8px] bg-muted font-bold text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            
            {/* TRIPS TAB */}
            {activeTab === "trips" && (
              <motion.div 
                key="trips" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Search / Filter Row */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={tripSearch}
                      onChange={e => setTripSearch(e.target.value)}
                      placeholder="Search saved travel plans..."
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card border border-border/80 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium shadow-sm"
                    />
                  </div>

                  {/* 4. QUICK FILTERS */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                    {([
                      { id: "all", label: "All Journeys" },
                      { id: "adventure", label: "Adventure" },
                      { id: "luxury", label: "Luxury" },
                      { id: "beach", label: "Beach Escape" },
                      { id: "nature", label: "Nature" },
                      { id: "recent", label: "Recent" }
                    ] as const).map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                          activeFilter === filter.id
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-sm"
                            : "bg-card border-border/80 text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
                        }`}
                      >
                        {filter.id === "luxury" ? "👑 " : filter.id === "beach" ? "🌴 " : filter.id === "adventure" ? "🏔️ " : ""}
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  let filtered = savedTrips.filter(t =>
                    !tripSearch ||
                    t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
                    (t.mood && t.mood.toLowerCase().includes(tripSearch.toLowerCase()))
                  );

                  // Apply Category Filter
                  if (activeFilter === "adventure") {
                    filtered = filtered.filter(t => t.mood === "adventure" || t.title.toLowerCase().includes("manali") || t.title.toLowerCase().includes("ladakh"));
                  } else if (activeFilter === "luxury") {
                    filtered = filtered.filter(t => parsePriceToINR(t.budget || 0) >= 40000);
                  } else if (activeFilter === "beach") {
                    filtered = filtered.filter(t => t.mood === "relax" || t.title.toLowerCase().includes("goa") || t.title.toLowerCase().includes("kerala"));
                  } else if (activeFilter === "nature") {
                    filtered = filtered.filter(t => t.title.toLowerCase().includes("kerala") || t.title.toLowerCase().includes("manali"));
                  } else if (activeFilter === "recent") {
                    filtered = [...filtered].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                  }

                  if (tripsCount === 0) {
                    return (
                      <div className="py-20 text-center bg-card rounded-[36px] border border-border border-dashed p-8 shadow-sm">
                        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-6">
                          <Compass className="h-10 w-10 text-primary opacity-45" />
                        </div>
                        <h3 className="font-display font-black text-xl mb-2 text-slate-800 dark:text-slate-100">Your travel map is open</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed mb-6">
                          Every epic journey begins with a single search. Generate your first custom AI itinerary to start mapping coordinates.
                        </p>
                        <button 
                          onClick={() => navigate("/plan")} 
                          className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                          Plan a New Trip
                        </button>
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16 text-center bg-card rounded-[32px] border border-border border-dashed p-6">
                        <p className="text-sm font-bold text-muted-foreground">No journeys match the active filters.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filtered.map(trip => {
                        const titleWords = trip.title.toLowerCase().split(/[\s,]+/);
                        const destMatch = getAllDestinations().find(d =>
                          titleWords.some(word => word.length > 3 && d.name.toLowerCase().includes(word))
                        ) || getAllDestinations().find(d => trip.title.toLowerCase().includes(d.name.split(",")[0].toLowerCase()));
                        
                        const image = destMatch?.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop";
                        const budgetAmount = parsePriceToINR(trip.budget || 0);

                        // Created Date formatting
                        const createdStr = new Date(trip.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        
                        // Fake last opened calculations
                        const lastOpenedStr = "Opened 2 hours ago";

                        // Status badge logic
                        const isUpcoming = trip.start_date && new Date(trip.start_date).getTime() > Date.now();
                        const statusBadge = isUpcoming ? "Upcoming" : "Completed";

                        return (
                          <motion.div 
                            key={trip.id} 
                            onClick={() => navigate(`/plan?id=${trip.id}`)} 
                            className="group relative bg-card rounded-[32px] border border-border shadow-card overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                          >
                            <div className="h-48 w-full overflow-hidden relative">
                              <img src={image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                              
                              <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                                <span className="text-[10px] uppercase font-black text-white tracking-widest">{trip.days} Days</span>
                              </div>
                              
                              <div className="absolute bottom-4 left-5 right-5">
                                <span className="text-[9px] font-black tracking-widest uppercase text-primary bg-primary/20 backdrop-blur-sm border border-primary/20 px-2 py-0.5 rounded-md">
                                  {trip.mood || "Standard"} vibe
                                </span>
                                <h3 className="text-white text-xl font-display font-black truncate mt-2 pr-3 leading-tight">{trip.title}</h3>
                              </div>
                            </div>
                            
                            {/* 5. JOURNEY CARD IMPROVEMENTS */}
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                              {trip.start_date && (
                                <div>
                                  <TripCountdown startDate={trip.start_date} tripTitle={trip.title} days={trip.days || 3} />
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground font-semibold">
                                <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Financial Budget</p>
                                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{formatPrice(budgetAmount)}</p>
                                </div>
                                <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Duration & Vibe</p>
                                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 capitalize">{trip.days}d • {trip.mood || "Adventure"}</p>
                                </div>
                              </div>

                              {/* Card Metadata info */}
                              <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/85 uppercase px-1">
                                <div className="flex gap-2">
                                  <span>Created: {createdStr}</span>
                                  <span>•</span>
                                  <span>{lastOpenedStr}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md font-black ${isUpcoming ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                  {statusBadge}
                                </span>
                              </div>
                              
                              <div className="flex gap-2.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/expenses`) }} 
                                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-100 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-border/40"
                                >
                                  <Receipt className="h-3.5 w-3.5" /> Expenses
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/journal`) }} 
                                  className="flex-1 py-3 rounded-2xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5 border border-primary/10"
                                >
                                  <BookOpen className="h-3.5 w-3.5" /> Journal
                                </button>
                                <button 
                                  onClick={(e) => deleteTrip(trip.id, e)} 
                                  aria-label="Delete journey"
                                  className="px-4 rounded-2xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all border border-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ANALYTICS & INSIGHTS TAB */}
            {activeTab === "stats" && (
              <motion.div 
                key="stats" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {tripsCount === 0 ? (
                  <div className="py-20 text-center bg-card rounded-[36px] border border-border border-dashed p-8 shadow-sm">
                    <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-6">
                      <TrendingUp className="h-10 w-10 text-primary opacity-45" />
                    </div>
                    <h3 className="font-display font-black text-xl mb-2 text-slate-800 dark:text-slate-100">No Travel Analytics Yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed mb-6">
                      Analytics, budget breakdowns, and geographical maps are unlocked as soon as you generate and save trips.
                    </p>
                    <button 
                      onClick={() => navigate("/plan")} 
                      className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      Plan a New Trip
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Pane: Map & Insights */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* 7. TRAVEL MAP */}
                      <TravelMap />

                      {/* 2. AI TRAVEL INSIGHTS CARD */}
                      <div className="relative rounded-[32px] border border-transparent bg-gradient-to-tr from-indigo-600/90 to-purple-800/90 p-6 text-white shadow-xl overflow-hidden">
                        <div className="absolute right-0 bottom-0 h-40 w-40 bg-white/5 blur-3xl rounded-full" />
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded border border-white/20">Copilot Analysis</span>
                            <h3 className="font-display font-black text-lg mt-1 flex items-center gap-2">
                              <Sparkles className="h-4.5 w-4.5 text-indigo-200 animate-pulse" /> AI Travel Insights
                            </h3>
                          </div>
                          <Zap className="h-5 w-5 text-indigo-300" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          {[
                            { title: "Vibe Affinity", text: `You prefer ${favoriteStyle} experiences.`, icon: Trophy },
                            { title: "Travel Duration", text: `Average trip duration is ${avgDuration} days.`, icon: Clock },
                            { title: "Spending Profile", text: `Average budget per trip is ${formatPrice(avgBudget)}.`, icon: TrendingUp },
                            { title: "Suggested Next Spot", text: "Suggested next destination: Bali.", icon: Compass }
                          ].map((insight, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-3">
                              <insight.icon className="h-5 w-5 text-indigo-200 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-150">{insight.title}</h4>
                                <p className="text-xs font-semibold mt-1 text-white/90">{insight.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Pane: Vibes Breakdown */}
                    <div className="space-y-6">
                      <div className="p-6 rounded-[32px] border border-border bg-card shadow-sm">
                        <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base mb-5">
                          Travel Vibe Distribution
                        </h3>
                        {(() => {
                          const total = tripsCount || 1;
                          const emojis: Record<string, string> = { adventure: "🏔️", relax: "🌴", romantic: "❤️", family: "👨‍👩‍👧‍👦", solo: "🎒", nature: "🌿" };
                          
                          return (
                            <div className="space-y-4">
                              {Object.entries(moodCounts).sort((a,b) => b[1] - a[1]).map(([mood, count]) => {
                                const pct = Math.round((count / total) * 100);
                                return (
                                  <div key={mood}>
                                    <div className="flex justify-between items-center text-xs mb-1.5">
                                      <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <span className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-sm">{emojis[mood] || "✨"}</span>
                                        <span className="capitalize">{mood}</span>
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-bold">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        className="h-full rounded-full bg-primary"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Travel Recommendations */}
                      <div className="p-6 rounded-[32px] border border-border bg-card shadow-sm">
                        <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base mb-4 flex items-center gap-1.5">
                          <Compass className="h-4.5 w-4.5 text-primary" /> Recommended Escapes
                        </h3>
                        <div className="space-y-4">
                          {TRAVEL_RECOMMENDATIONS.map(rec => (
                            <div 
                              key={rec.id} 
                              onClick={() => navigate(`/plan?dest=${encodeURIComponent(rec.name)}`)}
                              className="group relative rounded-2xl overflow-hidden border border-border/60 bg-muted/10 cursor-pointer hover:border-primary/45 transition-all flex flex-col justify-end h-32 p-4"
                            >
                              <img src={rec.image} alt={rec.name} className="absolute inset-0 h-full w-full object-cover opacity-85 group-hover:scale-103 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                              
                              <div className="relative text-white z-10 space-y-1">
                                <h4 className="font-display font-black text-sm leading-none">{rec.name}</h4>
                                <p className="text-[9px] text-white/70 truncate">{rec.why}</p>
                                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider pt-1 text-white/90">
                                  <span>Est. {formatPrice(rec.budget)}</span>
                                  <span>Season: {rec.season}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <motion.div 
                key="achievements" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* 3. TRAVEL ACHIEVEMENTS Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((ach) => {
                    const isHovered = hoveredAchievement === ach.id;
                    return (
                      <div 
                        key={ach.id} 
                        onMouseEnter={() => ach.unlocked && setHoveredAchievement(ach.id)}
                        onMouseLeave={() => setHoveredAchievement(null)}
                        className={`p-6 rounded-[28px] border transition-all flex items-start gap-4 relative overflow-hidden ${
                          ach.unlocked 
                            ? "bg-card border-border/80 shadow-sm hover:shadow-md cursor-default" 
                            : "bg-muted/30 border-border/40 opacity-45 select-none"
                        }`}
                      >
                        {/* Confetti overlay inside unlocked cards */}
                        <ConfettiEffect active={isHovered && ach.unlocked} />

                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                          ach.unlocked ? "bg-primary/10" : "bg-muted/50 grayscale"
                        }`}>
                          {ach.unlocked ? ach.icon : <Lock className="h-4.5 w-4.5 text-muted-foreground" />}
                        </div>
                        
                        <div className="space-y-1.5 relative z-10">
                          <h4 className={`text-sm font-black tracking-tight ${ach.unlocked ? "text-slate-800 dark:text-slate-100" : "text-muted-foreground"}`}>
                            {ach.title}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {ach.desc}
                          </p>
                          <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            ach.unlocked ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted-foreground/10 text-muted-foreground"
                          }`}>
                            {ach.unlocked ? "Unlocked" : "Locked"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <motion.div 
                key="wishlist" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {wishlist.length === 0 ? (
                  /* 6. EMPTY STATE Wishlist */
                  <div className="py-20 text-center bg-card rounded-[36px] border border-border border-dashed p-8 shadow-sm flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-pink-500/5 flex items-center justify-center mb-6">
                      <Heart className="h-10 w-10 text-pink-500 opacity-45" />
                    </div>
                    <h3 className="font-display font-black text-xl mb-2 text-slate-800 dark:text-slate-100">Wishlist is empty</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed mb-6">
                      Browse and bookmark your dream destinations. They will populate here so you can easily plan coordinates later.
                    </p>
                    <button 
                      onClick={() => navigate("/explore")} 
                      className="px-8 py-3.5 rounded-2xl border-2 border-primary text-primary font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      Explore Destinations
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {wishlist.map((destId) => {
                      const dest = getAllDestinations().find(d => d.id === destId);
                      if (!dest) return null;
                      const inrPrice = parsePriceToINR(dest.price || 0);

                      return (
                        <div 
                          key={dest.id} 
                          onClick={() => navigate(`/destination/${dest.id}`)}
                          className="flex gap-4 bg-card p-4 rounded-[28px] border border-border hover:border-primary/50 cursor-pointer shadow-sm hover:shadow-md transition-all group"
                        >
                          <div className="overflow-hidden rounded-2xl h-24 w-24 shrink-0">
                            <img src={dest.image} alt={dest.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 py-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="font-display font-black text-base text-slate-800 dark:text-slate-100 leading-tight truncate">{dest.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{dest.state}</p>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                                Est. {formatPrice(inrPrice)}
                              </span>
                              <button 
                                onClick={(e) => removeWishlist(dest.id, e)} 
                                aria-label="Remove from wishlist"
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
