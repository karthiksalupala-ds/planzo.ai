import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ───────────────────────────────────────────────────────────
interface TripRequest {
  query: string;
  budget?: number;
  travelers?: number;
  days?: number;
}

interface TripResponse {
  destination: string;
  summary: string;
  mood: string;
  budgetHealth: {
    status: string;
    totalEstimated: number;
    userBudget: number;
    usagePercentage: number;
    remaining: number;
    emergencyBuffer: number;
    withinBudget: boolean;
  };
  budgetBreakdown: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
    miscellaneous: number;
  };
  travelOptions: { mode: string; from: string; to: string; estimatedCost: number; duration: string }[];
  localTransport: { mode: string; estimatedDailyCost: number; notes: string }[];
  destinationImage: string;
  map: { lat: number | null; lng: number | null; embedUrl: string };
  itinerary: {
    day: number;
    title: string;
    heroImage: string;
    activities: { name: string; place: string; imageSearchQuery: string; image: string; lat: number | null; lng: number | null }[];
    meals: { breakfast: string; lunch: string; dinner: string };
    tips: string;
  }[];
  packingList: string[];
  safetyTips: string[];
  bestTimeToVisit: string;
  weatherNote: string;
}

interface AIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface WeatherForecastDay {
  day: {
    avgtemp_c: number;
    daily_chance_of_rain: number;
  };
}

interface WeatherApiResponse {
  current?: {
    condition?: {
      text?: string;
    };
    temp_c?: number;
    humidity?: number;
  };
  forecast?: {
    forecastday?: WeatherForecastDay[];
  };
}

interface RegenerateRequestBody extends TripRequest {
  dayToRegenerate?: number;
  existingPlan?: TripResponse;
}

class AIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AIError';
  }
}

const FALLBACK_IMAGE = "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800";

