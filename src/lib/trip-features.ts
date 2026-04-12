import type { Tables } from "@/integrations/supabase/types";
import type { TripPlan } from "@/types/trip-plan";

export type TripCollaborator = Tables<"trip_collaborators">;
export type TripMessage = Tables<"trip_messages">;
export type TripVote = Tables<"trip_votes">;
export type TripExpenseSplit = Tables<"trip_expense_splits">;
export type TripPriceWatch = Tables<"trip_price_watches">;

export interface ActivityVoteSummary {
  score: number;
  upvotes: number;
  downvotes: number;
  voters: string[];
}

export interface PlanActivityRef {
  day: number;
  key: string;
  label: string;
}

export interface WeatherAdjustment {
  severity: "low" | "medium" | "high";
  title: string;
  summary: string;
  actions: string[];
}

export const toActorName = (name?: string | null, email?: string | null) => {
  if (name && name.trim()) return name.trim();
  if (email && email.trim()) return email.trim().split("@")[0];
  return "Traveler";
};

export const toVoterKey = (userId?: string | null, displayName?: string | null, email?: string | null) => {
  if (userId) return `user:${userId}`;
  return `guest:${toActorName(displayName, email).toLowerCase()}`;
};

export const summarizeVotes = (votes: TripVote[]) => {
  return votes.reduce<Record<string, ActivityVoteSummary>>((acc, vote) => {
    const current = acc[vote.subject_key] || {
      score: 0,
      upvotes: 0,
      downvotes: 0,
      voters: [],
    };

    current.score += vote.vote_value;
    if (vote.vote_value > 0) current.upvotes += 1;
    if (vote.vote_value < 0) current.downvotes += 1;
    current.voters = Array.from(new Set([...current.voters, vote.voter_name]));
    acc[vote.subject_key] = current;
    return acc;
  }, {});
};

export const extractPlanActivities = (plan: TripPlan): PlanActivityRef[] => {
  return (plan.itinerary || []).flatMap((day) =>
    (day.activities || []).map((activity, index) => ({
      day: day.day,
      key: `day-${day.day}-activity-${index}`,
      label: typeof activity === "string" ? activity : activity.name || activity.place || `Stop ${index + 1}`,
    }))
  );
};

const containsAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword));

export const getWeatherAdjustment = (weatherNote?: string | null): WeatherAdjustment | null => {
  if (!weatherNote?.trim()) return null;

  const note = weatherNote.toLowerCase();

  if (containsAny(note, ["storm", "thunder", "heavy rain", "rain", "showers"])) {
    return {
      severity: containsAny(note, ["storm", "thunder", "heavy rain"]) ? "high" : "medium",
      title: "Rain-aware replanning suggested",
      summary: "Shift exposed outdoor stops earlier, protect commute windows, and keep an indoor fallback ready.",
      actions: [
        "Move long outdoor sightseeing to the driest half of the day.",
        "Prioritize cafes, museums, covered markets, and scenic indoor food stops if rain starts.",
        "Keep 20 to 30 minutes of buffer between stops for slower traffic and ride-hailing delays.",
      ],
    };
  }

  if (containsAny(note, ["heat", "hot", "34°", "35°", "36°", "37°", "38°", "39°", "40°"])) {
    return {
      severity: "medium",
      title: "Heat-aware pacing suggested",
      summary: "Protect midday energy and hydration by front-loading sightseeing and reserving lower-effort stops for the afternoon.",
      actions: [
        "Schedule landmarks and walking-heavy stops before 11 AM or after 4 PM.",
        "Use a shaded lunch break and a lower-effort afternoon slot.",
        "Add hydration, sunscreen, and short cooling breaks between activities.",
      ],
    };
  }

  if (containsAny(note, ["cold", "wind", "fog"])) {
    return {
      severity: "low",
      title: "Cool-weather adjustments available",
      summary: "Keep transit and visibility in mind, especially for sunrise views and long-distance movement days.",
      actions: [
        "Start slightly later on fog-prone mornings if viewpoints depend on visibility.",
        "Favor warm indoor meal stops near long commute segments.",
        "Carry one extra layer and leave more time for hill or mountain transport.",
      ],
    };
  }

  return {
    severity: "low",
    title: "Weather check complete",
    summary: "The current forecast looks manageable, but a few practical adjustments can still reduce friction.",
    actions: [
      "Keep one flexible slot each day for local weather changes.",
      "Confirm the next day's first stop and transport plan the night before.",
      "Carry a light layer, hydration, and a compact weather backup item.",
    ],
  };
};

export const applyWeatherAdjustmentToPlan = (plan: TripPlan): TripPlan => {
  const adjustment = getWeatherAdjustment(plan.weatherNote);
  if (!adjustment || !plan.itinerary?.length) return plan;

  return {
    ...plan,
    itinerary: plan.itinerary.map((day, index) => {
      const pacingHint =
        adjustment.severity === "high"
          ? "Protect one indoor backup stop and keep transfer buffers wider than usual."
          : adjustment.severity === "medium"
            ? "Use a lighter midday block and keep the highest-effort stop in the coolest window."
            : "Keep the first stop flexible in case local conditions shift.";

      const weatherNote = `Weather-smart update for day ${day.day}: ${adjustment.actions[index % adjustment.actions.length]} ${pacingHint}`;

      return {
        ...day,
        userNotes: day.userNotes ? `${day.userNotes} ${weatherNote}` : weatherNote,
      };
    }),
  };
};

export const getSuggestedPriceWatches = (plan: TripPlan) => {
  const transportSuggestions = (plan.travelOptions || [])
    .slice(0, 3)
    .map((option, index) => {
      const current = Number(option.price ?? option.estimatedCost ?? 0);
      if (!current) return null;
      return {
        label: `${option.mode || "Transport"} ${option.from || ""} ${option.to ? `to ${option.to}` : ""}`.trim(),
        category: "transport",
        baseline_price: current,
        current_price: current,
        target_price: Math.max(0, Math.round(current * 0.92)),
        notes: index === 0 ? "Seeded from the current trip logistics estimate." : null,
      };
    })
    .filter(Boolean);

  const stayEstimate = Number(plan.budgetBreakdown?.accommodation || 0);
  const nights = Math.max((plan.itinerary?.length || 1) - 1, 1);
  const nightlyRate = stayEstimate ? Math.round(stayEstimate / nights) : 0;
  const staySuggestion = nightlyRate
    ? [{
        label: "Stay nightly target",
        category: "stay",
        baseline_price: nightlyRate,
        current_price: nightlyRate,
        target_price: Math.max(0, Math.round(nightlyRate * 0.9)),
        notes: "Derived from your accommodation budget per night.",
      }]
    : [];

  return [...transportSuggestions, ...staySuggestion] as Array<{
    label: string;
    category: "transport" | "stay";
    baseline_price: number;
    current_price: number;
    target_price: number;
    notes: string | null;
  }>;
};

export const getPriceWatchMeta = (watch: TripPriceWatch) => {
  const delta = Number(watch.current_price) - Number(watch.baseline_price);
  const hitTarget = Number(watch.current_price) <= Number(watch.target_price);
  const dropped = delta < 0;

  return {
    delta,
    dropped,
    hitTarget,
    tone: hitTarget ? "alert" : dropped ? "good" : delta > 0 ? "warning" : "neutral",
  };
};
