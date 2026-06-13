import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated", description: "You can now sign in with your new password." });
    navigate("/auth");
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-8%] top-[18%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.56),_rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_35%),linear-gradient(180deg,_rgba(7,10,20,0.88),_rgba(7,10,20,0.98))]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* Informational Sidebar */}
          <div className="hidden flex-col justify-center lg:flex">
            <div className="mb-5 h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center shadow-elevated">
              <Plane className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground xl:text-5xl">
              Secure your account.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Choose a strong, unique password to ensure your travel data stays secure.
            </p>
            <div className="mt-8 grid max-w-md gap-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                Minimum 6 characters required.
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                Designed to feel familiar on desktop and mobile.
              </div>
            </div>
          </div>

          {/* Form Card Column */}
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 flex flex-col items-center lg:hidden">
              <div className="mb-3 h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center shadow-elevated">
                <Plane className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Planzo.ai</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Set new password
              </p>
            </div>

            <div className="mb-5 hidden flex-col items-start lg:flex">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Set new password
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a new password to complete recovery.
              </p>
            </div>

            <div className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl gradient-hero py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