// ─── 1. Generate Trip via AI ─────────────────────────────────────────
async function generateTrip(req: TripRequest): Promise<TripResponse> {
  const AI_API_KEY = Deno.env.get("AI_API_KEY");
  if (!AI_API_KEY) throw new Error("AI_API_KEY not configured");

  const systemPrompt = `You are a professional travel planning AI. Given a user's travel query, generate a comprehensive trip plan.
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "destination": "string",
  "summary": "string (2-3 sentence overview)",
  "mood": "string (e.g. Adventurous, Relaxing, Cultural)",
  "budgetBreakdown": { "accommodation": number, "food": number, "transport": number, "activities": number, "miscellaneous": number },
  "travelOptions": [{ "mode": "string", "from": "string", "to": "string", "estimatedCost": number, "duration": "string" }],
  "localTransport": [{ "mode": "string", "estimatedDailyCost": number, "notes": "string (e.g., 'Best for short distances, convenient but can be slow in traffic.')" }],
  "itinerary": [{ 
    "day": number, 
    "title": "string", 
    "activities": [{ "name": "string", "place": "string", "imageSearchQuery": "string (descriptive, for Pexels API)", "lat": number, "lng": number }],
    "meals": { "breakfast": "string", "lunch": "string", "dinner": "string" },
    "tips": "string"
  }],
  "packingList": ["string"],
  "safetyTips": ["string"],
  "bestTimeToVisit": "string",
  "map": { "lat": number, "lng": number }
}
Budget values must be in INR (₹). Be specific with place names, coordinates, and image search queries. Generate ${req.days || 3} days of itinerary for ${req.travelers || 2} travelers.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      "HTTP-Referer": "https://planzo.ai",
      "X-Title": "Planzo AI",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3-70b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: req.query },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    throw new AIError(`AI error: ${response.status}`, response.status);
  }

  const data: AIChatCompletionResponse = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // AI can sometimes return JSON within markdown fences or with extra text.
  // This logic robustly extracts the JSON object.
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  let jsonString = content;

  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1];
  }

  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  // Remove trailing commas which are common in LLM JSON
  jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(jsonString);
  } catch {
    console.error("Failed to parse AI response:", jsonString.substring(0, 500));
    throw new Error("AI returned invalid JSON");
  }
}

// ─── 2. Validate & Enforce Budget ────────────────────────────────────
function validateBudget(trip: TripResponse, userBudget: number): TripResponse {
  const breakdown = trip.budgetBreakdown;
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const bufferPercent = 0.08; // 8% emergency buffer
  const buffer = Math.round(total * bufferPercent);
  const totalWithBuffer = total + buffer;

  let adjustedBreakdown = { ...breakdown };
  let adjustedTravel = [...(trip.travelOptions || [])];

  if (totalWithBuffer > userBudget) {
    const ratio = (userBudget * 0.92) / total; // leave room for buffer

    // Downgrade strategy
    adjustedBreakdown = {
      accommodation: Math.round(breakdown.accommodation * Math.min(ratio, 0.7)),
      food: Math.round(breakdown.food * Math.min(ratio, 0.8)),
      transport: Math.round(breakdown.transport * Math.min(ratio, 0.75)),
      activities: Math.round(breakdown.activities * Math.min(ratio, 0.85)),
      miscellaneous: Math.round(breakdown.miscellaneous * ratio),
    };

    // Downgrade travel: flights → trains/buses
    adjustedTravel = adjustedTravel.map((opt) => {
      if (opt.mode.toLowerCase() === "flight" && ratio < 0.8) {
        return { ...opt, mode: "Train", estimatedCost: Math.round(opt.estimatedCost * 0.4), duration: "8-12 hours" };
      }
      if (opt.mode.toLowerCase() === "flight" && ratio < 0.95) {
        return { ...opt, mode: "Bus", estimatedCost: Math.round(opt.estimatedCost * 0.25), duration: "10-16 hours" };
      }
      return opt;
    });
  }

  const adjustedTotal = Object.values(adjustedBreakdown).reduce((a, b) => a + b, 0);
  const adjustedBuffer = Math.round(adjustedTotal * bufferPercent);
  const usagePercentage = userBudget > 0 ? Math.round((adjustedTotal / userBudget) * 100) : 0;
  const remaining = userBudget - adjustedTotal;

  let status = "🟢 Within Budget";
  if (usagePercentage > 100) {
    status = "🔴 Over Budget";
  } else if (usagePercentage > 85) {
    status = "🟡 Near Budget";
  }

  return {
    ...trip,
    budgetBreakdown: adjustedBreakdown,
    travelOptions: adjustedTravel,
    budgetHealth: {
      status,
      totalEstimated: adjustedTotal,
      userBudget,
      usagePercentage,
      remaining,
      emergencyBuffer: adjustedBuffer,
      withinBudget: adjustedTotal + adjustedBuffer <= userBudget,
    },
  };
}

// ─── 2a. Regenerate a Single Day via AI ──────────────────────────────
async function regenerateSingleDay(
  existingPlan: TripResponse,
  dayIndex: number,
  originalRequest: TripRequest,
): Promise<TripResponse["itinerary"][number]> {
  const AI_API_KEY = Deno.env.get("AI_API_KEY");
  if (!AI_API_KEY) throw new Error("AI_API_KEY not configured");

  const dayToRegenerate = dayIndex + 1; // 1-based for prompt

  const systemPrompt = `You are a professional travel planning AI. You are tasked with regenerating a single day of an existing itinerary.
- The user's original request was for a ${originalRequest.days}-day trip to ${existingPlan.destination} for ${originalRequest.travelers} people with a budget of ${originalRequest.budget} INR and a mood of "${existingPlan.mood}".
- Do NOT repeat activities from other days.
- Provide a fresh and interesting alternative for Day ${dayToRegenerate}.
- Return ONLY a single valid JSON object for the regenerated day, matching this exact schema (no markdown, no explanation):
{ 
  "day": ${dayToRegenerate}, 
  "title": "string", 
  "activities": [{ "name": "string", "place": "string", "imageSearchQuery": "string (descriptive, for Pexels API)", "lat": number, "lng": number }],
  "meals": { "breakfast": "string", "lunch": "string", "dinner": "string" },
  "tips": "string"
}`;

  const contextMessage = `Here is the existing itinerary for context (you are regenerating Day ${dayToRegenerate}):\n${JSON.stringify(existingPlan.itinerary.map(d => ({day: d.day, title: d.title, activities: d.activities.map(a => a.name)})) , null, 2)}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          "HTTP-Referer": "https://planzo.ai",
          "X-Title": "Planzo AI",
          "Content-Type": "application/json",
      },
      body: JSON.stringify({
          model: "meta-llama/llama-3-70b-instruct",
          messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: contextMessage },
          ],
          temperature: 0.8,
          response_format: { type: "json_object" },
      }),
  });

  if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error (regenerate):", response.status, errText);
      throw new AIError(`AI error: ${response.status}`, response.status);
  }

  const data: AIChatCompletionResponse = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
      const newDay = JSON.parse(content);
      newDay.day = dayToRegenerate; // Ensure day number is correct
      return newDay;
  } catch {
      console.error("Failed to parse AI response (regenerate):", content.substring(0, 500));
      throw new Error("AI returned invalid JSON for day regeneration");
  }
}

