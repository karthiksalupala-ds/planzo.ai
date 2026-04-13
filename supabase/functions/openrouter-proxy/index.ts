import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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

async function requireAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing bearer token" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: "Supabase runtime environment is not configured" };
  }

  const token = authHeader.replace("Bearer ", "");
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return { error: "Unauthorized" };
  }

  return { user: data.user };
}

function parseJsonContent(content: string) {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  let jsonString = jsonMatch?.[1] || content;

  const firstBrace = jsonString.indexOf("{");
  const lastBrace = jsonString.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(jsonString);
}

async function callOpenRouter(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("OPENROUTER_HTTP_REFERER") || "https://planzo.ai",
      "X-Title": Deno.env.get("OPENROUTER_TITLE") || "Planzo AI",
    },
    body: JSON.stringify(body),
  });
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAuthenticatedUser(req);
  if (authResult.error) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as {
      action?: string;
      query?: string;
      destination?: string;
      state?: string;
      category?: string;
      mood?: string;
      oldActivityName?: string;
      planContext?: string;
    };

    switch (body.action) {
      case "searchDestination": {
        const response = await callOpenRouter({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content: `You are a travel database expert. Return ONLY a valid JSON object matching this schema:
              {
                "id": "string-slug",
                "name": "string",
                "state": "string",
                "rating": number (4.5-4.9),
                "tag": "string",
                "price": "string (e.g. ₹10,000)",
                "days": "string (e.g. 3 days)",
                "category": "Culture|Beach|Nature|Adventure|Romantic",
                "description": "2 sentences",
                "bestTime": "string",
                "highlights": ["string"],
                "lat": number,
                "lng": number,
                "foodSpots": ["string"],
                "activities": ["string"]
              }`
            },
            { role: "user", content: `Generate a destination card for ${body.query}. Focus on accurate geographical and cultural details.` }
          ],
          response_format: { type: "json_object" },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return new Response(JSON.stringify({ error: errorText || "OpenRouter request failed" }), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        const parsed = parseJsonContent(content);

        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "regenerateSummary": {
        const response = await callOpenRouter({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "Write a concise 2-sentence travel destination summary in JSON: {\"description\":\"...\"}." },
            { role: "user", content: `Destination: ${body.destination}, ${body.state}. Category: ${body.category}. Keep it factual and useful.` },
          ],
          response_format: { type: "json_object" },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return new Response(JSON.stringify({ error: errorText || "OpenRouter request failed" }), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        const parsed = parseJsonContent(content);

        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "chat": {
        const response = await callOpenRouter({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "system",
              content: `You are a friendly AI travel assistant helping users understand and explore their travel itinerary.

You have access to the user's generated travel plan in JSON format. Use this information to answer questions naturally.

Important rules:
- Do NOT mention JSON fields like 'weatherNote', 'budgetBreakdown', or 'itinerary'.
- Respond like a human travel guide.
- Give clear, helpful travel advice.
- If data is unavailable, explain it naturally.
- Use a conversational tone similar to ChatGPT or Claude.
- Keep answers concise but informative (3-5 sentences).`
            },
            ...(body.planContext ? [{ role: "system", content: `Here is the current trip plan for context:\n${body.planContext}` }] : []),
            { role: "user", content: body.query || "" },
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 300,
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text().catch(() => "OpenRouter request failed");
          return new Response(JSON.stringify({ error: errorText || "OpenRouter request failed" }), {
            status: response.status || 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(response.body, {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": response.headers.get("Content-Type") || "text/event-stream",
          },
        });
      }

      case "alternativeActivity": {
        const response = await callOpenRouter({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "system",
              content: `You are a professional travel planning AI. Return ONLY a valid JSON object matching this schema:
{ "name": "string", "place": "string", "imageSearchQuery": "string (descriptive, for Pexels)" }
Do not provide any markdown, just the JSON string.`,
            },
            {
              role: "user",
              content: `The user is traveling to ${body.destination} with a mood of "${body.mood}".
They do NOT want to do this activity: "${body.oldActivityName}".
Suggest ONE alternative activity that is different but fits the mood and city. Return JSON strictly.`,
            },
          ],
          temperature: 0.8,
          response_format: { type: "json_object" },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return new Response(JSON.stringify({ error: errorText || "OpenRouter request failed" }), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        const parsed = parseJsonContent(content);

        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});