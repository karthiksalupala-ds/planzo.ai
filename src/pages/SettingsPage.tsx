import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Globe, 
  Download, 
  ChevronRight, 
  LogOut, 
  Shield, 
  User,
  Settings as SettingsIcon,
  MessageSquare,
  Plus,
  CalendarPlus,
  Loader2,
  Lock,
  X,
  Trash
} from "lucide-react";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("planzo_theme") === "dark" || document.documentElement.classList.contains("dark"));
  
  // Account State
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "Traveler");
  const [travelStyles, setTravelStyles] = useState<string[]>(user?.user_metadata?.travel_style || ["Adventure", "Culture"]);
  const [isSaving, setIsSaving] = useState(false);

  const availableStyles = ["Adventure", "Budget", "Luxury", "Food Lover", "Culture", "Relaxing", "Nature", "Backpacker"];

  // Modals & Actions State
  const [isExporting, setIsExporting] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currency, setCurrency] = useState(localStorage.getItem("planzo_currency") || "INR (₹)");
  const [tripReminders, setTripReminders] = useState(localStorage.getItem("planzo_trip_reminders") !== "off");
  const [productUpdates, setProductUpdates] = useState(localStorage.getItem("planzo_product_updates") !== "off");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    setIsDarkMode(isDark);
    localStorage.setItem("planzo_theme", isDark ? "dark" : "light");
  };

  const changeCurrency = (selected: string) => {
    setCurrency(selected);
    localStorage.setItem("planzo_currency", selected);
    setShowCurrencyModal(false);
    toast({ title: `Currency updated to ${selected}` });
  };

  const toggleReminderSetting = (key: "trip" | "product") => {
    if (key === "trip") {
      const next = !tripReminders;
      setTripReminders(next);
      localStorage.setItem("planzo_trip_reminders", next ? "on" : "off");
      return;
    }

    const next = !productUpdates;
    setProductUpdates(next);
    localStorage.setItem("planzo_product_updates", next ? "on" : "off");
  };

  const toggleStyle = (style: string) => {
    setTravelStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const saveAccountChanges = async () => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      travel_style: travelStyles
    }).eq("user_id", user.id);

    if (error) {
      toast({ title: "Error saving changes", variant: "destructive" });
      setIsSaving(false);
      return;
    }
    
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Settings updated successfully" });
    }, 500);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast({ title: "Signed out successfully" });
  };

  const handleExportData = async () => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      navigate("/auth");
      return;
    }
    
    setIsExporting(true);
    const { data: trips, error } = await supabase.from("saved_trips").select("*").eq("user_id", user.id);
    
    if (error) {
      toast({ title: "Failed to gather export data", variant: "destructive" });
      setIsExporting(false);
      return;
    }

    const exportData = {
      profile: {
        email: user?.email,
        display_name: displayName,
        travel_styles: travelStyles
      },
      saved_trips: trips,
      export_date: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planzo_travel_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
    toast({ title: "Data export complete!" });
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") {
      return toast({ title: "Please type DELETE to confirm", variant: "destructive", className: "bg-destructive text-white" });
    }

    setIsDeleting(true);
    
    if (!user) return;

    try {
      const { error: rpcError } = await supabase.rpc("delete_user_account");
      if (rpcError) throw rpcError;
    } catch (err) {
      console.warn("Secure self-deletion RPC failed. Falling back to record deletion:", err);
      await supabase.from("saved_trips").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
    }
    
    await signOut();
    
    setIsDeleting(false);
    setShowDeleteModal(false);
    navigate("/");
    toast({ title: "Account permanently deleted" });
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-xl font-bold text-foreground">Sign in to access settings</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Account settings are available only for authenticated users.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container max-w-2xl h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex items-center gap-2 font-display text-xl font-bold">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" /> Settings
          </h1>
        </div>
      </div>

      <div className="container max-w-2xl mt-6 px-4">
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Account overview</p>
                <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Open profile <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Theme</p>
                <p className="text-sm font-semibold text-foreground">{isDarkMode ? "Dark" : "Light"}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Currency</p>
                <p className="text-sm font-semibold text-foreground">{currency}</p>
              </div>
            </div>
          </motion.div>

          {/* Account Profile Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="mb-3 px-1 text-xs font-semibold text-muted-foreground">Account Profile</h2>
            <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-semibold text-muted-foreground">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    placeholder="Your travel name"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-xs font-semibold text-muted-foreground">Travel Style Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableStyles.map(style => (
                    <button
                      key={style}
                      onClick={() => toggleStyle(style)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        travelStyles.includes(style)
                          ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {travelStyles.includes(style) ? (
                        <Plus className="inline-block h-3 w-3 mr-1 rotate-45" />
                      ) : (
                        <Plus className="inline-block h-3 w-3 mr-1" />
                      )}
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={saveAccountChanges}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-3 text-sm font-semibold text-background transition-all hover:opacity-90"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile Changes"}
              </button>
            </div>
          </motion.div>

          {/* Preferences Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="mb-3 px-1 text-xs font-semibold text-muted-foreground">Preferences</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
              <div onClick={toggleDarkMode} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                    {isDarkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Night Mode</p>
                    <p className="text-[11px] text-muted-foreground">Adjust theme for optimal viewing</p>
                  </div>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>

              <div onClick={() => setShowCurrencyModal(true)} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Region & Currency</p>
                    <p className="text-[11px] text-muted-foreground">Localized financial display</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-primary/10 rounded-xl text-primary text-[10px] font-black tracking-widest uppercase">{currency}</div>
              </div>

              <div onClick={() => toggleReminderSetting("trip")} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground">
                    <CalendarPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Trip reminders</p>
                    <p className="text-[11px] text-muted-foreground">Notify before upcoming plans</p>
                  </div>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tripReminders ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${tripReminders ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>

              <div onClick={() => toggleReminderSetting("product")} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Product updates</p>
                    <p className="text-[11px] text-muted-foreground">New features and release notes</p>
                  </div>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${productUpdates ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${productUpdates ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security & Data */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="mb-3 px-1 text-xs font-semibold text-muted-foreground">Cloud & Safety</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Privacy & Data</p>
                    <p className="text-[11px] text-muted-foreground">Manage your synced information</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div onClick={handleExportData} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                    {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Export journeys</p>
                    <p className="text-[11px] text-muted-foreground">Get your data in JSON format</p>
                  </div>
                </div>
                {isExporting ? undefined : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </motion.div>

          {/* Support Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="mb-3 px-1 text-xs font-semibold text-muted-foreground">Help & Support</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Help Center</p>
                    <p className="text-[11px] text-muted-foreground">Priority support for Pro users</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="mb-3 px-1 text-xs font-semibold text-destructive/80">Danger Zone</h2>
            <div className="rounded-2xl border border-destructive/10 bg-destructive/5 p-2">
              <div onClick={() => setShowDeleteModal(true)} className="flex items-center justify-between p-4 hover:bg-destructive/10 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                    <Trash className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-destructive">Delete Account</p>
                    <p className="text-[10px] text-destructive/60">Permanently remove all travel history</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Session Card */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 shadow-sm">
            <button 
              onClick={handleSignOut} 
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted py-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-destructive hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Active session: {user.email}
            </p>
          </div>

          <div className="py-8 text-center opacity-40">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest">Planzo v2.4.0</p>
            <p className="text-[10px] font-medium">Settings synced for this device</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCurrencyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full max-w-sm bg-card border border-border rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-6 relative">
                <button onClick={() => setShowCurrencyModal(false)} className="absolute top-6 right-6 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background transition-colors">
                  <X className="h-4 w-4" />
                </button>
                <h3 className="text-lg font-display font-bold mb-2">Select Currency</h3>
                <p className="text-xs text-muted-foreground mb-6">Choose your preferred currency for estimating trip costs.</p>
                
                <div className="space-y-2">
                  {["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)"].map(curr => (
                    <button
                      key={curr}
                      onClick={() => changeCurrency(curr)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${currency === curr ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-muted/50 border-border text-foreground hover:border-primary/50'}`}
                    >
                      {curr}
                      {currency === curr && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-destructive/20 rounded-[32px] overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="p-6 relative">
                <button onClick={() => { setShowDeleteModal(false); setDeleteInput(""); }} className="absolute top-6 right-6 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background transition-colors">
                  <X className="h-4 w-4" />
                </button>
                <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Trash className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Delete Account?</h3>
                <p className="text-sm text-muted-foreground mb-6">This action is irreversible. All your saved trips, generated plans, and travel profile data will be permanently wiped.</p>
                
                <label className="text-xs font-bold text-muted-foreground mb-2 block tracking-wider">TYPE "DELETE" TO CONFIRM</label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-destructive/20 focus:border-destructive outline-none text-center font-black tracking-widest text-destructive uppercase transition-all mb-4"
                />
                
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || isDeleting}
                  className="w-full py-4 rounded-2xl bg-destructive text-white font-black text-sm hover:bg-destructive/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-destructive/20"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "PERMANENTLY DELETE"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
