import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Settings, Heart, MapPin, Star, LogOut, ChevronRight, Bookmark, Globe, Loader2, Map, Trash2, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ProfileRow = Tables<"profiles">;
type SavedTripRow = Tables<"saved_trips">;

const menuItems = [
  { icon: Bookmark, label: "Saved Trips" },
  { icon: Heart, label: "Wishlist" },
  { icon: Globe, label: "Language" },
  { icon: Settings, label: "Settings" },
];

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTripRow[]>([]);
  const [showTrips, setShowTrips] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) setProfile(data);
      });
      supabase.from("saved_trips").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setSavedTrips(data);
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const deleteTrip = async (id: string) => {
    await supabase.from("saved_trips").delete().eq("id", id);
    setSavedTrips((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Trip deleted" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || user.user_metadata?.display_name || "Traveler";
  const travelStyle = profile?.travel_style?.length ? profile.travel_style : ["Adventure", "Budget", "Food Lover", "Culture"];

  return (
    <div className="px-5 md:container py-6 max-w-lg mx-auto">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full gradient-hero flex items-center justify-center shadow-elevated">
          <User className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground mt-3">{displayName}</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" />
          {user.email}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center gap-8 mt-6 py-4 px-6 rounded-2xl bg-card shadow-card">
        {[
          { label: "Saved Trips", value: String(savedTrips.length) },
          { label: "Member Since", value: new Date(user.created_at).toLocaleDateString("en", { month: "short", year: "numeric" }) },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Travel Style */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Travel Style</h3>
        <div className="flex flex-wrap gap-2">
          {travelStyle.map((tag: string) => (
            <span key={tag} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">{tag}</span>
          ))}
        </div>
      </motion.div>

      {/* Saved Trips */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-6">
        <button onClick={() => setShowTrips(!showTrips)} className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <span className="flex items-center gap-1"><Map className="h-3 w-3" /> Saved Trips ({savedTrips.length})</span>
          <ChevronRight className={`h-4 w-4 transition-transform ${showTrips ? "rotate-90" : ""}`} />
        </button>
        {showTrips && (
          <div className="space-y-2">
            {savedTrips.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No saved trips yet. Go plan one!</p>
            ) : savedTrips.map((trip) => (
              <div key={trip.id} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
                <div className="h-9 w-9 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{trip.title}</p>
                  <p className="text-[10px] text-muted-foreground">{trip.mood} · {trip.days} days · {new Date(trip.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => navigate(`/trip/${trip.id}/expenses`)} className="text-muted-foreground hover:text-primary transition-colors" title="Track Expenses">
                  <Receipt className="h-4 w-4" />
                </button>
                <button onClick={() => deleteTrip(trip.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Menu */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 rounded-2xl bg-card shadow-card overflow-hidden">
        {menuItems.map((item, i) => (
          <button key={item.label} className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 transition-colors ${i !== menuItems.length - 1 ? "border-b border-border" : ""}`}>
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </motion.div>

      {/* Sign Out */}
      <motion.button
        onClick={handleSignOut}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 w-full mt-6 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </motion.button>
    </div>
  );
};

export default Profile;