// ─── 3. Fetch Images from Pexels ─────────────────────────────────────
async function fetchImages(trip: TripResponse): Promise<TripResponse> {
  const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
  if (!PEXELS_API_KEY) {
    console.warn("PEXELS_API_KEY not set, using fallback images");
    trip.destinationImage = FALLBACK_IMAGE;
    trip.itinerary = trip.itinerary.map((day) => ({
      ...day,
      heroImage: FALLBACK_IMAGE,
      activities: day.activities.map((a) => ({ ...a, image: FALLBACK_IMAGE })),
    }));
    return trip;
  }

  async function searchPexels(query: string): Promise<string> {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY! } }
      );
      if (!res.ok) return FALLBACK_IMAGE;
      const data = await res.json() as { photos?: Array<{ src?: { large2x?: string; large?: string } }> };
      if (!data.photos || data.photos.length === 0) return FALLBACK_IMAGE;

      // Pick a random photo from the results to increase variety
      const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
      return randomPhoto.src?.large2x || randomPhoto.src?.large || FALLBACK_IMAGE;
    } catch {
      return FALLBACK_IMAGE;
    }
  }

  // Fetch destination hero image
  trip.destinationImage = await searchPexels(`${trip.destination} travel landmark`);

  // Fetch itinerary images in parallel
  const updatedItinerary = await Promise.all(
    trip.itinerary.map(async (day) => {
      const heroImage = await searchPexels(`${trip.destination} ${day.title}`);
      const activities = await Promise.all(
        day.activities.map(async (act) => ({
          ...act,
          image: await searchPexels(act.imageSearchQuery || `${act.place || act.name} ${trip.destination}`),
        }))
      );
      return { ...day, heroImage, activities };
    })
  );

  trip.itinerary = updatedItinerary;
  return trip;
}

