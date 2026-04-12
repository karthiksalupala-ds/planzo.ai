import { useState } from "react";
import { BellRing, LineChart, Plus, TrendingDown, TrendingUp } from "lucide-react";
import type { TripPriceWatch } from "@/lib/trip-features";
import { getPriceWatchMeta } from "@/lib/trip-features";

interface SuggestedWatch {
  label: string;
  category: "transport" | "stay";
  baseline_price: number;
  current_price: number;
  target_price: number;
  notes: string | null;
}

interface PriceWatchPanelProps {
  watches: TripPriceWatch[];
  suggestions: SuggestedWatch[];
  onCreateWatch: (watch: {
    label: string;
    category: string;
    baseline_price: number;
    current_price: number;
    target_price: number;
    notes?: string | null;
  }) => Promise<void> | void;
  onUpdateWatch: (watchId: string, nextPrice: number) => Promise<void> | void;
}

const PriceWatchPanel = ({
  watches,
  suggestions,
  onCreateWatch,
  onUpdateWatch,
}: PriceWatchPanelProps) => {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("transport");
  const [baseline, setBaseline] = useState("");
  const [target, setTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Phase 4</p>
        <h3 className="mt-1 text-xl font-black text-foreground">Price watch alerts</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Track transport and stay prices against a target so you know when it is safe to book.
        </p>

        {suggestions.length > 0 && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">Quick-start from your current plan</p>
            <div className="mt-3 space-y-2">
              {suggestions.map((suggestion) => (
                <div key={`${suggestion.category}-${suggestion.label}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{suggestion.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Current ₹{suggestion.current_price.toLocaleString("en-IN")} · target ₹{suggestion.target_price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onCreateWatch(suggestion)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    Watch this
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const baselinePrice = Number(baseline);
            const targetPrice = Number(target);
            if (!label.trim() || !baselinePrice || !targetPrice) return;
            void onCreateWatch({
              label: label.trim(),
              category,
              baseline_price: baselinePrice,
              current_price: baselinePrice,
              target_price: targetPrice,
              notes: notes.trim() || null,
            });
            setLabel("");
            setCategory("transport");
            setBaseline("");
            setTarget("");
            setNotes("");
          }}
          className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Create custom watch</p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Flight Hyderabad to Goa"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            >
              <option value="transport">Transport</option>
              <option value="stay">Stay</option>
              <option value="activity">Activity</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>
            <input
              value={baseline}
              onChange={(event) => setBaseline(event.target.value)}
              placeholder="Current price"
              type="number"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="Target price"
              type="number"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Optional reminder or booking context"
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add watch
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-black text-foreground">Live watchlist</h3>
        </div>
        <div className="mt-4 space-y-3">
          {watches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No watches yet. Add one from logistics or create a custom target.</p>
          ) : (
            watches.map((watch) => {
              const meta = getPriceWatchMeta(watch);
              const nextValue = priceInputs[watch.id] ?? String(watch.current_price);
              return (
                <div key={watch.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{watch.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Baseline ₹{Number(watch.baseline_price).toLocaleString("en-IN")} · target ₹{Number(watch.target_price).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      meta.hitTarget
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : meta.delta > 0
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }`}>
                      {meta.hitTarget ? "Alert" : meta.delta > 0 ? "Rising" : "Tracking"}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">₹{Number(watch.current_price).toLocaleString("en-IN")}</span>
                    {meta.delta < 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                        <TrendingDown className="h-3.5 w-3.5" />
                        Down ₹{Math.abs(meta.delta).toLocaleString("en-IN")}
                      </span>
                    ) : meta.delta > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-300">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Up ₹{meta.delta.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No change yet</span>
                    )}
                  </div>

                  {watch.notes ? <p className="mt-2 text-xs text-muted-foreground">{watch.notes}</p> : null}

                  <div className="mt-3 flex gap-2">
                    <input
                      value={nextValue}
                      onChange={(event) => setPriceInputs((prev) => ({ ...prev, [watch.id]: event.target.value }))}
                      type="number"
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void onUpdateWatch(watch.id, Number(nextValue))}
                      className="rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background"
                    >
                      Update price
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default PriceWatchPanel;
