import { supabase } from "@/integrations/supabase/client";
import type { TripPlan } from "@/types/trip-plan";

const PLAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plan-trip`;
const OPENROUTER_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-proxy`;

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

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0;
  let delay = 2000;
  while (attempt < maxRetries) {
    const response = await fetch(url, options);
    if (response.status !== 429) return response;
    attempt++;
    console.warn(`[API] Rate limited (429). Retrying attempt ${attempt} of ${maxRetries}...`);
    if (attempt >= maxRetries) return response;
    await new Promise(res => setTimeout(res, delay));
    delay *= 2;
  }
  throw new Error("Max retries reached");
}

function getSupabaseFunctionKey(): string {
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Supabase is not configured.");
  }

  return publishableKey;
}

export async function postOpenRouterProxy(body: Record<string, unknown>): Promise<Response> {
  const functionKey = getSupabaseFunctionKey();

  return fetchWithRetry(OPENROUTER_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: functionKey,
      Authorization: `Bearer ${functionKey}`,
    },
    body: JSON.stringify(body),
  });
}

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
  try {
    const resp = await postOpenRouterProxy({
      action: "chat",
      query: params.query,
      planContext: params.planContext,
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
  try {
    const resp = await postOpenRouterProxy({
      action: "alternativeActivity",
      destination,
      mood,
      oldActivityName,
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
