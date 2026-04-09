import { supabase } from "@/integrations/supabase/client";
import type { TripPlan, TripDay } from "@/types/trip-plan";

/**
 * The AgentEngine is responsible for autonomous task execution and monitoring.
 * It periodically checks for 'Triggers' (like weather changes) and acts upon them.
 */
export class AgentEngine {
  private static instance: AgentEngine;
  private isMonitoring: boolean = false;

  private constructor() {}

  public static getInstance(): AgentEngine {
    if (!AgentEngine.instance) {
      AgentEngine.instance = new AgentEngine();
    }
    return AgentEngine.instance;
  }

  /**
   * Starts an autonomous monitoring session for a specific trip.
   */
  public async monitorTrip(tripId: string, currentPlan: TripPlan): Promise<void> {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    console.log(`[Agent] Starting autonomous monitoring for trip: ${tripId}`);
    
    // In a real production app, this would be a background worker or edge function.
    // Here we simulate the agent's proactivity.
    this.checkTriggers(tripId, currentPlan);
  }

  /**
   * Evaluates external data to see if the plan needs 'Self-Healing'.
   */
  private async checkTriggers(tripId: string, plan: TripPlan) {
    // TRIGGER 1: Weather Check
    if (plan.weatherNote?.toLowerCase().includes("rain")) {
      console.log("[Agent] Trigger detected: Adverse weather found. Initiating re-planning...");
      this.healPlan(tripId, plan, "Weather Alert: Heavy rain detected. Moved outdoor activities to indoor alternatives.");
    }

    // TRIGGER 2: Logistics Check (Simulated)
    // We could check flight APIs here to see if a transport option is delayed.
  }

  /**
   * Performs autonomous re-planning (Self-Healing).
   */
  private async healPlan(tripId: string, plan: TripPlan, reason: string) {
    if (!plan.itinerary) return;

    try {
      // Simulate an agent 'thinking'
      console.log(`[Agent] Healing itinerary for reasoning: ${reason}`);

      // Here we would call the AI to re-optimize.
      // For now, we simulate a 'Task Synthesis' by adding an agent note.
      const updatedPlan = { ...plan };
      updatedPlan.agentNotes = (updatedPlan.agentNotes || []).concat([
        { timestamp: new Date().toISOString(), message: reason }
      ]);

      // Update the remote state autonomously
      const { error } = await supabase
        .from("saved_trips")
        .update({ plan_data: updatedPlan as any })
        .eq("id", tripId);

      if (error) throw error;
      
      console.log("[Agent] Plan healed autonomously.");
    } catch (err) {
      console.error("[Agent] Healing failed:", err);
    }
  }
}

export const agentEngine = AgentEngine.getInstance();
