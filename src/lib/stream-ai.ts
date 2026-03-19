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

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: "You are an AI travel assistant. Help users plan trips, answer travel questions, and provide recommendations. Be concise and helpful." },
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

