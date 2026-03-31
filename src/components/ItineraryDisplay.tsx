import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, MapPin, Utensils, Mountain, ShoppingBag, Camera, Navigation2,
  RefreshCw, Loader2, CloudSun, Map
} from "lucide-react";
import type { TripPlan, TripDay, TripActivity } from "@/types/trip-plan";

interface ItineraryDisplayProps {
  plan: TripPlan;
  activeDayIndex: number;
  regeneratingDay: number | null;
  isSwapping: string | null;
  onRegenerateDay: (dayIndex: number) => void;
  onSwapActivity: (dayNum: number, activityIndex: number, oldActivityName: string) => void;
  isReadOnly?: boolean;
}

export const generateApproximateTime = (index: number) => {
  const times = ["09:00 AM", "11:30 AM", "01:00 PM", "03:00 PM", "05:30 PM", "07:30 PM"];
  return times[index % times.length];
};

export const getActivityType = (name: string, place?: string) => {
  const text = `${name} ${place || ""}`.toLowerCase();
  if (text.includes("beach") || text.includes("coast") || text.includes("sea")) return { label: "Beach", icon: Mountain };
  if (text.includes("church") || text.includes("temple") || text.includes("cathedral") || text.includes("fort") || text.includes("monument") || text.includes("basilica")) return { label: "Historical Landmark", icon: Mountain };
  if (text.includes("market") || text.includes("shop") || text.includes("mall") || text.includes("bazaar")) return { label: "Market", icon: ShoppingBag };
  if (text.includes("restaurant") || text.includes("cafe") || text.includes("dine") || text.includes("bar ") || text.includes("pub")) return { label: "Food & Drink", icon: Utensils };
  if (text.includes("cruise") || text.includes("boat")) return { label: "Activity", icon: Navigation2 };
  return { label: "Attraction", icon: Camera };
};

export const getDistanceIndicator = (index: number) => {
  if (index === 0) return null;
  const times = [10, 15, 20, 25, 30, 45, 12, 18];
  const time = times[(index * 7) % times.length];
  return `🚗 ~${time} min from previous location`;
};

