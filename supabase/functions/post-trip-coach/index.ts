import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plannedBudget, actualExpenses, tripTitle, mood, days } =
      await req.json();

    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const AI_API_URL =
      Deno.env.get("AI_API_URL") ||
      "https://api.groq.com/openai/v1/chat/completions";
    const AI_MODEL = Deno.env.get("AI_MODEL") || "llama3-8b-8192";

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

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";

    // ✅ FIXED REGEX (single-line, valid)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

    return new Response(jsonStr, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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