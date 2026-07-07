import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, MapPin, Utensils, Mountain, ShoppingBag, Camera, Navigation2,
  RefreshCw, Loader2, CloudSun, ExternalLink, ImageOff, Lock, Unlock,
  ArrowUp, ArrowDown, SkipForward, Sparkles, BadgeIndianRupee, Gauge
} from "lucide-react";
import type { TripPlan, TripDay, TripActivity } from "@/types/trip-plan";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItineraryDisplayProps {
  plan: TripPlan;
  activeDayIndex: number;
  regeneratingDay: number | null;
  isSwapping: string | null;
  onRegenerateDay: (dayIndex: number) => void;
  onSwapActivity: (dayNum: number, activityIndex: number, oldActivityName: string) => void;
  isReadOnly?: boolean;
}

const generateApproximateTime = (index: number) => {
  const times = ["09:00 AM", "11:30 AM", "01:00 PM", "03:00 PM", "05:30 PM", "07:30 PM"];
  return times[index % times.length];
};

const getActivityType = (name: string, place?: string) => {
  const text = `${name} ${place || ""}`.toLowerCase();
  if (text.includes("beach") || text.includes("coast") || text.includes("sea")) return { label: "Beach", icon: Mountain };
  if (text.includes("church") || text.includes("temple") || text.includes("cathedral") || text.includes("fort") || text.includes("monument") || text.includes("basilica")) return { label: "Landmark", icon: Mountain };
  if (text.includes("market") || text.includes("shop") || text.includes("mall") || text.includes("bazaar")) return { label: "Market", icon: ShoppingBag };
  if (text.includes("restaurant") || text.includes("cafe") || text.includes("dine") || text.includes("bar ") || text.includes("pub")) return { label: "Dining", icon: Utensils };
  if (text.includes("cruise") || text.includes("boat")) return { label: "Activity", icon: Navigation2 };
  return { label: "Attraction", icon: Camera };
};

const getDistanceIndicator = (index: number) => {
  if (index === 0) return null;
  const times = [10, 15, 20, 25, 30, 45, 12, 18];
  const time = times[(index * 7) % times.length];
  return `~${time} min from previous stop`;
};

const hasValidCoordinates = (activity: TripActivity) =>
  typeof activity.lat === "number" && Number.isFinite(activity.lat) &&
  typeof activity.lng === "number" && Number.isFinite(activity.lng);

const getActivityInsights = (activity: TripActivity, index: number, typeLabel: string): string[] => {
  const location = activity.place || "this area";
  const slot = generateApproximateTime(index);
  const paceHints = ["Light walking", "Moderate walking", "Comfortable pace", "Leisure stop"];
  const pace = paceHints[index % paceHints.length];

  return [
    `Best to visit around ${slot}.`,
    `${typeLabel} experience near ${location}.`,
    `${pace}; keep 60-90 minutes for this stop.`,
  ];
};

