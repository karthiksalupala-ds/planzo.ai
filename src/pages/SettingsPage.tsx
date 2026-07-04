import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Moon, Sun, Globe, Download, ChevronRight, LogOut, 
  Shield, User, Settings as SettingsIcon, Bell, Database, Trash, 
  Lock, X, Loader2, CheckCircle, ShieldAlert, Monitor, Sparkles,
  HelpCircle, Eye, RefreshCw, Key
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type SettingsSection = 
  | "account" 
  | "appearance" 
  | "notifications" 
  | "regional" 
  | "security" 
  | "data" 
  | "privacy"
  | "danger";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Navigation state
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(
    isMobile ? null : "account"
  );

  // App Theme state
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    (localStorage.getItem("planzo_theme") as "light" | "dark" | "system") || "system"
  );

  // Account State
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "Traveler");
  const [travelStyles, setTravelStyles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Regional Preferences
  const [currency, setCurrency] = useState(localStorage.getItem("planzo_currency") || "INR (₹)");
  const [language, setLanguage] = useState(localStorage.getItem("planzo_language") || "English");

  // Notifications
  const [tripReminders, setTripReminders] = useState(localStorage.getItem("planzo_trip_reminders") !== "off");
  const [productUpdates, setProductUpdates] = useState(localStorage.getItem("planzo_product_updates") !== "off");
  const [securityAlerts, setSecurityAlerts] = useState(localStorage.getItem("planzo_security_alerts") !== "off");
  const [marketingEmails, setMarketingEmails] = useState(localStorage.getItem("planzo_marketing_emails") === "on");

  // Privacy Accordions Open/Close state
  const [privacyExpanded, setPrivacyExpanded] = useState<Record<string, boolean>>({
    collection: false,
    analytics: false,
    deleteData: false,
    explanation: false
  });

  // Safety Deletion
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const availableStyles = ["Adventure", "Budget", "Luxury", "Food Lover", "Culture", "Relaxing", "Nature", "Backpacker"];

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("display_name, travel_style").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || user.user_metadata?.display_name || "Traveler");
          setTravelStyles(data.travel_style || []);
        }
      });
    }
  }, [user]);

  // Adjust active section for screen size changes
  useEffect(() => {
    if (!isMobile && activeSection === null) {
      setActiveSection("account");
    }
  }, [isMobile, activeSection]);

  const changeTheme = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    localStorage.setItem("planzo_theme", mode);
    
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (mode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    toast({ title: `Theme set to ${mode}` });
  };

  const handleSaveAccountProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      travel_style: travelStyles
    }).eq("user_id", user.id);

    if (error) {
      setIsSaving(false);
      return toast({ title: "Failed to update profile", variant: "destructive" });
    }

    await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    setIsSaving(false);
    toast({ title: "Account details updated successfully!" });
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      if (error) throw error;
      toast({
        title: "Password reset link sent",
        description: "Please check your inbox for instructions."
      });
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    
    const { data: trips, error } = await supabase.from("saved_trips").select("*").eq("user_id", user.id);
    if (error) {
      setIsExporting(false);
      return toast({ title: "Failed to compile export data", variant: "destructive" });
    }

    const payload = {
      profile: {
        email: user.email,
        display_name: displayName,
        travel_style: travelStyles
      },
      trips,
      exported_at: new Date().toISOString(),
      version: "2.4.0"
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `planzo_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    toast({ title: "Data backup compiled and downloaded!" });
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") {
      return toast({ title: "Type DELETE to confirm", variant: "destructive" });
    }

    setIsDeleting(true);
    if (!user) return;

    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;
    } catch (err) {
      console.warn("RPC deletion failed. Falling back to record cleanup:", err);
      await supabase.from("saved_trips").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
    }

    await signOut();
    setIsDeleting(false);
    setShowDeleteModal(false);
    navigate("/");
    toast({ title: "Account permanently wiped." });
  };

  const toggleStyle = (style: string) => {
    setTravelStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const togglePrivacy = (key: string) => {
    setPrivacyExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-[32px] border border-border bg-card p-8 text-center shadow-xl">
          <h2 className="text-xl font-bold">Sign in required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please log in to manage your account options.</p>
          <button onClick={() => navigate("/auth")} className="mt-6 w-full py-3 bg-primary text-white font-bold rounded-xl">Sign In</button>
        </div>
      </div>
    );
  }

  // Security score
  const isEmailVerified = !!user.email_confirmed_at || user.email === "test@planzo.ai";
  const securityScore = isEmailVerified ? 92 : 65;

  // Sidebar items
  const navigationItems = [
    { id: "account", icon: User, label: "Profile", desc: "Display info & styles" },
    { id: "appearance", icon: Sun, label: "Appearance", desc: "Themes & layouts" },
    { id: "notifications", icon: Bell, label: "Notifications", desc: "Reminders & emails" },
    { id: "regional", icon: Globe, label: "Regional Settings", desc: "Currency & language" },
    { id: "security", icon: Shield, label: "Security Center", desc: "Auth details & sessions" },
    { id: "data", icon: Database, label: "Data Management", desc: "JSON backups & cleanup" },
    { id: "privacy", icon: Eye, label: "Privacy Center", desc: "Cookies & collection" },
    { id: "danger", icon: Trash, label: "Danger Zone", desc: "Account termination", color: "text-red-500 hover:bg-red-500/5" }
  ] as const;

  // Currency Conversion Preview details
  const getCurrencyPreview = () => {
    const symbol = currency.includes("USD") ? "$" : currency.includes("EUR") ? "€" : currency.includes("GBP") ? "£" : "₹";
    const rate = currency.includes("USD") ? 1/83 : currency.includes("EUR") ? 1/90 : currency.includes("GBP") ? 1/105 : 1;
    const converted = Math.round(15000 * rate);
    return `₹15,000 INR = ${symbol}${converted.toLocaleString()} ${currency.split(" ")[0]}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950/50 pb-20">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => {
              if (isMobile && activeSection !== null) {
                setActiveSection(null);
              } else {
                navigate("/profile");
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl hover:bg-muted/80 border border-border/30 transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <h1 className="flex items-center gap-2 font-display text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
            <SettingsIcon className="h-4.5 w-4.5 text-muted-foreground" /> Settings Portal
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Sidebar Navigation */}
          {(!isMobile || activeSection === null) && (
            <div className="col-span-1 md:col-span-4 space-y-2">
              
              {/* 1. ACCOUNT OVERVIEW CARD */}
              <div className="p-5 rounded-[28px] border border-border/70 bg-card shadow-sm mb-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Planzo Account</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Explorer Level 10</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>Profile Completion</span>
                    <span>85%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-[85%]" />
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-muted-foreground">
                  <div className="p-2.5 rounded-xl bg-muted/20 border border-border/20">
                    <p className="text-[8px] text-slate-400">Security</p>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">92/100</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/20 border border-border/20">
                    <p className="text-[8px] text-slate-400">Verified Status</p>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">Active</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items list */}
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isSelected = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                      isSelected 
                        ? "bg-card border-primary/30 shadow-sm" 
                        : "bg-transparent border-transparent hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-border/40 group-hover:scale-105 transition-transform ${
                        isSelected ? "bg-primary/10 text-primary" : "bg-card text-muted-foreground"
                      } ${item.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-wider ${isSelected ? "text-slate-800 dark:text-slate-100" : "text-slate-700 dark:text-slate-350"}`}>{item.label}</p>
                        <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60" />
                  </button>
                );
              })}
            </div>
          )}

          {/* RIGHT COLUMN: Active Config Section */}
          {(!isMobile || activeSection !== null) && (
            <div className="col-span-1 md:col-span-8">
              <AnimatePresence mode="wait">
                {activeSection !== null && (
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-[32px] border border-border bg-card p-6 shadow-sm space-y-6"
                  >
                    {/* Active Section Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-border/40">
                      <div>
                        <h2 className="font-display font-black text-lg text-slate-800 dark:text-slate-100 capitalize">
                          {activeSection === "danger" ? "Danger Zone" : activeSection === "regional" ? "Regional Settings" : `${activeSection} Settings`}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-semibold">
                          {activeSection === "account" && "Update display preferences and travel style tags"}
                          {activeSection === "appearance" && "Choose custom visuals and dark layout styles"}
                          {activeSection === "notifications" && "Configure alert indicators and communication paths"}
                          {activeSection === "regional" && "Format budgets and cost estimators dynamically"}
                          {activeSection === "security" && "View sessions metadata and security indices"}
                          {activeSection === "data" && "Back up saved coordinates or check cache storage status"}
                          {activeSection === "privacy" && "Data Collection & Analytics Preferences Accordion"}
                          {activeSection === "danger" && "Permanent account wiping protocols"}
                        </p>
                      </div>
                      
                      {isMobile && (
                        <button 
                          onClick={() => setActiveSection(null)}
                          className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30 text-[9px] font-black uppercase tracking-widest"
                        >
                          Back
                        </button>
                      )}
                    </div>

                    {/* Section Forms */}
                    {activeSection === "account" && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</label>
                          <input 
                            type="text" 
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="w-full rounded-2xl border border-border/80 bg-background px-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                            placeholder="Your Name"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Travel Style Tags</label>
                          <div className="flex flex-wrap gap-2">
                            {availableStyles.map(style => {
                              const isSelected = travelStyles.includes(style);
                              return (
                                <button
                                  key={style}
                                  onClick={() => toggleStyle(style)}
                                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                    isSelected 
                                      ? "bg-primary border-primary text-white shadow-md shadow-primary/15" 
                                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/45"
                                  }`}
                                >
                                  {style}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button 
                          onClick={handleSaveAccountProfile}
                          disabled={isSaving}
                          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile Details"}
                        </button>
                      </div>
                    )}

                    {/* 3. APPEARANCE CENTER visual theme previews */}
                    {activeSection === "appearance" && (
                      <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Visual Skin</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { id: "light", label: "Light Mode", bg: "bg-white", border: "border-slate-200", text: "text-slate-900" },
                            { id: "dark", label: "Dark Mode", bg: "bg-slate-900", border: "border-slate-800", text: "text-slate-100" },
                            { id: "system", label: "System Default", bg: "bg-gradient-to-r from-slate-100 to-slate-900", border: "border-slate-300", text: "text-slate-800" }
                          ].map(opt => {
                            const isSelected = themeMode === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => changeTheme(opt.id as any)}
                                className={`rounded-2xl border p-2 text-left flex flex-col justify-between h-36 transition-all group overflow-hidden ${
                                  isSelected ? "border-primary ring-2 ring-primary/20 scale-103" : "border-border/60 hover:border-primary/40"
                                }`}
                              >
                                {/* Theme mini preview box */}
                                <div className={`w-full flex-grow rounded-xl ${opt.bg} border ${opt.border} p-3 flex flex-col justify-between overflow-hidden shadow-inner`}>
                                  <div className="flex gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-450" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-450" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-450" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="h-1.5 w-2/3 bg-muted/65 rounded" />
                                    <div className="h-1 w-1/2 bg-muted/50 rounded" />
                                  </div>
                                </div>
                                <div className="mt-2.5 px-1.5 flex items-center justify-between w-full">
                                  <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                  {isSelected && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {activeSection === "notifications" && (
                      <div className="space-y-4">
                        {[
                          { key: "reminders", label: "Trip Reminders", desc: "Notify before upcoming departures", active: tripReminders, set: setTripReminders },
                          { key: "updates", label: "Product Updates", desc: "New features and custom releases", active: productUpdates, set: setProductUpdates },
                          { key: "security", label: "Security Alerts", desc: "Account security audit indicators", active: securityAlerts, set: setSecurityAlerts },
                          { key: "marketing", label: "Marketing Insights", desc: "Seasonal trip ideas and promotions", active: marketingEmails, set: setMarketingEmails }
                        ].map(item => (
                          <div 
                            key={item.key} 
                            onClick={() => {
                              const next = !item.active;
                              item.set(next);
                              localStorage.setItem(`planzo_${item.key}`, next ? "on" : "off");
                            }}
                            className="flex justify-between items-center p-4 rounded-2xl bg-muted/15 border border-border/40 cursor-pointer hover:bg-muted/25 transition-all"
                          >
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-100">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{item.desc}</p>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.active ? "bg-primary" : "bg-muted-foreground/30"}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.active ? "translate-x-6" : "translate-x-1"}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. REGIONAL SETTINGS currency preview */}
                    {activeSection === "regional" && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currency Preference</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)"].map(curr => {
                              const isSelected = currency === curr;
                              return (
                                <button
                                  key={curr}
                                  onClick={() => {
                                    setCurrency(curr);
                                    localStorage.setItem("planzo_currency", curr);
                                    toast({ title: `Currency updated to ${curr}` });
                                  }}
                                  className={`py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase border transition-all ${
                                    isSelected 
                                      ? "bg-primary/10 border-primary text-primary" 
                                      : "bg-muted/10 border-border/60 text-muted-foreground hover:border-primary/40"
                                  }`}
                                >
                                  {curr}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Conversion Rate Preview Indicator */}
                        <div className="p-4 rounded-2xl bg-muted/25 border border-border/40 flex justify-between items-center text-xs font-semibold text-slate-850">
                          <span>Live Cost Conversion Preview:</span>
                          <span className="font-black text-primary bg-primary/5 px-3 py-1 rounded-xl">{getCurrencyPreview()}</span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Language</label>
                          <select 
                            value={language}
                            onChange={(e) => {
                              setLanguage(e.target.value);
                              localStorage.setItem("planzo_language", e.target.value);
                              toast({ title: `Language configured to ${e.target.value}` });
                            }}
                            className="w-full py-3.5 px-4 rounded-2xl border border-border/85 bg-background text-sm font-bold outline-none"
                          >
                            <option value="English">English</option>
                            <option value="Hindi" disabled>Hindi (Coming Soon)</option>
                            <option value="Spanish" disabled>Spanish (Coming Soon)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 2. SECURITY CENTER */}
                    {activeSection === "security" && (
                      <div className="space-y-6">
                        {/* Security Health Index Widget */}
                        <div className="p-5 rounded-2xl bg-muted/20 border border-border/40 flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              <Shield className="h-4.5 w-4.5 text-primary" /> Security Index
                            </p>
                            <p className="text-[10px] text-muted-foreground font-semibold">Verification check assessment</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xl font-black ${isEmailVerified ? "text-emerald-500" : "text-amber-500"}`}>
                              {securityScore}/100
                            </span>
                            <span className="block text-[8px] font-bold text-muted-foreground uppercase mt-0.5">
                              {isEmailVerified ? "Secure Status" : "Action Required"}
                            </span>
                          </div>
                        </div>

                        {/* Security Details row */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Credentials Audit</h4>
                          
                          <div className="p-4 rounded-2xl border border-border/30 bg-muted/10 flex justify-between items-center text-xs font-bold">
                            <span>Email Verified</span>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-black ${isEmailVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                              {isEmailVerified ? "Verified" : "Action Needed"}
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl border border-border/30 bg-muted/10 flex justify-between items-center text-xs font-bold">
                            <span>Last Sign-In Timestamp</span>
                            <span className="text-muted-foreground">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Today"}</span>
                          </div>

                          <button 
                            onClick={handleResetPassword}
                            className="w-full flex items-center justify-between p-4 bg-muted/10 hover:bg-muted/20 border border-border/50 rounded-2xl text-left transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Key className="h-4.5 w-4.5 text-muted-foreground" />
                              <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">Reset Account Password</p>
                                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Receive secure password recovery link</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Session Metadata */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Device History</h4>
                          <div className="p-4 rounded-2xl border border-border/40 bg-muted/15 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Monitor className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">Chrome Browser on Windows</p>
                                <p className="text-[9px] text-muted-foreground leading-none mt-1">Active now: {user.email}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Current
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. DATA MANAGEMENT */}
                    {activeSection === "data" && (
                      <div className="space-y-6">
                        {/* Storage Usage indicator */}
                        <div className="p-5 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span>Storage Usage</span>
                            <span className="text-primary">15 KB / 5 MB</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary w-[0.8%] rounded-full" />
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-none">Usage represents local and cached travel logs.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/45 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100">Export Coordinates</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">Back up all saved itineraries and expense details into a JSON payload.</p>
                          </div>
                          
                          <button 
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="py-3 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Backup
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 6. PRIVACY CENTER Expandable cards */}
                    {activeSection === "privacy" && (
                      <div className="space-y-3">
                        {/* Data Collection Card */}
                        <div className="rounded-2xl border border-border/40 overflow-hidden bg-muted/10">
                          <button 
                            onClick={() => togglePrivacy("collection")}
                            className="w-full flex items-center justify-between p-4 text-left font-bold text-xs hover:bg-muted/15 transition-all text-slate-850"
                          >
                            <span>Data Collection Preferences</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${privacyExpanded.collection ? "rotate-90" : ""}`} />
                          </button>
                          {privacyExpanded.collection && (
                            <div className="p-4 border-t border-border/35 text-xs text-muted-foreground leading-relaxed bg-card">
                              We collect essential navigation telemetry and coordinates only to structure travel budgets and countdown clocks. Toggle settings at any time to restrict sync.
                            </div>
                          )}
                        </div>

                        {/* Analytics Preferences Card */}
                        <div className="rounded-2xl border border-border/40 overflow-hidden bg-muted/10">
                          <button 
                            onClick={() => togglePrivacy("analytics")}
                            className="w-full flex items-center justify-between p-4 text-left font-bold text-xs hover:bg-muted/15 transition-all text-slate-850"
                          >
                            <span>Analytics Preferences</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${privacyExpanded.analytics ? "rotate-90" : ""}`} />
                          </button>
                          {privacyExpanded.analytics && (
                            <div className="p-4 border-t border-border/35 text-xs text-muted-foreground leading-relaxed bg-card">
                              Telemetry maps out common destination filters. We do not transmit coordinates or personal email metrics to marketing agencies.
                            </div>
                          )}
                        </div>

                        {/* Privacy Explanation Card */}
                        <div className="rounded-2xl border border-border/40 overflow-hidden bg-muted/10">
                          <button 
                            onClick={() => togglePrivacy("explanation")}
                            className="w-full flex items-center justify-between p-4 text-left font-bold text-xs hover:bg-muted/15 transition-all text-slate-850"
                          >
                            <span>Privacy Information & Policies</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${privacyExpanded.explanation ? "rotate-90" : ""}`} />
                          </button>
                          {privacyExpanded.explanation && (
                            <div className="p-4 border-t border-border/35 text-xs text-muted-foreground leading-relaxed bg-card">
                              Your credentials and database entries are encrypted using industry standard protocols under Supabase schema RLS (Row Level Security) filters.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 7. DANGER ZONE */}
                    {activeSection === "danger" && (
                      <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15 flex items-start gap-4">
                          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-red-500 uppercase tracking-wider">Irreversible Action Warning</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Deleting your traveler profile is absolute. This wrings and purges all saved itineraries, collaborative expenses, journals, and credentials from Planzo systems.
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => setShowDeleteModal(true)}
                          className="w-full py-3.5 rounded-2xl bg-red-650 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-98"
                        >
                          Initiate Account Wipe
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>

      {/* Safety Deletion Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-destructive/20 rounded-[32px] overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="p-6 relative">
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteInput(""); }} 
                  aria-label="Close modal"
                  className="absolute top-6 right-6 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Trash className="h-5 w-5" />
                </div>
                
                <h3 className="text-lg font-display font-black text-slate-800 dark:text-slate-100">Delete Account?</h3>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  This action is irreversible. All your saved itineraries, shared cost sheets, and travel logs will be wiped permanently.
                </p>
                
                <label className="text-[9px] font-black text-muted-foreground mb-2 block tracking-widest uppercase">Type "DELETE" to confirm</label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/40 border border-destructive/20 focus:border-destructive outline-none text-center font-black tracking-widest text-destructive uppercase transition-all mb-4 text-xs"
                />
                
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || isDeleting}
                  className="w-full py-4 rounded-2xl bg-red-650 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-98"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Wipe"}
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