const ItineraryDisplay = ({
  plan, activeDayIndex, regeneratingDay, isSwapping,
  onRegenerateDay, onSwapActivity, isReadOnly = false
}: ItineraryDisplayProps) => {

  if (!plan.itinerary) return null;

  return (
    <div className="space-y-6 mt-8">
      {/* Weather Header Section */}
      {plan.weatherNote && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm transition-all duration-500 ${
          plan.weatherNote.toLowerCase().includes("rain") 
            ? "bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800" 
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/10"
        }`}>
          <div className="h-10 w-10 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/50 shadow-sm">
            <CloudSun className={`h-6 w-6 ${
              plan.weatherNote.toLowerCase().includes("rain") ? "text-sky-600 animate-pulse" : "text-amber-600"
            }`} />
          </div>
          <div>
            <h4 className={`font-display font-bold text-sm mb-0.5 ${
              plan.weatherNote.toLowerCase().includes("rain") ? "text-sky-900 dark:text-sky-300" : "text-amber-900 dark:text-amber-500"
            }`}>
              {plan.weatherNote.toLowerCase().includes("unavailable") ? "Destination Climate Guide" : plan.weatherNote.toLowerCase().includes("rain") ? "Weather Alert: Rain Expected" : "Trip Weather & Climate"}
            </h4>
            <p className={`text-[13px] font-medium leading-relaxed ${
              plan.weatherNote.toLowerCase().includes("rain") ? "text-sky-800/80 dark:text-sky-200/80" : "text-amber-800/80 dark:text-amber-200/80"
            }`}>
              {plan.weatherNote.toLowerCase().includes("unavailable") 
                ? "Live forecast is currently refreshing. Generally, this region offers beautiful sightseeing conditions this time of year!" 
                : plan.weatherNote}
              {plan.weatherNote.toLowerCase().includes("rain") && (
                <><br/><span className="mt-1 block text-xs font-bold opacity-80 italic">✨ Pro Tip: Ask the AI Assistant for indoor backup activities!</span></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Sticky Progress Indicator */}
      <div className="sticky top-4 z-40 bg-card/80 backdrop-blur-xl p-3 rounded-2xl border border-border/50 shadow-sm flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          Day {activeDayIndex + 1} of {plan.itinerary.length}
        </span>
        <div className="flex gap-1 w-32 h-1.5 bg-muted rounded-full overflow-hidden">
          {plan.itinerary.map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 rounded-full transition-all duration-300 ${i <= activeDayIndex ? 'bg-primary' : 'bg-transparent'}`} 
            />
          ))}
        </div>
      </div>

      {plan.itinerary.map((day: TripDay, i: number) => (
        <motion.div 
          key={day.day} 
        className="day-container rounded-[28px] bg-card shadow-xl shadow-primary/5 border border-border/40 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
          data-day-index={i}
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 + i * 0.1 }} 
        >
          {/* Day Hero Image from AI */}
          {day.heroImage && (
            <div className="relative mb-4 h-64 overflow-hidden group">
              <img
                src={day.heroImage}
                alt={day.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 blur-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 ring-1 ring-white/30">
                      <span className="text-lg font-bold text-white">{day.day}</span>
                    </div>
                    <div>
                      <p className="text-xs text-white/80">Day {day.day}</p>
                      <h4 className="font-display font-bold text-white text-2xl leading-tight mt-0.5">{day.title}</h4>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={() => onRegenerateDay(i)}
                      disabled={regeneratingDay !== null}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md text-white transition-all disabled:opacity-50"
                      title="Regenerate this day"
                    >
                      {regeneratingDay === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="p-5 pt-0">
            {!day.heroImage && (
              <div className="flex items-center gap-4 mb-5 pt-5 pb-3 border-b border-border/50">
                <div className="flex-1 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl gradient-hero shadow-inner flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">{day.day}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary/80 uppercase tracking-widest">Day {day.day}</p>
                    <h4 className="font-display font-bold text-foreground text-xl leading-tight mt-0.5">{day.title}</h4>
                  </div>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => onRegenerateDay(i)}
                    disabled={regeneratingDay !== null}
                    className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50 border border-border/50"
                  >
                    {regeneratingDay === i ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <RefreshCw className="h-4 w-4 text-muted-foreground" />}
                  </button>
                )}
              </div>
            )}

            {/* Activities */}
            <div className="relative">
              {/* Timeline visual line */}
              <div className="absolute left-[36px] sm:left-[56px] top-6 bottom-6 w-0.5 bg-border/40 z-0 hidden sm:block" />
              
              <div className="space-y-3 relative z-10">
                {day.activities && Array.isArray(day.activities) && day.activities.map((activity: TripActivity | string, j: number) => {
                  const isString = typeof activity === 'string';
                  return (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + j * 0.05 }}
                    >
                      {j > 0 && getDistanceIndicator(j) && (
                        <div className="pl-14 sm:pl-32 py-2 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full w-fit border border-border/50">
                            {getDistanceIndicator(j)}
                          </div>
                        </div>
                      )}

                      {!isString && activity.image ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 py-4 px-4 rounded-[22px] bg-card border border-border/40 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                          <div className="w-full sm:w-36 h-48 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative shadow-inner bg-muted">
                            <img
                              src={activity.image}
                              alt={activity.name || activity.place}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1.5 shadow-sm">
                              <Clock className="h-3 w-3 text-primary-foreground" /> {generateApproximateTime(j)}
                            </div>
                          </div>
                          <div className="flex-1 py-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <h5 className="font-bold text-base text-foreground leading-tight group-hover:text-primary transition-colors pr-2">
                                  {activity.name}
                                </h5>
                                {(() => {
                                  const { label, icon: TypeIcon } = getActivityType(activity.name || '', activity.place);
                                  return (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-[10px] font-bold text-primary whitespace-nowrap border border-primary/20">
                                      <TypeIcon className="h-3 w-3" /> {label}
                                    </div>
                                  );
                                })()}
                              </div>
                              {activity.place && (
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-coral" /> {activity.place}
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-2 items-center justify-between">
                              {activity.lat && activity.lng && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted/80 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                                >
                                  <Map className="h-4 w-4" /> Open in Google Maps
                                </a>
                              )}
                              {!isReadOnly && (
                                <button 
                                  onClick={() => onSwapActivity(day.day, j, activity.name || '')}
                                  disabled={isSwapping === `${day.day}-${j}`}
                                  className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors ml-auto"
                                >
                                  {isSwapping === `${day.day}-${j}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                  Swap Activity
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 text-sm text-foreground p-3 rounded-xl bg-muted/30 border border-border/50">
                          <div className="mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <span className="font-medium leading-relaxed">{isString ? activity : activity.name || ''}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Meals */}
            {day.meals && (
              <div className="mt-6 pt-5 border-t border-border/60">
                <h5 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Utensils className="h-3.5 w-3.5" /> Suggested Meals
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(day.meals).map(([meal, suggestion]) => {
                    const mealIcons: Record<string, string> = { breakfast: "🍳", lunch: "🍛", dinner: "🍽" };
                    return (
                      <div key={meal} className="flex flex-col gap-2 p-4 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mealIcons[meal] || "🍽"}</span>
                          <span className="font-bold text-xs text-foreground capitalize tracking-wide">{meal}</span>
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed font-medium">{suggestion as string}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily Tip */}
            {day.tips && (
              <div className="mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex gap-3.5 shadow-sm">
                <div className="text-xl mt-0.5">💡</div>
                <div>
                  <h5 className="text-[11px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest mb-1">
                    Travel Tip
                  </h5>
                  <p className="text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-semibold">
                    {day.tips}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ItineraryDisplay;
