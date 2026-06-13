import { useState, useRef, type CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee, Zap, Star, Plane, Train, Bus, ChevronRight,
  Shield, ListChecks, AlertTriangle, Car, Bike, Navigation2, Backpack,
  CheckCircle, PieChart, Users, TrendingDown, Sparkles
} from "lucide-react";
import type { TripPlan, TravelOption, LocalTransportOption } from "@/types/trip-plan";
import TripTwinSimulator from "./TripTwinSimulator";
import { LogisticsIntelligence } from "./LogisticsIntelligence";
import { BudgetAnalyzer } from "./BudgetAnalyzer";
import { GroupExpenseSplitter } from "./GroupExpenseSplitter";
import { TripCollaboration } from "./TripCollaboration";

type TravelModeKind = "flight" | "train" | "bus";
type NormalizedTravelOption = TravelOption & {
  __idx: number;
  __normalizedMode: TravelModeKind;
  id?: number | string;
};

interface TripLogisticsProps {
  plan: TripPlan;
  destination: string;
  pinnedLogistics: number[];
  setPinnedLogistics: React.Dispatch<React.SetStateAction<number[]>>;
  packingChecked: Set<number>;
  setPackingChecked: React.Dispatch<React.SetStateAction<Set<number>>>;
  logisticsTab: "all" | "flights" | "trains" | "buses";
  setLogisticsTab: (tab: "all" | "flights" | "trains" | "buses") => void;
  logisticsPanel: "transport" | "essentials" | "insights";
  setLogisticsPanel: (panel: "transport" | "essentials" | "insights") => void;
  logisticsSortBy: "recommended" | "price" | "duration" | "departure";
  setLogisticsSortBy: (sort: "recommended" | "price" | "duration" | "departure") => void;
  budget: string;
  days: number;
  travelers: number;
  vibe: string;
  applyTripTwinScenario: (scenario: any) => void;
  activeConfig: {
    color: string;
    glow: string;
    bg: string;
  };
}

