import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, Plane, Loader2 } from "lucide-react";
import { hasSupabaseConfig, supabase, supabaseConfigError } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildAuthRedirectUrl } from "@/lib/auth-redirect";

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabaseConfig) {
      toast({ variant: "destructive", title: "Configuration missing", description: supabaseConfigError });
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: buildAuthRedirectUrl("/reset-password"),
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to send reset email.",
      });
    } finally {
      setLoading(false);
    }
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
              Get back to your plans.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Reset your password to access your custom itineraries, trip expenses, and travel journals.
            </p>
            <div className="mt-8 grid max-w-md gap-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                Secure link sent directly to your inbox.
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
                Reset your password
              </p>
            </div>

            <div className="mb-5 hidden flex-col items-start lg:flex">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Forgot Password
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email to receive a password reset link.
              </p>
            </div>

            <div className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl gradient-hero py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Sending link..." : "Send Reset Link"}
                </button>
              </form>

              <div className="text-center mt-4 pt-2 border-t border-border/50">
                <Link to="/auth" className="text-sm font-semibold text-primary hover:opacity-90 transition-opacity">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
