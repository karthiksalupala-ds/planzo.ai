import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, CalendarDays, Rocket, Sparkles, Target, TrendingDown, TrendingUp, Users } from "lucide-react";
import type { TripPlan } from "@/types/trip-plan";

export type TwinTravelMode = "flight" | "train" | "bus";

export interface TripTwinScenario {
  id: string;
  name: string;
  tagline: string;
  score: number;
  scoreLabel: string;
  costEfficiency: number;
  timeEfficiency: number;
  experienceQuality: number;
  comfortRisk: number;
  projectedBudget: number;
  projectedSpend: number;
  targetDays: number;
  targetTravelers: number;
  recommendedMode: TwinTravelMode;
  tradeoffs: string[];
  regretCheck: string;
  nextStep: string;
}

interface TripTwinSimulatorProps {
  plan: TripPlan;
  budget: number;
  days: number;
  travelers: number;
  vibe: string;
  onApplyScenario: (scenario: TripTwinScenario) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const scoreLabel = (score: number) => {
  if (score >= 85) return "High confidence";
  if (score >= 70) return "Strong option";
  if (score >= 55) return "Viable with tradeoffs";
  return "Risky plan";
};

const modeFromArchetype = (key: "saver" | "balanced" | "premium"): TwinTravelMode => {
  if (key === "saver") return "train";
  if (key === "premium") return "flight";
  return "bus";
};

export default function TripTwinSimulator({
  plan,
  budget,
  days,
  travelers,
  vibe,
  onApplyScenario,
}: TripTwinSimulatorProps) {
  const [budgetShiftPct, setBudgetShiftPct] = useState(-10);
  const [dayShift, setDayShift] = useState(0);
  const [travelerDelta, setTravelerDelta] = useState(0);

  const scenarios = useMemo<TripTwinScenario[]>(() => {
    const baseBudget = Number(plan.budgetHealth?.userBudget || budget || 15000);
    const baseSpend = Number(plan.budgetHealth?.totalEstimated || baseBudget * 0.85);
    const baseDays = Math.max(1, days || plan.itinerary?.length || 3);
    const baseTravelers = Math.max(1, travelers || 1);

    const targetDays = clamp(baseDays + dayShift, 1, 14);
    const targetTravelers = clamp(baseTravelers + travelerDelta, 1, 12);
    const baseShiftBudget = Math.round(baseBudget * (1 + budgetShiftPct / 100));

    const archetypes = [
      {
        key: "saver" as const,
        name: "Scenario A: Lean Explorer",
        tagline: "Minimum spend, maximum essentials",
        spendFactor: 0.82,
        qualityBias: -8,
        comfortBias: -10,
      },
      {
        key: "balanced" as const,
        name: "Scenario B: Smart Balance",
        tagline: "Best value for money and flow",
        spendFactor: 1.0,
        qualityBias: 4,
        comfortBias: 2,
      },
      {
        key: "premium" as const,
        name: "Scenario C: Comfort+",
        tagline: "Higher comfort, lower friction",
        spendFactor: 1.22,
        qualityBias: 12,
        comfortBias: 15,
      },
    ];

    return archetypes.map((a, idx) => {
      const dayEffect = 1 + (targetDays - baseDays) * 0.1;
      const groupEffect = 1 + (targetTravelers - baseTravelers) * 0.04;
      const projectedBudget = Math.round(baseShiftBudget * a.spendFactor);
      const projectedSpend = Math.round(baseSpend * dayEffect * groupEffect * a.spendFactor);
      const budgetGap = projectedBudget - projectedSpend;

      const costEfficiency = clamp(100 - Math.max(0, projectedSpend - projectedBudget) / Math.max(projectedBudget, 1) * 120, 25, 98);
      const timeEfficiency = clamp(78 - (targetDays - baseDays) * 6 + (a.key === "premium" ? 8 : a.key === "saver" ? -3 : 2), 35, 96);
      const experienceQuality = clamp(74 + a.qualityBias + (targetDays > baseDays ? 6 : 0), 40, 99);
      const comfortRisk = clamp(68 + a.comfortBias + (a.key === "saver" ? -6 : 0), 35, 97);

      const score = Math.round(costEfficiency * 0.33 + timeEfficiency * 0.2 + experienceQuality * 0.28 + comfortRisk * 0.19);
      const recommendedMode = modeFromArchetype(a.key);

      const tradeoffs = [
        budgetGap >= 0
          ? `Potential savings buffer: Rs ${budgetGap.toLocaleString()}`
          : `Potential overshoot risk: Rs ${Math.abs(budgetGap).toLocaleString()}`,
        targetDays !== baseDays
          ? `Trip timeline changes from ${baseDays} to ${targetDays} days.`
          : `Trip duration stays at ${targetDays} days with tighter sequencing.`,
        recommendedMode === "flight"
          ? "Faster transfers, higher cost, better energy for activities."
          : recommendedMode === "train"
            ? "Lower cost and greener route, but longer transfer windows."
            : "Balanced transfer cost with moderate comfort and flexibility.",
      ];

      const regretCheck =
        a.key === "saver"
          ? "Likely regret: skipping one signature experience. Prevent it by protecting one premium activity slot."
          : a.key === "premium"
            ? "Likely regret: paying more than expected. Prevent it by capping premium spend per day."
            : "Likely regret: trying to do too much in one day. Prevent it by keeping one flex block daily.";

      return {
        id: `${a.key}-${idx}`,
        name: a.name,
        tagline: a.tagline,
        score,
        scoreLabel: scoreLabel(score),
        costEfficiency: Math.round(costEfficiency),
        timeEfficiency: Math.round(timeEfficiency),
        experienceQuality: Math.round(experienceQuality),
        comfortRisk: Math.round(comfortRisk),
        projectedBudget,
        projectedSpend,
        targetDays,
        targetTravelers,
        recommendedMode,
        tradeoffs,
        regretCheck,
        nextStep: "Apply this scenario and let Planzo auto-rebalance your itinerary + budget map.",
      };
    }).sort((x, y) => y.score - x.score);
  }, [budget, budgetShiftPct, dayShift, days, plan.budgetHealth?.totalEstimated, plan.budgetHealth?.userBudget, plan.itinerary?.length, travelerDelta, travelers]);

  return (
    <div className="rounded-[32px] bg-card border border-border/50 p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" /> AI Trip Twin Simulator
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Run instant what-if simulations and pick the best future for this trip.
          </p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          Beta Lab
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="text-xs font-bold text-muted-foreground">
          Budget shift: <span className="text-foreground">{budgetShiftPct}%</span>
          <input
            type="range"
            min={-35}
            max={35}
            value={budgetShiftPct}
            onChange={(e) => setBudgetShiftPct(Number(e.target.value))}
            className="w-full mt-2"
          />
        </label>

        <label className="text-xs font-bold text-muted-foreground">
          Day shift: <span className="text-foreground">{dayShift > 0 ? `+${dayShift}` : dayShift}</span>
          <input
            type="range"
            min={-2}
            max={3}
            value={dayShift}
            onChange={(e) => setDayShift(Number(e.target.value))}
            className="w-full mt-2"
          />
        </label>

        <label className="text-xs font-bold text-muted-foreground">
          Group change: <span className="text-foreground">{travelerDelta > 0 ? `+${travelerDelta}` : travelerDelta}</span>
          <input
            type="range"
            min={-2}
            max={4}
            value={travelerDelta}
            onChange={(e) => setTravelerDelta(Number(e.target.value))}
            className="w-full mt-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="rounded-2xl border border-border/50 bg-background/70 p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-primary">{scenario.name}</p>
              <span className="text-[10px] font-bold text-muted-foreground">{scenario.scoreLabel}</span>
            </div>

            <p className="text-xs text-muted-foreground">{scenario.tagline}</p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-muted/30 p-2">
                <p className="text-muted-foreground">Total score</p>
                <p className="text-base font-black text-slate-800 dark:text-slate-100">{scenario.score}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <p className="text-muted-foreground">Projected spend</p>
                <p className="text-base font-black text-slate-800 dark:text-slate-100">Rs {scenario.projectedSpend.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p className="flex items-center gap-1"><Target className="h-3 w-3" /> Cost efficiency: {scenario.costEfficiency}</p>
              <p className="flex items-center gap-1"><Rocket className="h-3 w-3" /> Time efficiency: {scenario.timeEfficiency}</p>
              <p className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Experience quality: {scenario.experienceQuality}</p>
              <p className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Days: {scenario.targetDays}</p>
              <p className="flex items-center gap-1"><Users className="h-3 w-3" /> Travelers: {scenario.targetTravelers}</p>
              <p className="flex items-center gap-1">
                {scenario.projectedBudget >= scenario.projectedSpend ? <TrendingDown className="h-3 w-3 text-emerald-500" /> : <TrendingUp className="h-3 w-3 text-rose-500" />}
                Budget target: Rs {scenario.projectedBudget.toLocaleString()}
              </p>
            </div>

            <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc pl-4">
              {scenario.tradeoffs.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            <p className="text-[11px] rounded-lg bg-primary/5 border border-primary/10 p-2 text-muted-foreground">
              {scenario.regretCheck}
            </p>

            <button
              onClick={() => onApplyScenario(scenario)}
              className="mt-auto w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-all"
            >
              Apply Scenario
            </button>
          </motion.div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Current vibe baseline: <span className="font-bold text-foreground">{vibe || "Standard"}</span>.
        Use this simulator before booking to reduce regret and optimize your final plan.
      </p>
    </div>
  );
}