const ItineraryDisplay = ({
  plan, activeDayIndex, regeneratingDay, isSwapping,
  onRegenerateDay, onSwapActivity, isReadOnly = false
}: ItineraryDisplayProps) => {
  const isMobile = useIsMobile();
  const [imageErrors, setImageErrors] = useState<Record<string, true>>({});
  const [selectedDay, setSelectedDay] = useState(activeDayIndex);
  const [lockedActivities, setLockedActivities] = useState<Set<string>>(new Set());
  const [hiddenActivities, setHiddenActivities] = useState<Set<string>>(new Set());
  const [customOrder, setCustomOrder] = useState<Record<number, number[]>>({});
  const [compactView, setCompactView] = useState(false);
  const [showWhyPanel, setShowWhyPanel] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSelectedDay(activeDayIndex);
  }, [activeDayIndex]);

  const dayTravelSummary = useMemo(() => {
    const cheapest = plan.travelOptions && plan.travelOptions.length
      ? Math.min(...plan.travelOptions.map((o) => o.price ?? o.estimatedCost ?? Number.POSITIVE_INFINITY).filter(Number.isFinite))
      : null;
    const fastest = plan.travelOptions && plan.travelOptions.length
      ? plan.travelOptions.reduce<string | null>((acc, o) => acc || o.duration || null, null)
      : null;
    return {
      cheapest: Number.isFinite(cheapest as number) ? cheapest : null,
      fastest,
    };
  }, [plan.travelOptions]);

  const perDayBudget = useMemo(() => {
    const total = Number(plan.budgetHealth?.totalEstimated || plan.budgetHealth?.userBudget || 0);
    const days = Math.max(plan.itinerary?.length || 1, 1);
    return total > 0 ? Math.round(total / days) : null;
  }, [plan.budgetHealth, plan.itinerary?.length]);

  if (!plan.itinerary) return null;

  const getPace = (activityCount: number) => {
    if (activityCount <= 3) return { label: "Relaxed", color: "text-emerald-600 bg-emerald-500/10" };
    if (activityCount <= 5) return { label: "Balanced", color: "text-amber-600 bg-amber-500/10" };
    return { label: "Packed", color: "text-rose-600 bg-rose-500/10" };
  };

  const moveActivity = (dayNum: number, pos: number, dir: -1 | 1) => {
    const day = plan.itinerary?.find((d) => d.day === dayNum);
    if (!day?.activities) return;
    const baseOrder = customOrder[dayNum] || day.activities.map((_, idx) => idx);
    const next = [...baseOrder];
    const swapTo = pos + dir;
    if (swapTo < 0 || swapTo >= next.length) return;
    [next[pos], next[swapTo]] = [next[swapTo], next[pos]];
    setCustomOrder((prev) => ({ ...prev, [dayNum]: next }));
  };

  const toggleLock = (key: string) => {
    setLockedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSkip = (key: string) => {
    setHiddenActivities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getTimeBucket = (index: number) => {
    if (index < 2) return "Morning";
    if (index < 4) return "Afternoon";
    if (index < 6) return "Evening";
    return "Night";
  };

  const scrollToDay = (dayIndex: number) => {
    const el = document.querySelector(`[data-day-index="${dayIndex}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mt-6 space-y-7">

      {plan.weatherNote && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm ${
          plan.weatherNote.toLowerCase().includes("rain")
            ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200"
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300"
        }`}>
          <CloudSun className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
            plan.weatherNote.toLowerCase().includes("rain") ? "text-sky-500" : "text-amber-500"
          }`} />
          <div>
            <p className="mb-0.5 text-sm font-semibold">
              {plan.weatherNote.toLowerCase().includes("unavailable")
                ? "Climate Overview"
                : plan.weatherNote.toLowerCase().includes("rain")
                ? "Rain Expected"
                : "Weather & Climate"}
            </p>
            <p className="text-sm leading-relaxed opacity-90">
              {plan.weatherNote.toLowerCase().includes("unavailable")
                ? "Live weather could not be fetched. Practical prep: carry a light layer, sunscreen, hydration, and keep a compact rain cover for sudden changes."
                : plan.weatherNote}
            </p>
          </div>
        </div>
      )}

      <div
        className="sticky top-3 z-30 space-y-2 rounded-xl border border-border px-4 py-3 shadow-sm"
        style={{
          background: isMobile ? "rgba(255,255,255,0.98)" : undefined,
          backdropFilter: isMobile ? "none" : "blur(10px)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Day {selectedDay + 1} of {plan.itinerary.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompactView((v) => !v)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted"
            >
              {compactView ? "Expanded view" : "Compact view"}
            </button>
            <button
              onClick={() => onRegenerateDay(selectedDay)}
              disabled={regeneratingDay !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {regeneratingDay === selectedDay ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Regenerate day
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {plan.itinerary.map((d, i) => (
            <button
              key={d.day}
              onClick={() => {
                setSelectedDay(i);
                scrollToDay(i);
              }}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                i === selectedDay ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Day {d.day}
            </button>
          ))}
          <button
            onClick={() => setShowWhyPanel((prev) => ({ ...prev, [selectedDay]: !prev[selectedDay] }))}
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground hover:text-foreground"
          >
            Why this plan?
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("planzo-open-budget"))}
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground hover:text-foreground"
          >
            Adjust budget
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {plan.itinerary.map((day: TripDay, i: number) => {
          if (i !== selectedDay) return null;
          return (
            <motion.div
              key={day.day}
              className="day-container overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              data-day-index={i}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
          <div className="relative aspect-[16/6] min-h-[170px] overflow-hidden bg-muted/30">
            {day.heroImage && !imageErrors[`day-${day.day}`] ? (
              <img
                src={day.heroImage}
                alt={day.title}
                className="h-full w-full object-cover"
                onError={() => setImageErrors((prev) => ({ ...prev, [`day-${day.day}`]: true }))}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300">
                <div className="flex flex-col items-center gap-2">
                  <ImageOff className="h-6 w-6" />
                  <p className="text-sm font-medium">No day image available</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 pb-4 md:px-5">
              <div>
                <p className="text-xs font-medium text-white/75">Day {day.day}</p>
                <h4 className="text-xl font-semibold leading-tight text-white">{day.title}</h4>
              </div>
              {!isReadOnly && (
                <button
                  onClick={() => onRegenerateDay(i)}
                  disabled={regeneratingDay !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20 disabled:opacity-50"
                  title="Regenerate this day"
                >
                  {regeneratingDay === i
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />}
                  Regenerate
                </button>
              )}
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {(() => {
                const pace = getPace(day.activities?.length || 0);
                const effortScore = Math.min(100, 35 + (day.activities?.length || 0) * 12);
                return (
                  <>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${pace.color}`}>
                      <Gauge className="h-3 w-3" /> {pace.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Effort {effortScore}/100
                    </span>
                    {perDayBudget && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        <BadgeIndianRupee className="h-3 w-3" /> ~₹{perDayBudget.toLocaleString("en-IN")} / day
                      </span>
                    )}
                    {dayTravelSummary.cheapest && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        <MapPin className="h-3 w-3" /> From ₹{dayTravelSummary.cheapest.toLocaleString("en-IN")}
                      </span>
                    )}
                    {dayTravelSummary.fastest && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" /> Fastest {dayTravelSummary.fastest}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>

            {showWhyPanel[i] && (
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs font-semibold text-primary mb-1">Why this day plan?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Activities are sequenced for time balance, commute efficiency, and variety.
                  The order prioritizes daytime landmarks first, then local culture and food for the evening.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {day.activities && Array.isArray(day.activities) && (customOrder[day.day] || day.activities.map((_, idx) => idx)).map((activityOriginalIndex, j) => {
                const activity = day.activities?.[activityOriginalIndex] as TripActivity | string;
                const isString = typeof activity === "string";
                const activityKey = `${day.day}-${activityOriginalIndex}`;
                if (hiddenActivities.has(activityKey)) return null;
                const hasImage = !isString && !!activity.image && !imageErrors[`activity-${activityKey}`];
                const timeBucket = getTimeBucket(j);

                return (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + j * 0.04 }}
                  >
                    {j > 0 && getDistanceIndicator(j) && (
                      <div className="flex items-center gap-3 py-1.5">
                        <div className="h-px flex-1 bg-border/60" />
                        <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {getDistanceIndicator(j)}
                        </span>
                        <div className="h-px flex-1 bg-border/60" />
                      </div>
                    )}

                    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                      <div className="border-b border-border/70 px-3.5 py-2.5 md:px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{timeBucket}</span>
                      </div>
                      <div className="flex gap-3 p-3.5 md:gap-4 md:p-4">
                        {!isString && (
                          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/25 md:h-32 md:w-32">
                            {hasImage ? (
                              <img
                                src={activity.image}
                                alt={activity.name || activity.place || "Activity"}
                                className="h-full w-full object-cover object-center"
                                onError={() => setImageErrors((prev) => ({ ...prev, [`activity-${activityKey}`]: true }))}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300">
                                <ImageOff className="h-4.5 w-4.5" />
                              </div>
                            )}
                            <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md border border-white/30 bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                              <Clock className="h-2.5 w-2.5" />
                              {generateApproximateTime(j)}
                            </div>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                            {j + 1}
                          </span>
                          {!isString && (() => {
                            const { label, icon: TypeIcon } = getActivityType(activity.name || "", activity.place);
                            return (
                              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                <TypeIcon className="h-3 w-3" /> {label}
                              </span>
                            );
                          })()}
                        </div>

                        <h5 className="text-base font-semibold leading-snug text-foreground">
                          {isString ? activity : activity.name || "Activity"}
                        </h5>

                        {!isString && activity.place && (
                          <p className="mt-1.5 mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {activity.place}
                          </p>
                        )}

                        {!isString && (() => {
                          const { label } = getActivityType(activity.name || "", activity.place);
                          const insights = getActivityInsights(activity, j, label);
                          return (
                            <ul className="mb-3 space-y-1 text-sm text-muted-foreground">
                              {insights.map((point, idx) => (
                                <li key={`${activityKey}-insight-${idx}`} className="flex items-start gap-2">
                                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          );
                        })()}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-border px-3.5 py-3 md:px-4">
                        {!isString && hasValidCoordinates(activity) && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open in Maps
                          </a>
                        )}

                        {!isReadOnly && !isString && (
                          <button
                            onClick={() => onSwapActivity(day.day, activityOriginalIndex, activity.name || "")}
                            disabled={lockedActivities.has(activityKey) || isSwapping === `${day.day}-${activityOriginalIndex}`}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                          >
                            {isSwapping === `${day.day}-${activityOriginalIndex}`
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <RefreshCw className="h-3.5 w-3.5" />}
                            Swap
                          </button>
                        )}
                        {!isReadOnly && (
                          <>
                            <button
                              onClick={() => moveActivity(day.day, j, -1)}
                              disabled={j === 0}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                            >
                              <ArrowUp className="h-3.5 w-3.5" /> Move up
                            </button>
                            <button
                              onClick={() => moveActivity(day.day, j, 1)}
                              disabled={j === (day.activities?.length || 1) - 1}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                            >
                              <ArrowDown className="h-3.5 w-3.5" /> Move down
                            </button>
                            <button
                              onClick={() => toggleSkip(activityKey)}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                            >
                              <SkipForward className="h-3.5 w-3.5" /> Skip
                            </button>
                            <button
                              onClick={() => toggleLock(activityKey)}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted md:ml-auto"
                            >
                              {lockedActivities.has(activityKey) ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                              {lockedActivities.has(activityKey) ? "Locked" : "Lock"}
                            </button>
                          </>
                        )}
                        {!isReadOnly && !isString && (
                          <button
                            onClick={() => onSwapActivity(day.day, activityOriginalIndex, activity.name || "")}
                            disabled={isSwapping === `${day.day}-${j}`}
                            className="hidden"
                          >
                            {isSwapping === `${day.day}-${j}`
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <RefreshCw className="h-3.5 w-3.5" />}
                            Swap activity
                          </button>
                        )}
                      </div>
                    </article>
                  </motion.div>
                );
              })}
            </div>

            {day.meals && (
              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Utensils className="h-3.5 w-3.5" /> Suggested Meals
                </p>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                  {Object.entries(day.meals).map(([meal, suggestion]) => {
                    const mealIcons: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
                    return (
                      <div key={meal} className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-semibold text-foreground">{mealIcons[meal] || meal}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{suggestion as string}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {day.tips && (
              <div className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Local Tip</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900/85 dark:text-amber-100/85">{day.tips}</p>
              </div>
            )}

            {day.userNotes && (
              <div className="mt-4 rounded-lg border border-sky-200/70 bg-sky-50 px-4 py-3 dark:border-sky-800/40 dark:bg-sky-950/20">
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">Smart Adjustment</p>
                <p className="mt-1 text-sm leading-relaxed text-sky-900/85 dark:text-sky-100/85">{day.userNotes}</p>
              </div>
            )}
          </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ItineraryDisplay;
