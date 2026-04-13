import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "https://planzo.ai,https://planzoai.vercel.app,http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const resolveCorsOrigin = (origin: string | null) => {
  if (origin && allowedOrigins.includes(origin)) return origin;
  return allowedOrigins[0] || "https://planzo.ai";
};

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": resolveCorsOrigin(origin),
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
});


serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plannedBudget, actualExpenses, tripTitle, mood, days } =
      await req.json();

    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const AI_API_URL =
      Deno.env.get("AI_API_URL") ||
      "https://openrouter.ai/api/v1/chat/completions";
    const AI_MODEL = Deno.env.get("AI_MODEL") || "meta-llama/llama-3-70b-instruct";

    if (!AI_API_KEY) {
      throw new Error(
        "AI_API_KEY is not configured. Please set the AI_API_KEY environment variable."
      );
    }

    const systemPrompt = `You are a friendly post-trip financial coach for Indian travelers.
Analyze the user's planned vs actual spending and give actionable, culturally-relevant tips.

ALWAYS respond with valid JSON in this exact structure:
{
  "overallScore": 85,
  "scoreLabel": "Great Budget Control!",
  "totalPlanned": "₹X,XXX",
  "totalSpent": "₹X,XXX",
  "savings": "₹X,XXX",
  "categoryBreakdown": [
    {
      "category": "food",
      "planned": 3000,
      "actual": 3450,
      "verdict": "over",
      "tip": "Try local dhabas next time — same taste, 40% cheaper than tourist restaurants"
    }
  ],
  "topInsights": [
    "You overspent on food by 15% — next trip, try street food at local markets",
    "Transport was well managed — booking in advance saved you ₹800"
  ],
  "nextTripTips": [
    "Book hotels on weekdays for 20-30% discount",
    "Use local buses instead of cabs for short distances"
  ],
  "budgetGrade": "B+"
}

Score should be 0-100 based on how close actual spending was to planned.
Be specific with Indian context (mention dhabas, autos, local tips).
Keep insights fun and encouraging, not preachy.`;

    const userPrompt = `Trip: ${tripTitle} (${days} days, ${mood} mood)

Planned Budget: ${JSON.stringify(plannedBudget)}

Actual Expenses: ${JSON.stringify(actualExpenses)}

Analyze my spending and give me coaching tips for my next trip.`;

    const aiResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again later.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add credits.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data: {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    } = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Robust JSON extraction
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
      // Parse and re-stringify to ensure we send valid JSON
      const parsed = JSON.parse(jsonString);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("post-trip-coach failed to parse AI response:", jsonString.substring(0, 500));
      throw new Error("AI returned invalid JSON");
    }
  } catch (e) {
    console.error("post-trip-coach error:", e);

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