export const TripLogistics = ({
  plan,
  destination,
  pinnedLogistics,
  setPinnedLogistics,
  packingChecked,
  setPackingChecked,
  logisticsTab,
  setLogisticsTab,
  logisticsPanel,
  setLogisticsPanel,
  logisticsSortBy,
  setLogisticsSortBy,
  budget,
  days,
  travelers,
  vibe,
  applyTripTwinScenario,
  activeConfig,
}: TripLogisticsProps) => {
  const getNormalizedMode = (opt: TravelOption): TravelModeKind => {
    const rawMode = String(opt?.mode || "").toLowerCase();
    const rawOperator = String(opt?.operator || "").toLowerCase();
    const rawType = String(opt?.type || "").toLowerCase();
    const hint = `${rawMode} ${rawOperator} ${rawType}`;
    if (/(indigo|air india|vistara|spicejet|akasa|airasia|flight|airline|airport)/.test(hint)) return "flight";
    if (/(train|rail|irctc|rajdhani|shatabdi|vande bharat)/.test(hint)) return "train";
    return "bus";
  };

  const rawOptions: NormalizedTravelOption[] = (plan.travelOptions || []).map((o, idx) => ({
    ...o,
    __idx: idx,
    __normalizedMode: getNormalizedMode(o),
  }));

  const fallbackTransportOptions: NormalizedTravelOption[] = [];
  const basePrice = rawOptions.length
    ? Math.min(...rawOptions.map((o) => o.price ?? o.estimatedCost ?? Number.POSITIVE_INFINITY))
    : 1200;
  const toCity = (plan.destination || destination || "Destination").split(",")[0].trim();

  if (rawOptions.length < 4) {
    if (!rawOptions.some((o) => o.__normalizedMode === "flight")) {
      fallbackTransportOptions.push({
        __idx: 10001,
        __normalizedMode: "flight",
        mode: "Flight",
        operator: "IndiGo",
        from: "Your city",
        to: toCity,
        duration: "1h 45m",
        price: Math.round(basePrice * 1.8),
        estimatedCost: Math.round(basePrice * 1.8),
        departureTime: "07:15",
        arrivalTime: "09:00",
        type: "Economy",
        amenities: ["Cabin Bag", "Web Check-in"],
        policy: "Non-Refundable",
        availability: 18,
        rating: 4.2,
        isRecommended: false,
      });
    }
    if (!rawOptions.some((o) => o.__normalizedMode === "train")) {
      fallbackTransportOptions.push({
        __idx: 10002,
        __normalizedMode: "train",
        mode: "Train",
        operator: "IRCTC",
        from: "Your city",
        to: toCity,
        duration: "8h 30m",
        price: Math.round(basePrice * 0.7),
        estimatedCost: Math.round(basePrice * 0.7),
        departureTime: "21:30",
        arrivalTime: "06:00",
        type: "3A",
        amenities: ["Sleeper", "Charging Port"],
        policy: "Partially Refundable",
        availability: 42,
        rating: 4.0,
        isRecommended: false,
      });
    }
    if (!rawOptions.some((o) => o.__normalizedMode === "bus")) {
      fallbackTransportOptions.push({
        __idx: 10003,
        __normalizedMode: "bus",
        mode: "Bus",
        operator: "RedBus",
        from: "Your city",
        to: toCity,
        duration: "10h 15m",
        price: Math.round(basePrice * 0.5),
        estimatedCost: Math.round(basePrice * 0.5),
        departureTime: "22:00",
        arrivalTime: "08:15",
        type: "AC Sleeper",
        amenities: ["AC", "Live Tracking"],
        policy: "Partially Refundable",
        availability: 14,
        rating: 3.9,
        isRecommended: false,
      });
    }
  }

  const normalizedOptions: NormalizedTravelOption[] = [...rawOptions, ...fallbackTransportOptions];

  const flights = normalizedOptions.filter((o) => o.__normalizedMode === 'flight');
  const trains = normalizedOptions.filter((o) => o.__normalizedMode === 'train');
  const buses = normalizedOptions.filter((o) => o.__normalizedMode === 'bus');

  const filteredOptions = logisticsTab === "flights" ? flights
    : logisticsTab === "trains" ? trains
    : logisticsTab === "buses" ? buses
    : normalizedOptions;

  const parseDurationMinutes = (duration?: string) => {
    if (!duration) return Number.POSITIVE_INFINITY;
    const h = duration.match(/(\d+)\s*h/i);
    const m = duration.match(/(\d+)\s*m/i);
    const hours = h ? Number(h[1]) : 0;
    const mins = m ? Number(m[1]) : 0;
    return hours * 60 + mins;
  };

  const parseDepartureMinutes = (time?: string) => {
    if (!time) return Number.POSITIVE_INFINITY;
    const parts = time.match(/(\d{1,2}):(\d{2})/);
    if (!parts) return Number.POSITIVE_INFINITY;
    return Number(parts[1]) * 60 + Number(parts[2]);
  };

  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (logisticsSortBy === "price") {
      const ap = a.price ?? a.estimatedCost ?? Number.POSITIVE_INFINITY;
      const bp = b.price ?? b.estimatedCost ?? Number.POSITIVE_INFINITY;
      return ap - bp;
    }
    if (logisticsSortBy === "duration") {
      return parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration);
    }
    if (logisticsSortBy === "departure") {
      return parseDepartureMinutes(a.departureTime) - parseDepartureMinutes(b.departureTime);
    }
    const aRecommended = a.isRecommended ? 1 : 0;
    const bRecommended = b.isRecommended ? 1 : 0;
    if (aRecommended !== bRecommended) return bRecommended - aRecommended;
    const ap = a.price ?? a.estimatedCost ?? Number.POSITIVE_INFINITY;
    const bp = b.price ?? b.estimatedCost ?? Number.POSITIVE_INFINITY;
    return ap - bp;
  });

  const allOptions = normalizedOptions;
  const cheapestOption = allOptions.length
    ? [...allOptions].sort((a, b) => (a.price ?? a.estimatedCost ?? Number.POSITIVE_INFINITY) - (b.price ?? b.estimatedCost ?? Number.POSITIVE_INFINITY))[0]
    : null;
  const fastestOption = allOptions.length
    ? [...allOptions].sort((a, b) => parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration))[0]
    : null;
  const bestOverallOption = allOptions.find((o) => o.isRecommended) || cheapestOption || fastestOption;

  const recommendationCardsRaw = [
    { id: "cheapest", label: "Cheapest", option: cheapestOption, icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "fastest", label: "Fastest", option: fastestOption, icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "best", label: "Best Overall", option: bestOverallOption, icon: Star, color: "text-purple-500", bg: "bg-purple-500/10" },
  ].filter((item) => !!item.option);
  const seen = new Set<number>();
  const recommendationCards = recommendationCardsRaw.filter((item) => {
    const key = Number(item.option?.__idx ?? -1);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const allPrices = normalizedOptions.map((o) => o.price ?? o.estimatedCost ?? 0).filter((p: number) => p > 0);
  const cheapestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
  const fastestDuration = normalizedOptions.reduce((acc: string | null, o) => {
    if (!o.duration) return acc;
    return acc ? acc : o.duration;
  }, null);

  const getModeConfig = (mode?: string, normalizedMode?: string) => {
    const m = normalizedMode || mode?.toLowerCase() || '';
    if (m.includes('flight')) return { Icon: Plane, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'FLIGHT', btnClass: 'from-blue-600 to-blue-500' };
    if (m.includes('train')) return { Icon: Train, color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'TRAIN', btnClass: 'from-emerald-600 to-emerald-500' };
    return { Icon: Bus, color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'BUS', btnClass: 'from-orange-600 to-orange-500' };
  };

  const generateDeepLink = (opt: NormalizedTravelOption) => {
    const normalizedMode = opt.__normalizedMode || getNormalizedMode(opt);
    const operator = String(opt.operator || "").toLowerCase();
    const toDest = encodeURIComponent((opt.to || plan.destination || "India").split(",")[0].trim());

    if (normalizedMode === "flight") {
      if (operator.includes("indigo")) return "https://www.goindigo.in/";
      if (operator.includes("air india")) return "https://www.airindia.com/";
      if (operator.includes("spicejet")) return "https://www.spicejet.com/";
      return `https://www.makemytrip.com/flights/?destination=${toDest}`;
    }

    if (normalizedMode === "train") {
      return "https://www.irctc.co.in/nget/train-search";
    }

    if (normalizedMode === "bus") {
      return `https://www.redbus.in/`;
    }

    return `https://www.google.com/search?q=${encodeURIComponent(`book ${opt.mode || "transport"} to ${opt.to || plan.destination || "destination"}`)}`;
  };

  const packingItems = plan.packingList || [];
  const packingCategories = [
    { label: 'ESSENTIALS', items: packingItems.slice(0, Math.ceil(packingItems.length / 2)) },
    { label: 'CLOTHING & GEAR', items: packingItems.slice(Math.ceil(packingItems.length / 2)) },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-muted/30 border border-border/50 w-fit">
        {([
          { id: "transport", label: "Transport" },
          { id: "essentials", label: "Essentials" },
          { id: "insights", label: "Insights" },
        ] as const).map((item) => (
          <button
            key={item.id}
            onClick={() => setLogisticsPanel(item.id)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              logisticsPanel === item.id
                ? "bg-card text-slate-800 dark:text-slate-100 border border-border/50 shadow-card"
                : "text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {logisticsPanel === "transport" && (
        <>
          {/* Stats Summary Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{plan.travelOptions?.length ?? 0}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Options</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{cheapestPrice ? `₹${cheapestPrice.toLocaleString()}` : '—'}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Cheapest</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{fastestDuration ?? '—'}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Fastest</p>
              </div>
            </div>
          </div>

          {/* Decision strip */}
          {recommendationCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendationCards.map((rec) => {
                const Icon = rec.icon;
                const option = rec.option as NormalizedTravelOption;
                const price = option?.price ?? option?.estimatedCost;
                return (
                  <button
                    key={rec.id}
                    onClick={() => window.open(generateDeepLink(option), "_blank")}
                    className="p-4 rounded-2xl border border-border/60 bg-card hover:shadow-card transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`h-8 w-8 rounded-xl ${rec.bg} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${rec.color}`} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{rec.label}</span>
                    </div>
                    <p className="mt-3 text-sm font-black text-slate-800 dark:text-slate-100">{option?.mode || "Option"}</p>
                    <p className="text-xs text-muted-foreground">{option?.from || "From"} → {option?.to || "To"}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">{option?.duration || "Duration N/A"}</span>
                      <span className="text-sm font-black text-primary">{price ? `₹${price.toLocaleString()}` : "—"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-muted/40 backdrop-blur-md rounded-2xl border border-border/50 w-fit">
            {([
              { id: "all", label: "All", count: plan.travelOptions?.length },
              { id: "flights", label: "Flights", count: flights.length },
              { id: "trains", label: "Trains", count: trains.length },
              { id: "buses", label: "Buses", count: buses.length },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setLogisticsTab(t.id as "all" | "flights" | "trains" | "buses")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${logisticsTab === t.id
                  ? "bg-card text-slate-800 dark:text-slate-100 shadow-card border border-border/50"
                  : "text-muted-foreground hover:text-slate-800 dark:text-slate-100"}`}
              >
                {t.label}{t.count && t.count > 0 ? ` (${t.count})` : ''}
              </button>
            ))}
          </div>

          {/* Sort row */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "recommended", label: "Recommended" },
              { id: "price", label: "Price" },
              { id: "duration", label: "Duration" },
              { id: "departure", label: "Departure" },
            ].map((sort) => (
              <button
                key={sort.id}
                onClick={() => setLogisticsSortBy(sort.id as typeof logisticsSortBy)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  logisticsSortBy === sort.id
                    ? "bg-card text-slate-800 dark:text-slate-100 shadow-card border border-border/50"
                    : "bg-muted/40 text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>

          {/* Empty State */}
          {sortedOptions.length === 0 && (
            <div className="py-16 text-center rounded-[32px] border border-dashed border-border/30 bg-card">
              <div className="h-14 w-14 rounded-full bg-muted/30 mx-auto flex items-center justify-center mb-4">
                <AlertTriangle className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No {logisticsTab} options</p>
              <p className="text-xs text-muted-foreground mt-1">Try switching to 'All' to see all transport options.</p>
            </div>
          )}

          {/* BOARDING PASS CARDS */}
          <div className="space-y-5">
            {sortedOptions.map((opt, i: number) => {
              const { Icon, color, bg, label, btnClass } = getModeConfig(opt.mode, opt.__normalizedMode);
              const price = opt.price ?? opt.estimatedCost;
              const operatorName = opt.operator || opt.mode || 'Operator';
              const isRecommended = opt.isRecommended || i === 0;
              const optionKey = Number(opt.id ?? i);
              const isPinned = pinnedLogistics.includes(optionKey);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative"
                >
                  {isRecommended && (
                    <div className="absolute -top-2.5 left-5 z-10 flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg" style={{ background: color, color: '#000' }}>
                      <Sparkles className="h-2.5 w-2.5" /> Best Choice
                    </div>
                  )}

                  <div className="rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card border border-border">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight tracking-tight">{operatorName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md" style={{ background: bg, color }}>
                              {label}
                            </span>
                            {opt.type && <span className="text-[9px] font-bold text-muted-foreground">{opt.type}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">from</p>
                        <p className="text-xl font-black leading-none" style={{ color }}>
                          {price ? `₹${price.toLocaleString()}` : '— '}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">incl. taxes</p>
                      </div>
                    </div>

                    {(opt.rating || (opt.amenities && opt.amenities.length > 0)) && (
                      <div className="flex items-center gap-2 px-5 pb-3">
                        {opt.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-100">{opt.rating}</span>
                          </div>
                        )}
                        {opt.amenities?.slice(0, 3).map((a: string, idx: number) => (
                          <span key={idx} className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mx-5 h-px bg-border/50" />

                    <div className="px-5 py-4 flex items-center justify-between gap-2">
                      <div className="text-left flex-shrink-0">
                        <p className="text-[22px] font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight">{opt.departureTime || '— '}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">{opt.from || '— '}</p>
                        <p className="text-[9px] font-bold mt-0.5" style={{ color }}>{opt.departureTerminal || 'Main Station'}</p>
                      </div>

                      <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[9px] font-black text-muted-foreground">{opt.duration || '— '}</span>
                        <div className="relative w-full flex items-center">
                          <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${color}40, transparent)` }} />
                          <div className="absolute left-0 h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                          <div className="absolute left-1/2 -translate-x-1/2 p-1 rounded-full bg-card border border-border">
                            <Icon className="h-3 w-3" style={{ color }} />
                          </div>
                          <div className="absolute right-0 h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: '#4ade80' }}>On-Time</span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-[22px] font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight">{opt.arrivalTime || '— '}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">{opt.to || '— '}</p>
                        <p className="text-[9px] font-bold text-muted-foreground mt-0.5">{opt.arrivalTerminal || 'Terminal 1'}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {opt.policy && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                              <Shield className="h-3 w-3" /> {opt.policy}
                            </span>
                          )}
                          {opt.availability && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                              <Zap className="h-3 w-3" /> {opt.availability} seats left
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(generateDeepLink(opt), '_blank')}
                        className={`w-full py-3 rounded-2xl bg-gradient-to-r ${btnClass} text-white text-[10px] font-black uppercase tracking-[0.12em] shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all`}
                      >
                        Select {label} <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setPinnedLogistics((prev) =>
                            isPinned ? prev.filter((id) => id !== optionKey) : [...prev, optionKey].slice(-3)
                          )
                        }
                        className="w-full mt-2 py-2 rounded-xl border border-border text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                      >
                        {isPinned ? "Unpin from Compare" : "Pin to Compare"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Compare tray */}
          {pinnedLogistics.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Pinned for Comparison</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sortedOptions
                  .filter((opt, i: number) => pinnedLogistics.includes(Number(opt.id ?? i)))
                  .slice(0, 3)
                  .map((opt, i: number) => {
                    const price = opt.price ?? opt.estimatedCost;
                    return (
                      <div key={`compare-${i}`} className="rounded-xl bg-muted/30 border border-border/40 p-3">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">{opt.mode || "Option"}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{opt.from || "From"} → {opt.to || "To"}</p>
                        <div className="mt-2 flex items-center justify-between text-xs font-bold">
                          <span>{opt.duration || "N/A"}</span>
                          <span className="text-primary">{price ? `₹${price.toLocaleString()}` : "—"}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ON-GROUND MOBILITY */}
      {logisticsPanel === "transport" && plan.localTransport && plan.localTransport.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-primary/10">
              <Car className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100 tracking-tight">On-Ground Mobility</h3>
          </div>

          <div className="space-y-3">
            {plan.localTransport.map((item: LocalTransportOption, i: number) => {
              const isBike = item.mode?.toLowerCase().includes('bike') || item.mode?.toLowerCase().includes('rapido');
              const isAuto = item.mode?.toLowerCase().includes('auto');
              const TransIcon = isBike ? Bike : Car;
              const iconColor = isBike ? '#a78bfa' : isAuto ? '#fb923c' : '#4ade80';
              const iconBg = isBike ? 'rgba(167,139,250,0.12)' : isAuto ? 'rgba(251,146,60,0.12)' : 'rgba(74,222,128,0.12)';
              const appUrl = item.provider?.toLowerCase().includes('uber') ? 'https://www.uber.com'
                : item.provider?.toLowerCase().includes('rapido') ? 'https://www.rapido.bike'
                : 'https://www.olacabs.com';

              return (
                <div key={i} className="flex items-center gap-4 p-4 rounded-[24px] bg-card border border-border">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
                    <TransIcon className="h-6 w-6" style={{ color: iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{item.provider || item.mode}</h4>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {item.availability || 'Available'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{item.mode}</p>
                    {item.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[9px] font-black text-slate-800 dark:text-slate-100">{item.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-black text-primary">₹{item.estimatedDailyCost || '— '}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">/day avg</p>
                    <button
                      onClick={() => window.open(appUrl, '_blank')}
                      className="mt-2 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                      style={{ background: iconBg, color: iconColor }}
                    >
                      Open App <Navigation2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SMART PACKING CHECKLIST */}
      {logisticsPanel === "essentials" && packingItems.length > 0 && (
        <div className="rounded-[32px] overflow-hidden bg-card border border-border">
          <div className="flex items-center justify-between p-5 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-primary/10">
                <Backpack className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">Smart Pack</h3>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              AI Recommended
            </span>
          </div>

          <div className="px-5 pb-5 space-y-5">
            {packingCategories.map((cat, ci) => cat.items.length > 0 && (
              <div key={ci}>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3">{cat.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.items.map((item: string, itemIdx: number) => {
                    const globalIdx = ci * packingCategories[0].items.length + itemIdx;
                    const isChecked = packingChecked.has(globalIdx);
                    return (
                      <button
                        key={itemIdx}
                        onClick={() => setPackingChecked(prev => {
                          const next = new Set(prev);
                          if (next.has(globalIdx)) next.delete(globalIdx);
                          else next.add(globalIdx);
                          return next;
                        })}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${isChecked ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'bg-muted/30 hover:bg-muted/50 ring-1 ring-border/50'}`}
                      >
                        <div className={`h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-emerald-500 shadow-md' : 'bg-muted border border-border/50'}`}>
                          {isChecked && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                        <span className={`text-[10px] font-bold truncate transition-all ${isChecked ? 'text-muted-foreground line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAFETY TIPS */}
      {logisticsPanel === "essentials" && plan.safetyTips && plan.safetyTips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-amber-500/10">
              <Shield className="h-4 w-4 text-orange-400" />
            </div>
            <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">On-Trip Security</h3>
          </div>
          {plan.safetyTips.slice(0, 4).map((tip: string, i: number) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-orange-500/5 border-l-[3px] border-orange-500/40">
              <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">{tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* SMART LOGISTICS INTELLIGENCE */}
      {logisticsPanel === "insights" && (
        <TripTwinSimulator
          plan={plan}
          budget={parseInt(budget)}
          days={days}
          travelers={travelers}
          vibe={vibe}
          onApplyScenario={applyTripTwinScenario}
        />
      )}

      {/* SMART LOGISTICS INTELLIGENCE */}
      {logisticsPanel === "insights" && (
        <div className="rounded-[32px] bg-card border border-border/50 p-6">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Smart Logistics Analysis
          </h3>
          <LogisticsIntelligence options={normalizedOptions} />
        </div>
      )}

      {/* BUDGET ANALYZER */}
      {logisticsPanel === "insights" && (
        <div className="rounded-[32px] bg-card border border-border/50 p-6">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" /> Budget Intelligence
          </h3>
          <BudgetAnalyzer plan={plan} budget={parseInt(budget)} days={days} travelers={travelers} />
        </div>
      )}

      {/* GROUP EXPENSE SPLITTER */}
      {logisticsPanel === "insights" && (
        <div className="rounded-[32px] bg-card border border-border/50 p-6">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Group Expense Splitter
          </h3>
          <GroupExpenseSplitter 
            travelers={travelers} 
            totalBudget={parseInt(budget)} 
            currentSpend={plan.budgetHealth?.totalEstimated || 0}
          />
        </div>
      )}

      {/* PRICE WATCH & ALERTS */}
      {logisticsPanel === "insights" && (
        <div className="rounded-[32px] bg-card border border-border/50 p-6">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" /> Price Watch & Alerts
          </h3>
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="font-bold text-blue-900 dark:text-blue-200 mb-2">💰 Current Flight Price</div>
              <div className="text-2xl font-black text-blue-600">₹{plan.travelOptions?.[0]?.price || plan.travelOptions?.[0]?.estimatedCost || "N/A"}</div>
              <div className="text-xs text-blue-800 dark:text-blue-300 mt-2">
                ✓ Prices typically drop 10-15% when booked 2-3 weeks in advance. Set a price alert below.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Alert price"
                defaultValue={plan.travelOptions?.[0]?.price ? Math.round((plan.travelOptions[0].price || 0) * 0.9) : ""}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-bold"
              />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all">
                Set Alert
              </button>
            </div>
            <p className="text-xs text-muted-foreground italic">
              💡 AI Tip: Best booking window is 21-35 days before travel for domestic flights.
            </p>
          </div>
        </div>
      )}

      {/* TRIP COLLABORATION */}
      {logisticsPanel === "insights" && (
        <div className="rounded-[32px] bg-card border border-border/50 p-6">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Trip Collaboration & Voting
          </h3>
          <TripCollaboration />
        </div>
      )}

      {logisticsPanel === "essentials" && (!packingItems.length && !(plan.safetyTips && plan.safetyTips.length > 0)) && (
        <div className="rounded-2xl border border-dashed border-border/40 bg-card p-8 text-center">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No essentials generated yet</p>
          <p className="text-xs text-muted-foreground mt-1">Generate or adjust your trip plan to get smart packing and safety tips.</p>
        </div>
      )}
    </div>
  );
};