// ─── 4. Fetch Weather ────────────────────────────────────────────────
async function fetchWeather(trip: TripResponse): Promise<TripResponse> {
  const WEATHER_API_KEY = Deno.env.get("WEATHER_API_KEY");
  if (!WEATHER_API_KEY) {
    trip.weatherNote = "Weather data unavailable. Pack for varied conditions.";
    return trip;
  }

  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(trip.destination)}&days=3&aqi=no`
    );

    if (!res.ok) {
      trip.weatherNote = "Weather data temporarily unavailable.";
      return trip;
    }

    const data = await res.json() as WeatherApiResponse;
    const current = data.current;
    const forecast = data.forecast?.forecastday || [];

    const conditions = current?.condition?.text || "Unknown";
    const tempC = current?.temp_c ?? "N/A";
    const humidity = current?.humidity ?? "N/A";

    let weatherNote = `Current: ${conditions}, ${tempC}°C, ${humidity}% humidity.`;

    if (forecast.length > 0) {
      const avgTemp = Math.round(
        forecast.reduce((sum: number, d: WeatherForecastDay) => sum + d.day.avgtemp_c, 0) / forecast.length
      );
      const willRain = forecast.some((d: WeatherForecastDay) => d.day.daily_chance_of_rain > 50);
      weatherNote += ` Forecast avg: ${avgTemp}°C.`;
      if (willRain) {
        weatherNote += " Rain expected — carry an umbrella.";
        if (!trip.safetyTips.some((t) => t.toLowerCase().includes("rain"))) {
          trip.safetyTips.push("Rain is expected during your trip. Carry waterproof gear and plan indoor backup activities.");
        }
      }
    }

    trip.weatherNote = weatherNote;
  } catch (e) {
    console.error("Weather fetch error:", e);
    trip.weatherNote = "Weather data temporarily unavailable.";
  }

  return trip;
}

// ─── 5. Generate Map Data ────────────────────────────────────────────
function generateMapData(trip: TripResponse): TripResponse {
  const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("GOOGLE_MAPS_API_KEY is not set. Map embed will not work correctly.");
  }

  const lat = trip.map?.lat ?? null;
  const lng = trip.map?.lng ?? null;

  trip.map = {
    lat,
    lng,
    embedUrl: `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(trip.destination)}&zoom=11`,
  };

  // Ensure all activities have coordinates
  trip.itinerary = trip.itinerary.map((day) => ({
    ...day,
    activities: day.activities.map((act) => ({
      ...act,
      lat: act.lat ?? lat,
      lng: act.lng ?? lng,
    })),
  }));

  return trip;
}

// ─── Main Handler ────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RegenerateRequestBody = await req.json();

    // New logic for regenerating a single day
    if (body.dayToRegenerate !== undefined && body.existingPlan) {
      console.log(`[plan-trip] Regenerating day ${body.dayToRegenerate} for: "${body.existingPlan.destination}"`);
      
      let newDay = await regenerateSingleDay(body.existingPlan, body.dayToRegenerate, body);

      // We need to fetch images for this new day.
      // Create a temporary trip object for fetchImages function.
      const tempTrip = { 
        ...body.existingPlan, 
        itinerary: [newDay] 
      };
      const tripWithImages = await fetchImages(tempTrip);
      newDay = tripWithImages.itinerary[0];

      // Also need to ensure lat/lng are present from the main plan
      newDay.activities = newDay.activities.map((act) => ({
        ...act,
        lat: act.lat ?? body.existingPlan.map.lat,
        lng: act.lng ?? body.existingPlan.map.lng,
      }));

      console.log(`[plan-trip] Done regenerating day ${newDay.day}`);

      return new Response(JSON.stringify(newDay), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Existing logic for full plan generation
    if (!body.query?.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userBudget = Number(body.budget) || 15000;

    console.log(`[plan-trip] Generating trip for: "${body.query}"`);

    // Step 1: AI generates raw trip
    let trip = await generateTrip(body);

    // Step 2: Validate and enforce budget
    trip = validateBudget(trip, userBudget);

    // Step 3-5: Fetch images, weather, map data in parallel
    const [withImages, withWeather] = await Promise.all([
      fetchImages(trip),
      fetchWeather({ ...trip }),
    ]);

    // Merge weather into image-enriched result
    trip = {
      ...withImages,
      weatherNote: withWeather.weatherNote,
      safetyTips: [...new Set([...withImages.safetyTips, ...withWeather.safetyTips])],
    };

    // Step 5: Generate map data (sync, no API needed)
    trip = generateMapData(trip);

    console.log(`[plan-trip] Done: ${trip.destination}, ${trip.itinerary?.length} days`);

    return new Response(JSON.stringify(trip), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[plan-trip] Error:", e);

    const status = e instanceof AIError ? e.status : 500;

    const message = status === 429 ? "Rate limit exceeded. Please try again shortly."
      : status === 402 ? "AI credits exhausted. Please add funds."
      : e instanceof Error ? e.message.split('\n')[0] : "Internal server error";

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
