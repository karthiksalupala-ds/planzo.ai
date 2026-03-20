import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation, ChevronLeft, ChevronRight, CheckCircle, Clock,
  MapPin, Camera, ExternalLink, X, Compass
} from "lucide-react";
import type { TripPlan, TripActivity, TripDay } from "@/types/trip-plan";

interface TravelModeProps {
  plan: TripPlan;
  startDate?: string;
  onClose: () => void;
}

const TravelMode = ({ plan, startDate, onClose }: TravelModeProps) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

  const itinerary = plan.itinerary || [];
  const totalDays = itinerary.length;

  // Auto-detect which day they're on based on start date
  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < totalDays) {
        setActiveDayIndex(diffDays);
      }
    }
  }, [startDate, totalDays]);

  const currentDay: TripDay | undefined = itinerary[activeDayIndex];
  if (!currentDay) return null;

  const activities = (currentDay.activities || []).filter(
    (a): a is TripActivity => typeof a !== "string" && !!a.name
  );

  const toggleComplete = (activityKey: string) => {
    setCompletedActivities(prev => {
      const next = new Set(prev);
      if (next.has(activityKey)) {
        next.delete(activityKey);
      } else {
        next.add(activityKey);
      }
      return next;
    });
  };

  const completedCount = activities.filter((_, i) =>
    completedActivities.has(`${activeDayIndex}-${i}`)
  ).length;

  const progressPercent = activities.length > 0
    ? Math.round((completedCount / activities.length) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Compass className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground text-sm">Travel Mode</h2>
              <p className="text-[10px] text-muted-foreground">
                Day {activeDayIndex + 1} of {totalDays} — {currentDay.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-4 pb-28">
        {/* Day Navigator */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setActiveDayIndex(Math.max(0, activeDayIndex - 1))}
            disabled={activeDayIndex === 0}
            className="p-2 rounded-xl bg-card border border-border disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex gap-1.5">
            {itinerary.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveDayIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeDayIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveDayIndex(Math.min(totalDays - 1, activeDayIndex + 1))}
            disabled={activeDayIndex === totalDays - 1}
            className="p-2 rounded-xl bg-card border border-border disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6 p-3 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Progress</span>
            <span className="text-xs font-bold text-primary">{completedCount}/{activities.length} done</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>
        </div>

        {/* Hero Image */}
        {currentDay.heroImage && (
          <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
            <img
              src={currentDay.heroImage}
              alt={currentDay.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-bold text-lg">{currentDay.title}</h3>
            </div>
          </div>
        )}

        {/* Activities List */}
        <div className="space-y-3">
          {activities.map((activity, i) => {
            const key = `${activeDayIndex}-${i}`;
            const isComplete = completedActivities.has(key);
            const lat = activity.lat;
            const lng = activity.lng;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-4 rounded-2xl border transition-all ${
                  isComplete
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-card border-border shadow-card"
                }`}
              >
                <div className="flex gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(key)}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      isComplete
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-muted-foreground/30 hover:border-primary"
                    }`}
                  >
                    {isComplete && <CheckCircle className="h-4 w-4 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm transition-all ${
                      isComplete
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}>
                      {activity.name}
                    </h4>
                    {activity.place && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {activity.place}
                      </p>
                    )}

                    {/* Navigation Button */}
                    {(lat && lng) && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        <Navigation className="h-3 w-3" /> Navigate
                      </a>
                    )}
                    {(!lat || !lng) && activity.place && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.place)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        <Navigation className="h-3 w-3" /> Navigate
                      </a>
                    )}
                  </div>

                  {/* Activity Image */}
                  {activity.image && (
                    <img
                      src={activity.image}
                      alt={activity.name}
                      className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Meals */}
        {currentDay.meals && Object.keys(currentDay.meals).length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="font-semibold text-foreground text-sm mb-3">🍽️ Meals Today</h3>
            <div className="space-y-2">
              {Object.entries(currentDay.meals).map(([meal, place]) => (
                <div key={meal} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize font-medium">{meal}</span>
                  <span className="text-foreground font-semibold">{place as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {currentDay.tips && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              💡 {currentDay.tips}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TravelMode;
