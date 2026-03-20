import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Heart, MapPin, LogOut, Bookmark, Loader2, Map, Trash2, Receipt, ExternalLink, Edit2, Check, X, Moon, Sun, IndianRupee, Globe, CalendarPlus, Download, BarChart3, TrendingUp, Plane, BookOpen, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { indianDestinations } from "@/data/destinations";
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

  const [activeTab, setActiveTab] = useState<"trips" | "wishlist" | "stats" | "settings">("trips");
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
          budget: "15000",
          travelers: 2,
          created_at: new Date().toISOString(),
          plan_data: {}
        } as SavedTripRow
      ]);
    }

    // Load local wishlist (works without auth)
    const localWishlist = JSON.parse(localStorage.getItem("planzo_wishlist") || "[]");
    setWishlist(localWishlist);
  }, [user, isDevBypass]);

  const handleSignOut = async () => {
    if (isDevBypass) {
      toast({ title: "You are heavily browsing in dev mode. No real sign out required." });
      return;
    }
    await signOut();
    navigate("/auth");
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
      <div className="h-48 md:h-64 w-full bg-[url('https://images.unsplash.com/photo-1506461883276-594a12b11dc3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="px-5 md:container max-w-4xl mx-auto -mt-20 relative z-10">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-card border border-border shadow-elevated">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover shadow-card ring-4 ring-background"
              />
            ) : (
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full gradient-hero flex items-center justify-center shadow-card ring-4 ring-background">
                <User className="h-10 w-10 md:h-14 md:w-14 text-primary-foreground" />
              </div>
            )}

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {isEditing ? (
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground uppercase font-bold mb-1 block">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" /> {isDevBypass ? "guest@planzo.ai" : user?.email}
                    </p>
                  </div>
                )}

                {isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
                    <button onClick={handleSaveProfile} disabled={savingProfile} className="px-4 py-2 rounded-xl gradient-hero text-white text-sm font-bold flex items-center gap-2 shadow-card">{savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors flex items-center gap-2">
                    <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-6 pt-6 border-t border-border/50">
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{savedTrips.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Trips</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{wishlist.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Wishlist</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{daysTraveled}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Days Traveled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Style */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Travel Style</h3>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {availableTravelStyles.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleStyle(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${editStyles.includes(tag) ? "gradient-hero text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {travelStyle.map((tag: string) => (
                  <span key={tag} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-8 overflow-x-auto scrollbar-hide pb-2 border-b border-border/50">
          {[
            { id: "trips", icon: Map, label: "Saved Trips" },
            { id: "stats", icon: BarChart3, label: "Analytics" },
            { id: "wishlist", icon: Heart, label: "Wishlist" },
            { id: "settings", icon: Settings, label: "Settings" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {/* TRIPS TAB */}
            {activeTab === "trips" && (
              <motion.div key="trips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Search Bar */}
                {savedTrips.length > 2 && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={tripSearch}
                      onChange={e => setTripSearch(e.target.value)}
                      placeholder="Search trips..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  const filtered = savedTrips.filter(t =>
                    !tripSearch ||
                    t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
                    (t.mood && t.mood.toLowerCase().includes(tripSearch.toLowerCase())) ||
                    (t.query && t.query.toLowerCase().includes(tripSearch.toLowerCase()))
                  );

                  if (savedTrips.length === 0) {
                    return (
                      <div className="col-span-full py-10 text-center bg-card rounded-2xl border border-border border-dashed">
                        <Map className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground font-medium">No saved trips yet.</p>
                        <button onClick={() => navigate("/plan")} className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Plan your first trip</button>
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="col-span-full py-10 text-center">
                        <p className="text-muted-foreground">No trips match "{tripSearch}"</p>
                      </div>
                    );
                  }

                  return filtered.map(trip => {
                    const titleWords = trip.title.toLowerCase().split(/[\s,]+/);
                    const destMatch = indianDestinations.find(d =>
                      titleWords.some(word => word.length > 3 && d.name.toLowerCase().includes(word))
                    ) || indianDestinations.find(d => trip.title.toLowerCase().includes(d.name.split(",")[0].toLowerCase()));
                    const image = destMatch?.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop";

                    return (
                      <div key={trip.id} onClick={() => navigate(`/plan?id=${trip.id}`)} className="group relative bg-card rounded-2xl border border-border shadow-card overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                        <div className="h-32 w-full overflow-hidden relative">
                          <img src={image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <h3 className="text-white font-bold truncate pr-3">{trip.title}</h3>
                            <span className="text-[10px] uppercase font-bold text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded-md">{trip.days} Days</span>
                          </div>
                        </div>
                        <div className="p-4">
                          {trip.start_date && (
                            <div className="mb-3">
                              <TripCountdown startDate={trip.start_date} tripTitle={trip.title} days={trip.days || 3} />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mb-3 font-medium flex items-center gap-1"><Bookmark className="h-3 w-3" /> Saved on {new Date(trip.created_at).toLocaleDateString()}</p>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/expenses`) }} className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                              <Receipt className="h-3.5 w-3.5" /> Expenses
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/journal`) }} className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" /> Journal
                            </button>
                            {trip.start_date && (
                              <button onClick={(e) => { e.stopPropagation(); openGoogleCalendar({ title: trip.title, startDate: trip.start_date!, days: trip.days || 3, query: trip.query || undefined }); }} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1" title="Add to Calendar">
                                <CalendarPlus className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={(e) => deleteTrip(trip.id, e)} className="px-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
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
                  <div className="col-span-full py-10 text-center bg-card rounded-2xl border border-border border-dashed">
                    <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-muted-foreground font-medium">Your wishlist is empty.</p>
                    <button onClick={() => navigate("/explore")} className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Explore Destinations</button>
                  </div>
                ) : (
                  wishlist.map(destId => {
                    const dest = indianDestinations.find(d => d.id === destId);
                    if (!dest) return null;
                    return (
                      <div key={dest.id} onClick={() => navigate(`/destination/${dest.id}`)} className="flex gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm hover:shadow-md cursor-pointer transition-shadow">
                        <img src={dest.image} alt={dest.name} className="h-20 w-20 rounded-xl object-cover" />
                        <div className="flex-1 py-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{dest.name}</h4>
                            <p className="text-xs text-muted-foreground">{dest.state}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-bold text-primary">{dest.price}</span>
                            <button onClick={(e) => removeWishlist(dest.id, e)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"><Trash2 className="h-3 w-3" /></button>
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
              <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Trips", value: savedTrips.length, icon: Plane, color: "text-primary" },
                    { label: "Days Planned", value: daysTraveled, icon: MapPin, color: "text-emerald-500" },
                    { label: "Destinations", value: new Set(savedTrips.map(t => t.title)).size, icon: Globe, color: "text-ocean" },
                    { label: "Wishlist", value: wishlist.length, icon: Heart, color: "text-coral" },
                  ].map(stat => (
                    <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border shadow-card text-center">
                      <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                      <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mood Breakdown */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                  <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-primary" /> Trip Mood Distribution
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
                      <div className="space-y-3">
                        {Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => {
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={mood}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-semibold text-foreground capitalize flex items-center gap-1.5">
                                  <span>{moodEmojis[mood] || "✨"}</span> {mood}
                                </span>
                                <span className="text-muted-foreground">{count} trip{count > 1 ? "s" : ""} ({pct}%)</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.2, duration: 0.6 }}
                                  className="h-full rounded-full gradient-hero"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No trips yet to analyze</p>
                    );
                  })()}
                </div>

                {/* Upcoming Trips */}
                {(() => {
                  const upcoming = savedTrips
                    .filter(t => t.start_date && new Date(t.start_date) > new Date())
                    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

                  if (upcoming.length === 0) return null;

                  return (
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                      <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                        <CalendarPlus className="h-4 w-4 text-emerald-500" /> Upcoming Trips
                      </h3>
                      <div className="space-y-2">
                        {upcoming.slice(0, 5).map(trip => {
                          const daysUntil = Math.ceil((new Date(trip.start_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <div
                              key={trip.id}
                              onClick={() => navigate(`/plan?id=${trip.id}`)}
                              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Plane className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{trip.title}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {new Date(trip.start_date!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    {trip.days ? ` · ${trip.days} days` : ""}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${daysUntil <= 7 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow!" : `${daysUntil}d`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Budget Summary */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                  <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                    <IndianRupee className="h-4 w-4 text-primary" /> Budget Overview
                  </h3>
                  {savedTrips.length > 0 ? (
                    <div className="space-y-2">
                      {savedTrips.slice(0, 6).map(trip => {
                        const budgetVal = trip.budget ? parseInt(trip.budget) : 0;
                        return (
                          <div
                            key={trip.id}
                            onClick={() => navigate(`/plan?id=${trip.id}`)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                          >
                            <span className="text-sm font-medium text-foreground truncate max-w-[60%]">{trip.title}</span>
                            <span className="text-sm font-bold text-primary">
                              {budgetVal > 0 ? `₹${budgetVal.toLocaleString("en-IN")}` : "—"}
                            </span>
                          </div>
                        );
                      })}
                      <div className="pt-3 mt-2 border-t border-border/50 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Total Planned</span>
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                          ₹{savedTrips.reduce((s, t) => s + (t.budget ? parseInt(t.budget) || 0 : 0), 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No trip budgets to show</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="p-5 border-b border-border/50">
                  <h3 className="font-bold text-foreground flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /> App Preferences</h3>
                </div>

                <div className="p-2">
                  <div className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-xl transition-colors">
                    <div>
                      <p className="text-sm font-bold text-foreground">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Toggle application theme</p>
                    </div>
                    <button onClick={toggleDarkMode} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? "bg-primary" : "bg-muted-foreground/30"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-xl transition-colors">
                    <div>
                      <p className="text-sm font-bold text-foreground">Currency</p>
                      <p className="text-xs text-muted-foreground">Default display currency</p>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-xs font-bold">
                      <IndianRupee className="h-3 w-3" /> INR
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-border/50 mt-2 bg-destructive/5">
                  <button onClick={handleSignOut} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-destructive/30 bg-background text-destructive text-sm font-semibold hover:bg-destructive hover:text-white transition-all">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
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
