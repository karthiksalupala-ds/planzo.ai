import { TravelOption } from "@/types/trip-plan";
import { motion } from "framer-motion";
import { Zap, Gauge, Heart, Leaf, AlertCircle } from "lucide-react";

interface NormalizedTravelOption extends TravelOption {
  __idx: number;
  __normalizedMode: "flight" | "train" | "bus";
}

interface LogisticsIntelligenceProps {
  options: NormalizedTravelOption[];
  selectedOptions?: number[];
  onSelect?: (idx: number) => void;
}

export const LogisticsIntelligence = ({ options, selectedOptions = [], onSelect }: LogisticsIntelligenceProps) => {
  if (!options.length) return null;

  // Helper: Parse duration string to minutes
  const parseDurationToMinutes = (duration?: string) => {
    if (!duration) return null;
    const h = duration.match(/(\d+)\s*h/i);
    const m = duration.match(/(\d+)\s*m/i);
    const hours = h ? Number(h[1]) : 0;
    const mins = m ? Number(m[1]) : 0;
    return hours * 60 + mins;
  };

  // Calculate value score: (duration_minutes / price) - lower is better value
  const getValueScore = (opt: NormalizedTravelOption) => {
    const price = opt.price || opt.estimatedCost || 10000;
    const durationMin = parseDurationToMinutes(opt.duration);
    if (!durationMin || durationMin === Infinity) return 0;
    return (durationMin / price) * 1000; // Normalize for display
  };

  // Comfort score based on amenities and rating
  const getComfortScore = (opt: NormalizedTravelOption) => {
    let score = (opt.rating || 3.5) * 20; // Base on rating
    if (opt.amenities?.length) score += Math.min(opt.amenities.length * 5, 30);
    if (opt.type?.includes("Sleeper") || opt.type?.includes("AC")) score += 10;
    return Math.min(score, 100);
  };

  // Speed score (lower duration is better)
  const getSpeedScore = (opt: NormalizedTravelOption) => {
    const durationMin = parseDurationToMinutes(opt.duration) || 999;
    const minDuration = Math.min(...options.map(o => parseDurationToMinutes(o.duration) || 999));
    return Math.max(0, 100 - ((durationMin - minDuration) / minDuration) * 100);
  };

  // Eco score (trains best, then buses, then flights)
  const getEcoScore = (mode?: string) => {
    if (mode?.includes("train")) return 85;
    if (mode?.includes("bus")) return 65;
    return 35;
  };

  const scoredOptions = options.map(opt => ({
    ...opt,
    value: getValueScore(opt),
    comfort: getComfortScore(opt),
    speed: getSpeedScore(opt),
    eco: getEcoScore(opt.__normalizedMode),
  }));

  const bestValue = [...scoredOptions].sort((a, b) => a.value - b.value)[0];
  const bestComfort = [...scoredOptions].sort((a, b) => b.comfort - a.comfort)[0];
  const bestSpeed = [...scoredOptions].sort((a, b) => b.speed - a.speed)[0];
  const bestEco = [...scoredOptions].sort((a, b) => b.eco - a.eco)[0];

  return (
    <div className="space-y-6">
      {/* Smart Recommendations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RecommendationCard
          label="Best Value"
          icon={Gauge}
          option={bestValue}
          score={bestValue.value.toFixed(1)}
          tooltip="Best cost-to-time ratio"
          color="from-emerald-500 to-emerald-600"
        />
        <RecommendationCard
          label="Most Comfortable"
          icon={Heart}
          option={bestComfort}
          score={bestComfort.comfort.toFixed(0)}
          tooltip="Best amenities & rating"
          color="from-pink-500 to-pink-600"
          isPercent
        />
        <RecommendationCard
          label="Fastest"
          icon={Zap}
          option={bestSpeed}
          score={bestSpeed.speed.toFixed(0)}
          tooltip="Shortest travel time"
          color="from-blue-500 to-blue-600"
          isPercent
        />
        <RecommendationCard
          label="Most Eco"
          icon={Leaf}
          option={bestEco}
          score={bestEco.eco.toFixed(0)}
          tooltip="Lowest carbon footprint"
          color="from-teal-500 to-teal-600"
          isPercent
        />
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm">All Options Analyzed</h4>
        {scoredOptions.map((opt, idx) => {
          const isSelected = selectedOptions.includes(idx);
          const price = opt.price || opt.estimatedCost || "N/A";
          
          return (
            <motion.button
              key={opt.__idx}
              onClick={() => onSelect?.(idx)}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-card hover:border-primary/50 hover:bg-card/80"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Mode & Basic Info */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm">
                      {opt.mode ? `${opt.mode} (${opt.operator || "Various"})` : "Transport Option"}
                    </div>
                    {opt.rating && <span className="text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 px-2 py-1 rounded">⭐ {opt.rating}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      {opt.departureTime} - {opt.arrivalTime} ({opt.duration})
                    </div>
                    {opt.type && <div className="text-xs">{opt.type}</div>}
                    {opt.policy && <div className="text-xs text-muted-foreground">{opt.policy}</div>}
                  </div>
                </div>

                {/* Right: Scores & Price */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-lg text-primary">
                      ₹{typeof price === "number" ? price.toLocaleString() : price}
                    </span>
                    {opt.availability && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                        {opt.availability} seats
                      </span>
                    )}
                  </div>

                  {/* Score Bars */}
                  <div className="space-y-1.5 text-xs">
                    <ScoreBar label="Value" value={opt.value} max={50} color="emerald" />
                    <ScoreBar label="Comfort" value={opt.comfort} max={100} color="pink" />
                    <ScoreBar label="Speed" value={opt.speed} max={100} color="blue" />
                    <ScoreBar label="Eco" value={opt.eco} max={100} color="teal" />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {opt.amenities && opt.amenities.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-1.5">
                  {opt.amenities.map((amenity, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Price Trend Alert */}
      {scoredOptions.length > 1 && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-blue-900 dark:text-blue-200 text-sm">Price Insight</div>
            <div className="text-xs text-blue-800 dark:text-blue-300 mt-1">
              Prices typically drop 10-15% when booked 2-3 weeks in advance. Current options show {scoredOptions.length} available options.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RecommendationCardProps {
  label: string;
  icon: any;
  option: any;
  score: string;
  tooltip: string;
  color: string;
  isPercent?: boolean;
}

const RecommendationCard = ({ label, icon: Icon, option, score, tooltip, color, isPercent }: RecommendationCardProps) => (
  <motion.div
    initial={{ y: 10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className={`p-3 rounded-lg bg-gradient-to-br ${color} text-white border border-white/20 cursor-pointer hover:shadow-lg transition-all group`}
    title={tooltip}
  >
    <div className="flex items-center justify-between mb-2">
      <Icon className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
      <span className="text-lg font-black">{score}{isPercent ? "%" : ""}</span>
    </div>
    <div className="text-xs font-bold opacity-90">{label}</div>
    <div className="text-[10px] opacity-70 mt-1 truncate">{option.mode || "Transport"}</div>
  </motion.div>
);

const ScoreBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClass = {
    emerald: "bg-emerald-500",
    pink: "bg-pink-500",
    blue: "bg-blue-500",
    teal: "bg-teal-500",
  }[color] || "bg-primary";

  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-muted-foreground text-[10px] font-semibold">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full ${colorClass}`}
        />
      </div>
      <span className="w-6 text-right text-[10px] font-bold">{value.toFixed(0)}</span>
    </div>
  );
};
