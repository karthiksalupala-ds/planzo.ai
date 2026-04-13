import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, ThumbsUp, MessageCircle, Vote } from "lucide-react";

interface Traveler {
  id: string;
  email: string;
  name: string;
  role: "organizer" | "member";
}

interface Activity {
  id: string;
  title: string;
  description: string;
  suggestedBy: string;
  votes: string[];
  isOptional: boolean;
}

interface TripCollaborationProps {
  activities?: Activity[];
  travelers?: Traveler[];
  onAddActivity?: (activity: Omit<Activity, "id" | "votes">) => void;
  onVoteActivity?: (activityId: string, userId: string) => void;
  onInviteTraveler?: (email: string) => void;
}

export const TripCollaboration = ({
  activities = [],
  travelers = [],
  onAddActivity,
  onVoteActivity,
  onInviteTraveler,
}: TripCollaborationProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [newActivity, setNewActivity] = useState({ title: "", description: "", optional: false });
  const [activeTab, setActiveTab] = useState<"activities" | "travelers">("activities");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab("activities")}
          className={`px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "activities"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Activities ({activities.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("travelers")}
          className={`px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "travelers"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team ({travelers.length})
          </span>
        </button>
      </div>

      {/* Activities Tab */}
      <AnimatePresence>
        {activeTab === "activities" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Add Activity Form */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-border/50 space-y-3">
              <h4 className="font-bold text-sm">Suggest Activity</h4>
              <input
                type="text"
                placeholder="Activity name (e.g., Scuba Diving at Coral Reef)"
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <textarea
                placeholder="Description and details..."
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-20 resize-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="optional"
                  checked={newActivity.optional}
                  onChange={(e) => setNewActivity({ ...newActivity, optional: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="optional" className="text-sm text-muted-foreground">
                  Optional activity (can skip)
                </label>
              </div>
              <button
                onClick={() => {
                  if (newActivity.title.trim()) {
                    onAddActivity?.({
                      title: newActivity.title,
                      description: newActivity.description,
                      suggestedBy: travelers[0]?.name || "You",
                      isOptional: newActivity.optional,
                    });
                    setNewActivity({ title: "", description: "", optional: false });
                  }
                }}
                className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Suggest Activity
              </button>
            </div>

            {/* Activities List */}
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">
                          {activity.title}
                          {activity.isOptional && (
                            <span className="ml-2 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded">
                              OPTIONAL
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          Suggested by <span className="font-bold">{activity.suggestedBy}</span>
                        </div>
                      </div>
                    </div>

                    {/* Voting Section */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
                      <button
                        onClick={() => onVoteActivity?.(activity.id, travelers[0]?.id || "user")}
                        className={`flex-1 px-3 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          activity.votes.length > 0
                            ? "bg-primary text-primary-foreground hover:opacity-90"
                            : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200"
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Want it ({activity.votes.length})
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 transition-all">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-border/50">
                <Vote className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">No activities suggested yet. Be the first!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Travelers Tab */}
      <AnimatePresence>
        {activeTab === "travelers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Invite Form */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-border/50 space-y-3">
              <h4 className="font-bold text-sm">Invite Traveler</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="traveler@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                <button
                  onClick={() => {
                    if (newEmail.includes("@")) {
                      onInviteTraveler?.(newEmail);
                      setNewEmail("");
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Travelers List */}
            {travelers.length > 0 ? (
              <div className="space-y-3">
                {travelers.map((traveler, idx) => (
                  <motion.div
                    key={traveler.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-xl border ${
                      traveler.role === "organizer"
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card border-border/50"
                    } hover:border-primary/30 transition-all flex items-center justify-between`}
                  >
                    <div>
                      <h4 className="font-bold text-sm">{traveler.name}</h4>
                      <p className="text-xs text-muted-foreground">{traveler.email}</p>
                      <span
                        className={`inline-block text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full ${
                          traveler.role === "organizer"
                            ? "bg-primary/20 text-primary"
                            : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                        }`}
                      >
                        {traveler.role === "organizer" ? "👑 Organizer" : "Member"}
                      </span>
                    </div>
                    {traveler.role !== "organizer" && (
                      <button className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-border/50">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">No travelers added yet. Invite some friends!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaboration AI Tip */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
        <div className="flex gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
          <h4 className="font-bold text-sm">AI Collab Tips</h4>
        </div>
        <div className="text-xs leading-relaxed text-muted-foreground space-y-1">
          <p>✓ Let all travelers suggest activities and vote</p>
          <p>✓ Mark favorite activities to prioritize them</p>
          <p>✓ Use "Optional" for flexible activities</p>
          <p>✓ AI will auto-schedule voted activities based on location & timing</p>
        </div>
      </div>
    </div>
  );
};
