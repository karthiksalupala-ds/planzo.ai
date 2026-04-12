import { useMemo, useState } from "react";
import { Copy, MessageSquare, Send, ThumbsDown, ThumbsUp, Users, UserPlus } from "lucide-react";
import type { TripCollaborator, TripMessage, TripVote, PlanActivityRef } from "@/lib/trip-features";
import { summarizeVotes } from "@/lib/trip-features";

interface TripCollabPanelProps {
  shareUrl: string;
  canManage: boolean;
  collaborators: TripCollaborator[];
  messages: TripMessage[];
  votes: TripVote[];
  activities: PlanActivityRef[];
  onInvite: (payload: { displayName: string; email?: string }) => Promise<void> | void;
  onSendMessage: (message: string) => Promise<void> | void;
  onVote: (activity: PlanActivityRef, voteValue: 1 | -1) => Promise<void> | void;
}

const TripCollabPanel = ({
  shareUrl,
  canManage,
  collaborators,
  messages,
  votes,
  activities,
  onInvite,
  onSendMessage,
  onVote,
}: TripCollabPanelProps) => {
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState("");

  const voteSummary = useMemo(() => summarizeVotes(votes), [votes]);
  const topActivities = useMemo(
    () =>
      activities
        .map((activity) => ({ activity, stats: voteSummary[activity.key] }))
        .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0))
        .slice(0, 6),
    [activities, voteSummary]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Phase 1</p>
            <h3 className="mt-1 text-xl font-black text-foreground">Group collaboration</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share the trip, invite people, and keep lightweight planning notes in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy share link
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">People on this trip</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collaborators yet. Start by sharing the trip link.</p>
              ) : (
                collaborators.map((member) => (
                  <div key={member.id} className="rounded-xl border border-border bg-card px-3 py-2">
                    <p className="text-sm font-semibold text-foreground">{member.display_name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {member.role} {member.status === "invited" ? "· invited" : "· active"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {canManage && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!inviteName.trim()) return;
                void onInvite({ displayName: inviteName.trim(), email: inviteEmail.trim() || undefined });
                setInviteName("");
                setInviteEmail("");
              }}
              className="rounded-2xl border border-border/60 bg-muted/20 p-4 md:min-w-[260px]"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Invite collaborator</p>
              </div>
              <input
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="Name"
                className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
              />
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="Email (optional)"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                <UserPlus className="h-4 w-4" />
                Add to trip
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Planning notes</p>
          </div>
          <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Drop a note like “let’s keep day 2 more relaxed” or “food matters most here.”</p>
            ) : (
              messages.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border bg-card px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{entry.display_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.message}</p>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!message.trim()) return;
              void onSendMessage(message.trim());
              setMessage("");
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Post a quick note for your group"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Voting</p>
        <h3 className="mt-1 text-xl font-black text-foreground">What the group wants most</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vote the itinerary up or down so the best stops rise to the top before booking.
        </p>

        <div className="mt-4 space-y-3">
          {topActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Votes will appear here once the itinerary has activities.</p>
          ) : (
            topActivities.map(({ activity, stats }) => (
              <div key={activity.key} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Day {activity.day}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{activity.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Score {stats?.score || 0} · {stats?.upvotes || 0} upvotes · {stats?.downvotes || 0} downvotes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onVote(activity, 1)}
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Upvote
                    </button>
                    <button
                      type="button"
                      onClick={() => void onVote(activity, -1)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-500/15 dark:text-rose-300"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      Downvote
                    </button>
                  </div>
                </div>
                {stats?.voters?.length ? (
                  <p className="mt-2 text-xs text-muted-foreground">Recent voters: {stats.voters.slice(0, 4).join(", ")}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default TripCollabPanel;
