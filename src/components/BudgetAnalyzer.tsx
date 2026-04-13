import { TripPlan } from "@/types/trip-plan";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BudgetAnalyzerProps {
  plan: TripPlan;
  budget: number;
  days: number;
  travelers: number;
}

export const BudgetAnalyzer = ({ plan, budget, days, travelers }: BudgetAnalyzerProps) => {
  const breakdown = plan.budgetBreakdown;
  const health = plan.budgetHealth;

  if (!breakdown || !health) return null;

  const totalSpend = breakdown.accommodation + breakdown.food + breakdown.activities + breakdown.transport + (breakdown.miscellaneous || 0);
  const remaining = budget - totalSpend;
  const percentUsed = (totalSpend / budget) * 100;
  const perPersonCost = totalSpend / travelers;
  const dailySpend = totalSpend / days;

  // AI analysis
  const isOverBudget = remaining < 0;
  const isWarnBudget = percentUsed > 85;
  const hasBuffer = percentUsed < 70;

  const dataPoints = [
    { name: "Accommodation", value: breakdown.accommodation, fill: "#3b82f6" },
    { name: "Food", value: breakdown.food, fill: "#f97316" },
    { name: "Activities", value: breakdown.activities, fill: "#a855f7" },
    { name: "Transport", value: breakdown.transport, fill: "#10b981" },
    { name: "Misc", value: breakdown.miscellaneous || 0, fill: "#ec4899" },
  ].filter(d => d.value > 0);

  const categories = [
    {
      name: "Accommodation",
      value: breakdown.accommodation,
      pct: (breakdown.accommodation / totalSpend) * 100,
      recommendation: "Keep under 40% of budget",
      actual: (breakdown.accommodation / totalSpend) * 100 > 40 ? "HIGH" : "OK",
    },
    {
      name: "Food",
      value: breakdown.food,
      pct: (breakdown.food / totalSpend) * 100,
      recommendation: "Typically 25-35% of budget",
      actual: (breakdown.food / totalSpend) * 100 > 35 ? "HIGH" : "OK",
    },
    {
      name: "Activities",
      value: breakdown.activities,
      pct: (breakdown.activities / totalSpend) * 100,
      recommendation: "Allocate 20-30% for experiences",
      actual: (breakdown.activities / totalSpend) * 100 < 15 ? "LOW" : "OK",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Budget Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
        >
          <div className="text-xs text-muted-foreground mb-1 font-bold">TOTAL BUDGET</div>
          <div className="text-xl font-black text-foreground">₹{budget.toLocaleString()}</div>
          <div className="text-xs mt-2 text-muted-foreground">{days} days • {travelers} travelers</div>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20"
        >
          <div className="text-xs text-muted-foreground mb-1 font-bold">ESTIMATED SPEND</div>
          <div className="text-xl font-black text-blue-600">₹{totalSpend.toLocaleString()}</div>
          <div className="text-xs mt-2 text-muted-foreground">{percentUsed.toFixed(0)}% of budget</div>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-4 rounded-xl bg-gradient-to-br ${remaining >= 0 ? "from-emerald-500/10" : "from-red-500/10"} to-transparent border ${remaining >= 0 ? "border-emerald-500/20" : "border-red-500/20"}`}
        >
          <div className="text-xs text-muted-foreground mb-1 font-bold">REMAINING</div>
          <div className={`text-xl font-black ${remaining >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            ₹{Math.abs(remaining).toLocaleString()}
          </div>
          <div className="text-xs mt-2 text-muted-foreground">{remaining >= 0 ? "Buffer" : "Over by"}</div>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20"
        >
          <div className="text-xs text-muted-foreground mb-1 font-bold">PER PERSON</div>
          <div className="text-xl font-black text-purple-600">₹{perPersonCost.toLocaleString()}</div>
          <div className="text-xs mt-2 text-muted-foreground">₹{(dailySpend / travelers).toFixed(0)}/day</div>
        </motion.div>
      </div>

      {/* AI Health Check */}
      {isOverBudget && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-900 dark:text-red-200 text-sm">Budget Alert</div>
            <div className="text-xs text-red-800 dark:text-red-300 mt-1">
              You're over budget by ₹{Math.abs(remaining).toLocaleString()}. Consider reducing cuisine costs or finding budget activities.
            </div>
          </div>
        </div>
      )}

      {isWarnBudget && !isOverBudget && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 dark:text-amber-200 text-sm">Budget Tight</div>
            <div className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              You're using {percentUsed.toFixed(0)}% of your budget. Only ₹{remaining.toLocaleString()} remaining as buffer.
            </div>
          </div>
        </div>
      )}

      {hasBuffer && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Budget Healthy</div>
            <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
              You have ₹{remaining.toLocaleString()} buffer. You can add premium experiences or activities.
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="p-6 rounded-xl bg-card border border-border/50">
        <h4 className="font-bold text-sm mb-4">Category Analysis</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dataPoints}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `₹${value}`} />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Recommendations */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm">Budget Recommendations</h4>
        {categories.map((cat) => (
          <div key={cat.name} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-border/50">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-sm">{cat.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{cat.recommendation}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm">₹{cat.value.toLocaleString()}</div>
                <div className={`text-xs font-bold mt-1 ${cat.actual === "OK" ? "text-emerald-600" : cat.actual === "HIGH" ? "text-red-600" : "text-blue-600"}`}>
                  {cat.pct.toFixed(0)}% • {cat.actual}
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(cat.pct, 100)}%` }}
                className={`h-full ${cat.actual === "OK" ? "bg-emerald-500" : cat.actual === "HIGH" ? "bg-red-500" : "bg-blue-500"}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
        <div className="flex gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
          <h4 className="font-bold text-sm">AI Budget Insight</h4>
        </div>
        <div className="text-xs leading-relaxed text-muted-foreground space-y-2">
          <p>
            Based on your {days}-day trip for {travelers} travelers in {plan.destination}:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Daily spend is ₹{dailySpend.toFixed(0)} per person ({(dailySpend/travelers).toFixed(0)}/day)</li>
            <li>{breakdown.accommodation > breakdown.food ? "Accommodation is your biggest expense" : "Food is your biggest expense"}</li>
            <li>
              {categories.find(c => c.actual === "HIGH")
                ? `Reduce ${categories.find(c => c.actual === "HIGH")?.name} spending to stay within budget.`
                : "Your expense distribution is well-balanced."}
            </li>
            <li>Book flights/trains early for ₹{plan.travelOptions?.[0]?.price ? "10-15%" : "best"} discounts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
