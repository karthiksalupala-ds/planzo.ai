import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Heart, MapPin, LogOut, Bookmark, Loader2, Map, Trash2, Receipt, ExternalLink, Edit2, Check, X, Moon, Sun, IndianRupee, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { indianDestinations } from "@/data/destinations";

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

  const [activeTab, setActiveTab] = useState<"trips" | "wishlist" | "settings">("trips");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStyles, setEditStyles] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

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
              <motion.div key="trips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedTrips.length === 0 ? (
                  <div className="col-span-full py-10 text-center bg-card rounded-2xl border border-border border-dashed">
                    <Map className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-muted-foreground font-medium">No saved trips yet.</p>
                    <button onClick={() => navigate("/plan")} className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Plan your first trip</button>
                  </div>
                ) : (
                  savedTrips.map(trip => {
                    // Try to map to an Indian Destination image
                    const destMatch = indianDestinations.find(d => trip.title.toLowerCase().includes(d.name.split(",")[0].toLowerCase()));
                    const image = destMatch?.image || "https://images.unsplash.com/photo-1527664557558-a2b352fcf203?q=80&w=2070&auto=format&fit=crop";

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
                          <p className="text-xs text-muted-foreground mb-3 font-medium flex items-center gap-1"><Bookmark className="h-3 w-3" /> Saved on {new Date(trip.created_at).toLocaleDateString()}</p>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/expenses`) }} className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                              <Receipt className="h-3.5 w-3.5" /> Expenses
                            </button>
                            <button onClick={(e) => deleteTrip(trip.id, e)} className="px-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
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
