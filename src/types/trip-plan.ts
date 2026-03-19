export interface TripActivity {
  name?: string;
  place?: string;
  imageSearchQuery?: string;
  image?: string;
  lat?: number;
  lng?: number;
}

export interface TripDay {
  day: number;
  title: string;
  heroImage?: string;
  activities?: Array<TripActivity | string>;
  meals?: Record<string, string>;
  tips?: string;
  userNotes?: string;
}

export interface BudgetHealth {
  status?: string;
  totalEstimated?: number;
  userBudget?: number;
  usagePercentage?: number;
  remaining?: number | string;
  emergencyBuffer?: number;
  withinBudget?: boolean;
}

export interface BudgetBreakdown {
  accommodation?: number;
  food?: number;
  activities?: number;
  transport?: number;
  miscellaneous?: number;
}

export interface TravelOption {
  mode?: string;
  from?: string;
  to?: string;
  estimatedCost?: number;
  duration?: string;
}

export interface LocalTransportOption {
  mode?: string;
  estimatedDailyCost?: number;
  notes?: string;
}

export interface TripPlan {
  [key: string]: unknown;
  destination?: string;
  summary?: string;
  destinationImage?: string;
  itinerary?: TripDay[];
  budget?: {
    total?: string | number;
  };
  budgetHealth?: BudgetHealth;
  budgetBreakdown?: BudgetBreakdown;
  adjustments?: string[];
  travelOptions?: TravelOption[];
  localTransport?: LocalTransportOption[];
  packingList?: string[];
  safetyTips?: string[];
  map?: {
    lat?: number;
    lng?: number;
    embedUrl?: string;
  };
  weatherNote?: string;
}

export interface CategoryCoaching {
  category: string;
  planned?: number;
  actual?: number;
  verdict?: string;
  tip?: string;
}

export interface ExpenseCoaching {
  overallScore?: number | string;
  scoreLabel?: string;
  totalPlanned?: string;
  totalSpent?: string;
  savings?: string;
  budgetGrade?: string;
  categoryBreakdown?: CategoryCoaching[];
  topInsights?: string[];
  nextTripTips?: string[];
}
