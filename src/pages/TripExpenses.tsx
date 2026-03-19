import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, Plus, Trash2, Hotel, Utensils, Camera, MapPin, ShoppingBag, MoreHorizontal,
  Loader2, TrendingUp, Sparkles, IndianRupee, PieChart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import type { ExpenseCoaching, TripPlan } from "@/types/trip-plan";

type SavedTripRow = Tables<"saved_trips">;
type TripExpenseRow = Tables<"trip_expenses">;

type SavedTripWithPlan = Omit<SavedTripRow, 'plan_data'> & {
  plan_data: TripPlan | null;
};

const categoryConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  hotels: { icon: Hotel, label: "Hotels", color: "text-blue-500" },
  food: { icon: Utensils, label: "Food", color: "text-orange-500" },
  activities: { icon: Camera, label: "Activities", color: "text-purple-500" },
  transport: { icon: MapPin, label: "Transport", color: "text-emerald-500" },
  shopping: { icon: ShoppingBag, label: "Shopping", color: "text-pink-500" },
  other: { icon: MoreHorizontal, label: "Other", color: "text-muted-foreground" },
};

const TripExpenses = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [trip, setTrip] = useState<SavedTripWithPlan | null>(null);
  const [expenses, setExpenses] = useState<TripExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [coaching, setCoaching] = useState<ExpenseCoaching | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // New expense form
  const [newCategory, setNewCategory] = useState("food");
  const [newAmount, setNewAmount] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const [tripRes, expRes] = await Promise.all([
        supabase.from("saved_trips").select("*").eq("id", tripId).maybeSingle(),
        supabase.from("trip_expenses").select("*").eq("trip_id", tripId).order("expense_date", { ascending: false }),
      ]);

      if (tripRes.data) {
        setTrip({
          ...tripRes.data,
          plan_data: (tripRes.data.plan_data as unknown as TripPlan | null) ?? null,
        });
      }

      if (expRes.data) {
        setExpenses(expRes.data);
      }

      setLoading(false);
    };

    void loadData();
  }, [navigate, tripId, user]);

  const addExpense = async () => {
    if (!newAmount || !user || !tripId) return;
    setAdding(true);
    const { data, error } = await supabase.from("trip_expenses").insert({
      trip_id: tripId,
      user_id: user.id,
      category: newCategory,
      amount: parseFloat(newAmount),
      description: newDesc || undefined,
    }).select().single();
    setAdding(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setExpenses((prev) => [data, ...prev]);
      setNewAmount(""); setNewDesc(""); setShowAdd(false);
      toast({ title: "Expense added!" });
    }
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("trip_expenses").delete().eq("id", id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const getCoaching = async () => {
    if (!trip) return;
    setCoachLoading(true);
    setCoaching(null);

    const plannedBudget = trip.plan_data?.budget || {};
    const actualByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      actualByCategory[e.category] = (actualByCategory[e.category] || 0) + Number(e.amount);
    });

    const { data, error } = await supabase.functions.invoke("post-trip-coach", {
      body: {
        plannedBudget,
        actualExpenses: actualByCategory,
        tripTitle: trip.title,
        mood: trip.mood,
        days: trip.days,
      },
    });

    setCoachLoading(false);
    if (error) {
      toast({ title: "Coach Error", description: "Could not get coaching tips.", variant: "destructive" });
    } else {
      setCoaching(data);
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!trip) {
    return <div className="px-5 py-6 text-center text-muted-foreground">Trip not found</div>;
  }

  return (
    <div className="px-5 md:container py-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button onClick={() => navigate("/profile")} className="h-9 w-9 rounded-xl bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">{trip.title}</h1>
          <p className="text-xs text-muted-foreground">{trip.mood} · {trip.days} days</p>
        </div>
      </motion.div>

      {/* Spending Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-4 p-4 rounded-2xl bg-card shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Spent</p>
            <p className="font-display text-2xl font-bold text-foreground flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
          {trip.plan_data?.budget?.total && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Planned</p>
              <p className="text-lg font-semibold text-primary">{trip.plan_data.budget.total}</p>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="mt-4 space-y-2">
          {Object.entries(categoryConfig).map(([key, cfg]) => {
            const total = expenses.filter((e) => e.category === key).reduce((s, e) => s + Number(e.amount), 0);
            if (total === 0) return null;
            const Icon = cfg.icon;
            const pct = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{cfg.label}</span>
                    <span className="font-semibold">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.6 }} className="h-full rounded-full gradient-hero" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Add Expense Button */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 flex gap-3">
        <button onClick={() => setShowAdd(!showAdd)} className="flex-1 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
        <button onClick={getCoaching} disabled={coachLoading || expenses.length === 0}
          className="px-4 py-3 rounded-xl bg-card shadow-card text-foreground font-semibold text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors disabled:opacity-50">
          {coachLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
          AI Coach
        </button>
      </motion.div>

      {/* Add Expense Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 p-4 rounded-2xl bg-card shadow-card overflow-hidden">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none">
                  {Object.entries(categoryConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Amount (₹)</label>
                <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none" placeholder="500" />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-3">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Description (optional)</label>
              <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none" placeholder="e.g. Biryani at Paradise" />
            </div>
            <button onClick={addExpense} disabled={adding || !newAmount} className="w-full mt-3 py-2.5 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm disabled:opacity-50">
              {adding ? "Adding..." : "Save Expense"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense List */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-4 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expense Log</h3>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No expenses yet. Start logging!</p>
        ) : expenses.map((exp) => {
          const cfg = categoryConfig[exp.category] || categoryConfig.other;
          const Icon = cfg.icon;
          return (
            <motion.div key={exp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
              <div className={`h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{exp.description || cfg.label}</p>
                <p className="text-[10px] text-muted-foreground">{cfg.label} · {new Date(exp.expense_date).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-bold text-foreground">₹{Number(exp.amount).toLocaleString("en-IN")}</span>
              <button onClick={() => deleteExpense(exp.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* AI Coaching Results */}
      <AnimatePresence>
        {coaching && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            {/* Score Card */}
            <div className="p-4 rounded-2xl bg-card shadow-card text-center">
              <div className="h-16 w-16 mx-auto rounded-full gradient-hero flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">{coaching.overallScore}</span>
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mt-3">{coaching.scoreLabel}</h3>
              <p className="text-sm text-muted-foreground mt-1">Grade: <span className="font-bold text-primary">{coaching.budgetGrade}</span></p>
              <div className="flex justify-center gap-6 mt-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Planned</p>
                  <p className="text-sm font-semibold">{coaching.totalPlanned}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Spent</p>
                  <p className="text-sm font-semibold">{coaching.totalSpent}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Saved</p>
                  <p className="text-sm font-semibold text-emerald-600">{coaching.savings}</p>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {coaching.categoryBreakdown?.length > 0 && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <PieChart className="h-4 w-4 text-primary" /> Category Analysis
                </h3>
                <div className="space-y-3">
                  {coaching.categoryBreakdown.map((cat, i: number) => {
                    const cfg = categoryConfig[cat.category] || categoryConfig.other;
                    const Icon = cfg.icon;
                    const isOver = cat.verdict === "over";
                    return (
                      <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                          <span className="text-sm font-semibold text-foreground capitalize">{cat.category}</span>
                          <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isOver ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {isOver ? "Over Budget" : "Under Budget"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">₹{cat.planned?.toLocaleString("en-IN")} planned → ₹{cat.actual?.toLocaleString("en-IN")} spent</p>
                        <p className="text-xs text-primary mt-1 italic">💡 {cat.tip}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Insights */}
            {coaching.topInsights?.length > 0 && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" /> Key Insights
                </h3>
                <div className="space-y-2">
                  {coaching.topInsights.map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Trip Tips */}
            {coaching.nextTripTips?.length > 0 && (
              <div className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" /> Tips for Next Trip
                </h3>
                <div className="space-y-2">
                  {coaching.nextTripTips.map((tip: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-emerald-600">✨</span>
                      <span>{tip}</span>
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

export default TripExpenses;
