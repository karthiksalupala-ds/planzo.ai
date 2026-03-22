import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Heart, MapPin, LogOut, Bookmark, Loader2, Map, Trash2, Receipt, ExternalLink, Edit2, Check, X, Moon, Sun, IndianRupee, Globe, CalendarPlus, Download, BarChart3, TrendingUp, Plane, BookOpen, Search, Camera, Mail, Sparkles, Shield, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllDestinations } from "@/data/destinations";
import type { Tables } from "@/integrations/supabase/types";
import TripCountdown from "@/components/TripCountdown";
import { downloadTripICS, openGoogleCalendar } from "@/lib/calendar";

type ProfileRow = Tables<"profiles">;
type SavedTripRow = Tables<"saved_trips">;

const availableTravelStyles = ["Adventure", "Budget", "Luxury", "Food Lover", "Culture", "Relaxing", "Nature", "Backpacker"];

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTripRow[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<"trips" | "wishlist" | "stats">("trips");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStyles, setEditStyles] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [tripSearch, setTripSearch] = useState("");

  // Settings
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains("dark"));

  // Development Bypass Setup
  const isDevBypass = !user;
  const activeUser = user || {
    id: "dev-mock-user-123",
    user_metadata: {
      display_name: "Guest Explorer",
      avatar_url: ""
    }
  };

  useEffect(() => {
    if (user && !isDevBypass) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setProfile(data);
          setEditName(data.display_name || "");
          setEditStyles(data.travel_style || []);
        }
      });
      supabase.from("saved_trips").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setSavedTrips(data);
      });
    } else if (isDevBypass) {
      // Provide mock data for development bypass
      setProfile({
        id: "mock",
        user_id: "dev-mock-user-123",
        display_name: "Guest Explorer",
        travel_style: ["Adventure", "Culture"],
        avatar_url: null,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      setEditName("Guest Explorer");
      setEditStyles(["Adventure", "Culture"]);
      setSavedTrips([
        {
          id: "mock-trip-1",
          user_id: "dev-mock-user-123",
          title: "Kerala",
          query: "Kerala",
          mood: "nature",
          days: 3,
          budget: 15000,
          travelers: 2,
          created_at: new Date().toISOString(),
          plan_data: {},
          start_date: null,
          status: "completed"
        } as SavedTripRow
      ]);
    }

    // Load local wishlist (works without auth)
    const localWishlist = JSON.parse(localStorage.getItem("planzo_wishlist") || "[]");
    setWishlist(localWishlist);
  }, [user, isDevBypass]);

  const handleSignOut = async () => {
    // Attempt real sign out first if session exists
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await signOut();
      navigate("/");
      toast({ title: "Signed out successfully" });
      return;
    }

    if (isDevBypass) {
      toast({ title: "You are heavily browsing in dev mode. No real sign out required." });
      return;
    }
  };

  const deleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDevBypass) {
      await supabase.from("saved_trips").delete().eq("id", id);
    }
    setSavedTrips((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Trip deleted" });
  };

  const removeWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = wishlist.filter(w => w !== id);
    setWishlist(updated);
    localStorage.setItem("planzo_wishlist", JSON.stringify(updated));
    toast({ title: "Removed from wishlist" });
  };

  const handleSaveProfile = async () => {
    if (!activeUser) return;
    setSavingProfile(true);

    if (!isDevBypass) {
      const { error } = await supabase.from("profiles").update({
        display_name: editName,
        travel_style: editStyles
      }).eq("user_id", activeUser.id);

      if (error) {
        setSavingProfile(false);
        return toast({ title: "Error saving profile", variant: "destructive" });
      }
    }

    // Success for both real and dev bypass
    setSavingProfile(false);
    toast({ title: "Profile updated successfully!" });
    setProfile(prev => prev ? { ...prev, display_name: editName, travel_style: editStyles } : null);
    setIsEditing(false);
  };

  const toggleStyle = (style: string) => {
    setEditStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]);
  };

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    setIsDarkMode(isDark);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.display_name || activeUser.user_metadata?.display_name || "Traveler";
  const avatarUrl = activeUser.user_metadata?.avatar_url as string | undefined;
  const travelStyle = profile?.travel_style?.length ? profile.travel_style : ["Adventure", "Budget", "Culture"];
  const daysTraveled = savedTrips.reduce((sum, t) => sum + (t.days || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Cover Header */}
      <div className="h-48 md:h-64 w-full bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-background" />
      </div>

      <div className="px-5 md:container max-w-4xl mx-auto -mt-24 relative z-10">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-[32px] bg-card/80 backdrop-blur-xl border border-white/10 shadow-elevated">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-28 w-28 md:h-36 md:w-36 rounded-[28px] object-cover shadow-2xl ring-4 ring-background/50 group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="h-28 w-28 md:h-36 md:w-36 rounded-[28px] gradient-hero flex items-center justify-center shadow-2xl ring-4 ring-background/50 group-hover:scale-105 transition-transform duration-500">
                  <User className="h-12 w-12 md:h-16 md:w-16 text-primary-foreground" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center text-primary cursor-pointer hover:scale-110 transition-transform">
                <Camera className="h-5 w-5" />
              </div>
            </div>

            <div className="flex-1 w-full pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">{displayName}</h1>
                    {!isEditing && (
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">Explorer Tier</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground/80 font-medium flex items-center gap-1.5">
                    {isDevBypass ? (
                      <span className="flex items-center gap-1.5 text-amber-500/80">
                        <Shield className="h-3.5 w-3.5" /> Guest Mode (Offline Only)
                      </span>
                    ) : (
                      <>
                        <Mail className="h-3.5 w-3.5 opacity-60" /> {user?.email}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => navigate("/settings")} 
                    className="h-11 w-11 rounded-2xl flex items-center justify-center border bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-2xl border border-border text-muted-foreground font-bold text-sm hover:bg-muted/50 transition-colors">Cancel</button>
                      <button onClick={handleSaveProfile} disabled={savingProfile} className="px-6 py-2.5 rounded-2xl gradient-hero text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20">{savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 rounded-2xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg">
                      <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Stats HUD */}
              <div className="grid grid-cols-3 gap-8 mt-8 p-6 rounded-2xl bg-muted/30 border border-border/50">
                <div className="text-center md:text-left">
                  <p className="font-display text-2xl font-bold text-foreground leading-none">{savedTrips.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-2">Trips</p>
                </div>
                <div className="text-center md:text-left border-x border-border/50 px-4 md:px-8">
                  <p className="font-display text-2xl font-bold text-foreground leading-none">{wishlist.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-2">Wishlist</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="font-display text-2xl font-bold text-foreground leading-none">{daysTraveled}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-2">Days Out</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Carousel / Many Stuff */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-5 rounded-3xl bg-card border border-border flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Planzo Pro</p>
              <p className="text-[11px] text-muted-foreground">Unlock unlimited AI generation</p>
            </div>
          </div>
          <div className="p-5 rounded-3xl bg-card border border-border flex items-center gap-4 group hover:border-emerald-500/50 transition-colors cursor-pointer shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">1,250 Tokens</p>
              <p className="text-[11px] text-muted-foreground">Travel points earned this month</p>
            </div>
          </div>
          <div className="p-5 rounded-3xl bg-card border border-border flex items-center gap-4 group hover:border-blue-500/50 transition-colors cursor-pointer shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Verified User</p>
              <p className="text-[11px] text-muted-foreground">Identity verified for bookings</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mt-8 overflow-x-auto scrollbar-hide pb-2 border-b border-border/50">
          {[
            { id: "trips", icon: Map, label: "My Journeys" },
            { id: "stats", icon: BarChart3, label: "Analytics" },
            { id: "wishlist", icon: Heart, label: "Wishlist" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-6 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "text-primary bg-primary/5 shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {/* TRIPS TAB */}
            {activeTab === "trips" && (
              <motion.div key="trips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Search Bar */}
                {savedTrips.length > 2 && (
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={tripSearch}
                      onChange={e => setTripSearch(e.target.value)}
                      placeholder="Search your adventures..."
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/30 border border-border/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-sm"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(() => {
                  const filtered = savedTrips.filter(t =>
                    !tripSearch ||
                    t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
                    (t.mood && t.mood.toLowerCase().includes(tripSearch.toLowerCase())) ||
                    (t.query && t.query.toLowerCase().includes(tripSearch.toLowerCase()))
                  );

                  if (savedTrips.length === 0) {
                    return (
                      <div className="col-span-full py-16 text-center bg-card rounded-[32px] border border-border border-dashed">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                          <Map className="h-10 w-10 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="font-display font-bold text-xl mb-1">Your travel map is empty</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">Every great journey begins with a single search. Where to next?</p>
                        <button onClick={() => navigate("/plan")} className="mt-6 px-8 py-3 rounded-2xl gradient-hero text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Plan a New Trip</button>
                      </div>
                    );
                  }

                  return filtered.map(trip => {
                    const titleWords = trip.title.toLowerCase().split(/[\s,]+/);
                    const destMatch = getAllDestinations().find(d =>
                      titleWords.some(word => word.length > 3 && d.name.toLowerCase().includes(word))
                    ) || getAllDestinations().find(d => trip.title.toLowerCase().includes(d.name.split(",")[0].toLowerCase()));
                    const image = destMatch?.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop";

                    return (
                      <motion.div 
                        key={trip.id} 
                        layoutId={trip.id}
                        onClick={() => navigate(`/plan?id=${trip.id}`)} 
                        className="group relative bg-card rounded-[28px] border border-border shadow-card overflow-hidden cursor-pointer hover:border-primary transition-all duration-300"
                      >
                        <div className="h-44 w-full overflow-hidden relative">
                          <img src={image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                            <span className="text-[10px] uppercase font-bold text-white tracking-widest">{trip.days} Days</span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white text-xl font-display font-bold truncate pr-3">{trip.title}</h3>
                            <p className="text-white/60 text-xs mt-1 font-medium capitalize">{trip.mood || "Discovery"} Mode</p>
                          </div>
                        </div>
                        <div className="p-5">
                          {trip.start_date && (
                            <div className="mb-4">
                              <TripCountdown startDate={trip.start_date} tripTitle={trip.title} days={trip.days || 3} />
                            </div>
                          )}
                          <div className="flex gap-3">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/expenses`) }} className="flex-1 py-3 rounded-xl bg-muted/50 text-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5 border border-border/50">
                              <Receipt className="h-3.5 w-3.5" /> Expenses
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/journal`) }} className="flex-1 py-3 rounded-xl bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5 border border-primary/10">
                              <BookOpen className="h-3.5 w-3.5" /> Journal
                            </button>
                            <button onClick={(e) => deleteTrip(trip.id, e)} className="px-4 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all border border-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
                </div>
              </motion.div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-card rounded-[32px] border border-border border-dashed">
                    <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground font-medium mb-4">No dream destinations pinned yet.</p>
                    <button onClick={() => navigate("/explore")} className="px-6 py-2.5 rounded-2xl border border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all">Explore Destinations</button>
                  </div>
                ) : (
                  wishlist.map((destId) => {
                    const dest = getAllDestinations().find(d => d.id === destId);
                    if (!dest) return null;
                    return (
                      <div key={dest.id} onClick={() => navigate(`/destination/${dest.id}`)} className="flex gap-4 bg-card p-4 rounded-[28px] border border-border shadow-sm hover:shadow-md cursor-pointer transition-all group">
                        <div className="overflow-hidden rounded-2xl h-24 w-24 shrink-0">
                          <img src={dest.image} alt={dest.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 py-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-base text-foreground leading-tight">{dest.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{dest.state}</p>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg">Est. {dest.price}</span>
                            <button onClick={(e) => removeWishlist(dest.id, e)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </motion.div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "stats" && (
              <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Completed", value: savedTrips.length, icon: CheckCircle, color: "text-emerald-500" },
                    { label: "Hours Traveled", value: daysTraveled * 12, icon: Clock, color: "text-amber-500" },
                    { label: "Memories", value: 4, icon: Camera, color: "text-blue-500" },
                    { label: "Loyalty Level", value: "Silver", icon: Sparkles, color: "text-purple-500" },
                  ].map(stat => (
                    <div key={stat.label} className="p-5 rounded-[28px] bg-card border border-border shadow-sm text-center">
                      <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <p className="font-display text-2xl font-bold text-foreground leading-none">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-2">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* (Keep rest of analytics as is or slightly refined) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mood Breakdown */}
                  <div className="p-6 rounded-[32px] bg-card border border-border shadow-card">
                    <h3 className="font-display font-bold text-foreground text-lg mb-6 flex items-center gap-2">
                       Travel Vibes Breakdown
                    </h3>
                    {(() => {
                      const moodCounts: Record<string, number> = {};
                      savedTrips.forEach(t => {
                        const mood = t.mood || "Unknown";
                        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
                      });
                      const total = savedTrips.length || 1;
                      const moodEmojis: Record<string, string> = { adventure: "🏔️", relax: "🌴", romantic: "❤️", family: "👨‍👩‍👧‍👦", solo: "🎒", nature: "🌿" };

                      return Object.entries(moodCounts).length > 0 ? (
                        <div className="space-y-5">
                          {Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => {
                            const pct = Math.round((count / total) * 100);
                            return (
                              <div key={mood}>
                                <div className="flex justify-between text-xs mb-2">
                                  <span className="font-bold text-foreground capitalize flex items-center gap-2">
                                    <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm">{moodEmojis[mood] || "✨"}</span> {mood}
                                  </span>
                                  <span className="text-muted-foreground font-bold">{count} Trip{count > 1 ? "s" : ""}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                    className="h-full rounded-full gradient-hero shadow-[0_0_12px_rgba(255,51,102,0.3)]"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-10 opacity-50">Log your first adventure to see analytics</p>
                      );
                    })()}
                  </div>

                  {/* Budget Trends */}
                  <div className="p-6 rounded-[32px] bg-card border border-border shadow-card">
                    <h3 className="font-display font-bold text-foreground text-lg mb-6 flex items-center gap-2">
                      Spending Efficiency
                    </h3>
                    <div className="space-y-4">
                      {savedTrips.slice(0, 4).map(trip => (
                        <div key={trip.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <p className="text-sm font-bold truncate max-w-[120px]">{trip.title}</p>
                          </div>
                          <p className="text-sm font-black text-primary">₹{(Number(trip.budget) || 0).toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="mt-6 pt-6 border-t border-border/50 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Investment in Memories</p>
                        <p className="text-3xl font-display font-black text-foreground mt-2">
                          ₹{savedTrips.reduce((s, t) => s + (Number(t.budget) || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
