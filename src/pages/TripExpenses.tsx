import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, Plus, Trash2, Hotel, Utensils, Camera, MapPin, ShoppingBag, MoreHorizontal,
  Loader2, TrendingUp, Sparkles, IndianRupee, PieChart, Users, ArrowRightLeft, ThumbsUp, ThumbsDown, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import type { ExpenseCoaching, TripPlan } from "@/types/trip-plan";
import { toActorName, toVoterKey, type TripCollaborator, type TripExpenseSplit, type TripVote } from "@/lib/trip-features";

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
  const [collaborators, setCollaborators] = useState<TripCollaborator[]>([]);
  const [splits, setSplits] = useState<TripExpenseSplit[]>([]);
  const [expenseVotes, setExpenseVotes] = useState<TripVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [coaching, setCoaching] = useState<ExpenseCoaching | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachCooldown, setCoachCooldown] = useState(false);
  const [coachCooldownSeconds, setCoachCooldownSeconds] = useState(0);
  const [softCaps, setSoftCaps] = useState<Record<string, number>>({});

  // New expense form
  const [newCategory, setNewCategory] = useState("food");
  const [newAmount, setNewAmount] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [payerName, setPayerName] = useState("");
  const [adding, setAdding] = useState(false);
  const actorName = toActorName(
    (user?.user_metadata?.display_name as string | undefined) || user?.email?.split("@")[0],
    user?.email
  );
  const actorKey = toVoterKey(user?.id, actorName, user?.email);

  const buildFallbackCoaching = (
    title: string,
    plannedTotal: number,
    spentTotal: number,
    actualByCategory: Record<string, number>,
    plannedByCategory: Record<string, number>
  ): ExpenseCoaching => {
    const safePlanned = Math.max(plannedTotal, 1);
    const variance = Math.abs(spentTotal - plannedTotal) / safePlanned;
    const overallScore = Math.max(35, Math.min(98, Math.round(100 - variance * 100)));
    const grade = overallScore >= 90 ? "A+" : overallScore >= 80 ? "A" : overallScore >= 70 ? "B+" : overallScore >= 60 ? "B" : "C";
    const scoreLabel =
      spentTotal <= plannedTotal
        ? "Good Budget Discipline"
        : spentTotal <= plannedTotal * 1.1
          ? "Slight Overspend"
          : "Budget Needs Tuning";
    const savingsValue = Math.max(0, plannedTotal - spentTotal);

    const categoryBreakdown = Object.entries(actualByCategory).map(([category, actual]) => {
      const planned = plannedByCategory[category] || 0;
      const over = actual > planned;
      return {
        category,
        planned,
        actual,
        verdict: over ? "over" : "under",
        tip: over
          ? "Try setting a daily cap for this category and track every spend in real time."
          : "Great control here - keep the same habit on your next trip.",
      };
    });

    return {
      overallScore,
      scoreLabel,
      totalPlanned: `₹${plannedTotal.toLocaleString("en-IN")}`,
      totalSpent: `₹${spentTotal.toLocaleString("en-IN")}`,
      savings: `₹${savingsValue.toLocaleString("en-IN")}`,
      budgetGrade: grade,
      categoryBreakdown,
      topInsights: [
        `${title}: you used ${Math.round((spentTotal / safePlanned) * 100)}% of your planned budget.`,
        spentTotal > plannedTotal
          ? `Overspend is ₹${(spentTotal - plannedTotal).toLocaleString("en-IN")}; focus on food/transport optimizations next time.`
          : `You stayed within budget by ₹${(plannedTotal - spentTotal).toLocaleString("en-IN")}.`,
      ],
      nextTripTips: [
        "Keep a 10% emergency buffer separate from your core budget.",
        "Book intercity transport early and track meal spend daily.",
      ],
    };
  };

  useEffect(() => {
    setPayerName(actorName);
  }, [actorName]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const [tripRes, expRes, collaboratorsRes, splitsRes, votesRes] = await Promise.all([
        supabase.from("saved_trips").select("*").eq("id", tripId).maybeSingle(),
        supabase.from("trip_expenses").select("*").eq("trip_id", tripId).order("expense_date", { ascending: false }),
        supabase.from("trip_collaborators").select("*").eq("trip_id", tripId).order("created_at", { ascending: true }),
        supabase.from("trip_expense_splits").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }),
        supabase.from("trip_votes").select("*").eq("trip_id", tripId).eq("subject_type", "expense").order("created_at", { ascending: false }),
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

      if (collaboratorsRes.data) {
        setCollaborators(collaboratorsRes.data);
      }

      if (splitsRes.data) {
        setSplits(splitsRes.data);
      }

      if (votesRes.data) {
        setExpenseVotes(votesRes.data);
      }

      setLoading(false);
    };

    void loadData();
  }, [navigate, tripId, user]);

  useEffect(() => {
    if (!tripId) return;
    try {
      const caps = JSON.parse(localStorage.getItem(`planzo_trip_caps_${tripId}`) || "{}");
      setSoftCaps(caps);
    } catch {
      setSoftCaps({});
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;

    const channel = supabase.channel(`trip-expense-social-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_expenses", filter: `trip_id=eq.${tripId}` }, async () => {
        const { data } = await supabase.from("trip_expenses").select("*").eq("trip_id", tripId).order("expense_date", { ascending: false });
        if (data) setExpenses(data);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_expense_splits", filter: `trip_id=eq.${tripId}` }, async () => {
        const { data } = await supabase.from("trip_expense_splits").select("*").eq("trip_id", tripId).order("created_at", { ascending: false });
        if (data) setSplits(data);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_votes", filter: `trip_id=eq.${tripId}` }, async () => {
        const { data } = await supabase.from("trip_votes").select("*").eq("trip_id", tripId).eq("subject_type", "expense").order("created_at", { ascending: false });
        if (data) setExpenseVotes(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const setCategorySoftCap = (category: string, amount: number) => {
    if (!tripId || amount <= 0) return;
    const next = { ...softCaps, [category]: Math.round(amount) };
    setSoftCaps(next);
    localStorage.setItem(`planzo_trip_caps_${tripId}`, JSON.stringify(next));
    toast({ title: "Soft cap saved", description: `${categoryConfig[category]?.label || category}: ₹${Math.round(amount).toLocaleString("en-IN")}` });
  };

  const addExpense = async () => {
    if (!newAmount || !user || !tripId) return;
    setAdding(true);
    const { data, error } = await supabase.from("trip_expenses").insert({
      trip_id: tripId,
      user_id: user.id,
      category: newCategory,
      amount: parseFloat(newAmount),
      description: newDesc || undefined,
      expense_date: newDate,
      payer_name: payerName || actorName,
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

  const createEqualSplit = async (expense: TripExpenseRow) => {
    if (!tripId) return;
    const participants = collaborators.length
      ? collaborators.map((member) => ({ name: member.display_name, email: member.email }))
      : [{ name: expense.payer_name || actorName, email: user?.email || null }];

    if (!participants.length) return;

    await supabase.from("trip_expense_splits").delete().eq("expense_id", expense.id);
    const splitAmount = Number(expense.amount) / participants.length;
    const payload = participants.map((member, index) => ({
      trip_id: tripId,
      expense_id: expense.id,
      member_name: member.name,
      member_email: member.email || null,
      amount_owed: Number((index === participants.length - 1
        ? Number(expense.amount) - splitAmount * (participants.length - 1)
        : splitAmount).toFixed(2)),
      settled: false,
    }));

    const { error } = await supabase.from("trip_expense_splits").insert(payload);
    if (error) {
      toast({ title: "Split failed", description: error.message, variant: "destructive" });
      return;
    }

    const { data } = await supabase.from("trip_expense_splits").select("*").eq("trip_id", tripId).order("created_at", { ascending: false });
    if (data) setSplits(data);
    toast({ title: "Split created", description: `${expense.description || categoryConfig[expense.category]?.label || "Expense"} was split equally.` });
  };

  const toggleSplitSettlement = async (splitId: string, nextSettled: boolean) => {
    const { error } = await supabase.from("trip_expense_splits").update({ settled: nextSettled }).eq("id", splitId);
    if (error) {
      toast({ title: "Settlement update failed", description: error.message, variant: "destructive" });
      return;
    }
    setSplits((prev) => prev.map((split) => split.id === splitId ? { ...split, settled: nextSettled } : split));
  };

  const voteOnExpense = async (expense: TripExpenseRow, voteValue: 1 | -1) => {
    if (!tripId) return;
    const { error } = await supabase.from("trip_votes").upsert({
      trip_id: tripId,
      subject_type: "expense",
      subject_key: expense.id,
      subject_label: expense.description || categoryConfig[expense.category]?.label || "Expense",
      voter_key: actorKey,
      voter_name: actorName,
      user_id: user?.id || null,
      vote_value: voteValue,
    }, { onConflict: "trip_id,subject_type,subject_key,voter_key" });

    if (error) {
      toast({ title: "Vote failed", description: error.message, variant: "destructive" });
      return;
    }

    const { data } = await supabase.from("trip_votes").select("*").eq("trip_id", tripId).eq("subject_type", "expense").order("created_at", { ascending: false });
    if (data) setExpenseVotes(data);
  };

  const getCoaching = async () => {
    if (!trip || coachCooldown) return;
    setCoachLoading(true);
    setCoaching(null);

    const plannedTotal =
      Number(trip.plan_data?.budgetHealth?.userBudget) ||
      Number(trip.budget) ||
      Number(trip.plan_data?.budgetHealth?.totalEstimated) ||
      0;

    const plannedByCategory: Record<string, number> = {
      hotels: Number(trip.plan_data?.budgetBreakdown?.accommodation) || 0,
      food: Number(trip.plan_data?.budgetBreakdown?.food) || 0,
      activities: Number(trip.plan_data?.budgetBreakdown?.activities) || 0,
      transport: Number(trip.plan_data?.budgetBreakdown?.transport) || 0,
      shopping: Number(trip.plan_data?.budgetBreakdown?.miscellaneous) || 0,
    };

    const actualByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      actualByCategory[e.category] = (actualByCategory[e.category] || 0) + Number(e.amount);
    });

    const spentTotal = Object.values(actualByCategory).reduce((acc, n) => acc + n, 0);

    const { data, error } = await supabase.functions.invoke("post-trip-coach", {
      body: {
        plannedBudget: { total: plannedTotal, byCategory: plannedByCategory },
        actualExpenses: actualByCategory,
        tripTitle: trip.title,
        mood: trip.mood,
        days: trip.days,
      },
    });

    setCoachLoading(false);
    if (error || !data) {
      setCoaching(buildFallbackCoaching(trip.title || "Trip", plannedTotal, spentTotal, actualByCategory, plannedByCategory));
      toast({
        title: "AI Coach fallback",
        description: error?.message || "Live coach unavailable, showing local coaching analysis.",
      });
    } else {
      setCoaching(data);
      // 60-second cooldown to prevent API spam
      setCoachCooldown(true);
      let remaining = 60;
      setCoachCooldownSeconds(remaining);
      const interval = setInterval(() => {
        remaining -= 1;
        setCoachCooldownSeconds(remaining);
        if (remaining <= 0) { clearInterval(interval); setCoachCooldown(false); }
      }, 1000);
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const plannedBudget = trip?.plan_data?.budgetHealth?.userBudget || trip?.budget || 0;
  const dailySpend = expenses
    .slice()
    .sort((a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime())
    .reduce<Array<{ date: string; total: number }>>((acc, exp) => {
      const key = exp.expense_date;
      const last = acc[acc.length - 1];
      if (last && last.date === key) {
        last.total += Number(exp.amount);
        return acc;
      }
      acc.push({ date: key, total: Number(exp.amount) });
      return acc;
    }, []);
  const maxDaily = Math.max(1, ...dailySpend.map((d) => d.total));
  const splitSummary = splits.reduce<Record<string, { owed: number; settled: number }>>((acc, split) => {
    const current = acc[split.member_name] || { owed: 0, settled: 0 };
    current.owed += Number(split.amount_owed);
    if (split.settled) current.settled += Number(split.amount_owed);
    acc[split.member_name] = current;
    return acc;
  }, {});
  const expenseVoteSummary = expenseVotes.reduce<Record<string, { score: number; upvotes: number; downvotes: number }>>((acc, vote) => {
    const current = acc[vote.subject_key] || { score: 0, upvotes: 0, downvotes: 0 };
    current.score += vote.vote_value;
    if (vote.vote_value > 0) current.upvotes += 1;
    if (vote.vote_value < 0) current.downvotes += 1;
    acc[vote.subject_key] = current;
    return acc;
  }, {});

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
          {plannedBudget > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Planned Budget</p>
              <p className="text-lg font-semibold text-primary">₹{Number(plannedBudget).toLocaleString("en-IN")}</p>
              {totalSpent > Number(plannedBudget) ? (
                <p className="text-[10px] text-destructive font-semibold">Over by ₹{(totalSpent - Number(plannedBudget)).toLocaleString("en-IN")}</p>
              ) : (
                <p className="text-[10px] text-emerald-500 font-semibold">₹{(Number(plannedBudget) - totalSpent).toLocaleString("en-IN")} remaining</p>
              )}
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
        {Object.keys(softCaps).length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Soft caps</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(softCaps).map(([category, amount]) => (
                <span key={category} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                  {categoryConfig[category]?.label || category}: ₹{amount.toLocaleString("en-IN")}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Daily trend */}
      {dailySpend.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-4 p-4 rounded-2xl bg-card shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" /> Daily Spend Trend
          </h3>
          <div className="space-y-2">
            {dailySpend.slice(-7).map((d) => (
              <div key={d.date} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-20">{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-hero rounded-full" style={{ width: `${Math.max(8, (d.total / maxDaily) * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-20 text-right">₹{d.total.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phase 2</p>
              <h3 className="font-display font-semibold text-foreground text-sm">Shared expense splitting</h3>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {Object.keys(splitSummary).length === 0 ? (
              <p className="text-sm text-muted-foreground">Create an expense, then split it equally across your trip members.</p>
            ) : (
              Object.entries(splitSummary).map(([member, totals]) => (
                <div key={member} className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{member}</p>
                    <p className="text-sm font-bold text-primary">₹{totals.owed.toLocaleString("en-IN")}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Settled ₹{totals.settled.toLocaleString("en-IN")} · Remaining ₹{Math.max(0, totals.owed - totals.settled).toLocaleString("en-IN")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fairness Pulse</p>
              <h3 className="font-display font-semibold text-foreground text-sm">Group vote on spends</h3>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Votes will appear once the group starts logging expenses.</p>
            ) : (
              expenses.slice(0, 4).map((expense) => {
                const summary = expenseVoteSummary[expense.id] || { score: 0, upvotes: 0, downvotes: 0 };
                return (
                  <div key={`expense-vote-summary-${expense.id}`} className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{expense.description || categoryConfig[expense.category]?.label}</p>
                      <p className="text-xs font-bold text-muted-foreground">Score {summary.score}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{summary.upvotes} approve · {summary.downvotes} rethink</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* Add Expense Button */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 flex gap-3">
        <button onClick={() => setShowAdd(!showAdd)} className="flex-1 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
        <button
          onClick={getCoaching}
          disabled={coachLoading || expenses.length === 0 || coachCooldown}
          className="px-4 py-3 rounded-xl bg-card shadow-card text-foreground font-semibold text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors disabled:opacity-50"
          title={coachCooldown ? `Available in ${coachCooldownSeconds}s` : "Get AI spending analysis"}
        >
          {coachLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
          {coachCooldown ? `${coachCooldownSeconds}s` : "AI Coach"}
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
            <div className="flex flex-col gap-1 mt-3">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Date</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none" />
            </div>
            <div className="flex flex-col gap-1 mt-3">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Paid By</label>
              <input type="text" value={payerName} onChange={(e) => setPayerName(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none" placeholder="Who paid for this expense?" />
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
          const relatedSplits = splits.filter((split) => split.expense_id === exp.id);
          const voteSummary = expenseVoteSummary[exp.id] || { score: 0, upvotes: 0, downvotes: 0 };
          return (
            <motion.div key={exp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-xl bg-card shadow-card">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{exp.description || cfg.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {cfg.label} · {new Date(exp.expense_date).toLocaleDateString()} · Paid by {exp.payer_name || "Traveler"}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground">₹{Number(exp.amount).toLocaleString("en-IN")}</span>
                <button onClick={() => deleteExpense(exp.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => createEqualSplit(exp)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  Split equally
                </button>
                <button
                  onClick={() => voteOnExpense(exp, 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Worth it
                </button>
                <button
                  onClick={() => voteOnExpense(exp, -1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-700 dark:text-rose-300"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Too much
                </button>
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                  Score {voteSummary.score} · {voteSummary.upvotes}/{voteSummary.downvotes}
                </span>
              </div>

              {relatedSplits.length > 0 && (
                <div className="mt-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Split status</p>
                  <div className="mt-2 space-y-2">
                    {relatedSplits.map((split) => (
                      <div key={split.id} className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{split.member_name}</p>
                          <p className="text-[10px] text-muted-foreground">₹{Number(split.amount_owed).toLocaleString("en-IN")}</p>
                        </div>
                        <button
                          onClick={() => toggleSplitSettlement(split.id, !split.settled)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold ${
                            split.settled
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {split.settled ? "Settled" : "Mark settled"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                        <button
                          onClick={() => setCategorySoftCap(cat.category, Number(cat.planned || 0))}
                          className="mt-2 px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Set soft cap from plan
                        </button>
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
