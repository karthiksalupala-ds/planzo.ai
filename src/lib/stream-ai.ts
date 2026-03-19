import { supabase } from "@/integrations/supabase/client";
import type { TripPlan } from "@/types/trip-plan";

const PLAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plan-trip`;

export interface PlanTripParams {
  query: string;
  budget: string;
  days: string;
  travelers: string;
  mood: string;
}

export async function streamTripPlan({
  params,
  onDelta,
  onDone,
  onError,
}: {
  params: PlanTripParams;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const resp = await fetch(PLAN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(params),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(errData.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("No response body");
      return;
    }

    const contentType = resp.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const jsonText = await resp.text();
        if (jsonText) {
          onDelta(jsonText);
        }
        onDone();
      } catch (e) {
        onError(e instanceof Error ? e.message : "Response reading error");
      }
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data:")) continue;

        const jsonStr = line.slice(5).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch (e) {
          console.warn("Skipping invalid JSON chunk", e);
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data:")) continue;
        const jsonStr = raw.slice(5).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Network error");
  }
}

export function parseItineraryJSON(raw: string): TripPlan | null {
  try {
    // Extract JSON from markdown code fences if present
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatParams {
  query: string;
  planContext?: string;
}

export async function streamChatResponse({
  params,
  onDelta,
  onDone,
  onError,
}: {
  params: ChatParams;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    onError("AI assistant temporarily unavailable.");
    return;
  }

  const systemPrompt = `You are a friendly AI travel assistant helping users understand and explore their travel itinerary.

You have access to the user's generated travel plan in JSON format. Use this information to answer questions naturally.

Important rules:
- Do NOT mention JSON fields like 'weatherNote', 'budgetBreakdown', or 'itinerary'.
- Respond like a human travel guide.
- Give clear, helpful travel advice.
- If data is unavailable, explain it naturally.
- Use a conversational tone similar to ChatGPT or Claude.
- Keep answers concise but informative (3-5 sentences).

Example:
Bad response:
'According to the current plan, the weatherNote is weather data temporarily unavailable.'

Good response:
'I couldn't retrieve the latest weather data right now, but Goa usually has a warm tropical climate. If you're visiting between October and February, you'll likely enjoy pleasant weather with lots of sunshine.'

Always prioritize helpful travel guidance over technical explanations.`;

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  if (params.planContext) {
    messages.push({
      role: "system",
      content: `Here is the current trip plan for context:\n${params.planContext}`,
    });
  }

  messages.push({ role: "user", content: params.query });

  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(errData?.error?.message || errData?.error || "AI assistant temporarily unavailable.");
      return;
    }

    if (!resp.body) {
      // Non-streaming fallback
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) onDelta(content);
      onDone();
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data:")) continue;

        const jsonStr = line.slice(5).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch (e) {
          console.warn("Skipping invalid JSON chunk", e);
        }
      }
    }

    onDone();
  } catch (e) {
    onError("AI assistant temporarily unavailable.");
  }
}

export async function generateAlternativeActivity(
  destination: string,
  mood: string,
  oldActivityName: string
): Promise<{ name: string; place: string; imageSearchQuery: string } | null> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are a professional travel planning AI. Return ONLY a valid JSON object matching this schema:
{ "name": "string", "place": "string", "imageSearchQuery": "string (descriptive, for Pexels)" }
Do not provide any markdown, just the JSON string.`;

  const userPrompt = `The user is traveling to ${destination} with a mood of "${mood}".
They do NOT want to do this activity: "${oldActivityName}".
Suggest ONE alternative activity that is different but fits the mood and city. Return JSON strictly.`;

  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "";
    
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
    
    // Remove potential leading/trailing non-json chars
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(jsonStr.substring(start, end + 1));
    }
    
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Alternative generation error", e);
    return null;
  }
}

