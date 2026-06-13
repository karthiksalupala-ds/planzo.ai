import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Plane, Loader2, Eye, EyeOff, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { hasSupabaseConfig, supabase, supabaseConfigError } from "@/integrations/supabase/client";
import { buildAuthRedirectUrl } from "@/lib/auth-redirect";

const friendlyAuthError = (msg: string) => {
  if (!msg) return "Something went wrong. Please try again.";
  const lower = msg.toLowerCase();
  if (lower.includes("redirect") && lower.includes("allow")) return "Auth redirect URL is not allowed in Supabase settings. Add your current app URL under Authentication > URL Configuration.";
  if (lower.includes("redirect") && lower.includes("invalid")) return "Auth redirect URL is invalid in Supabase settings. Check Authentication > URL Configuration.";
  if (lower.includes("invalid login")) return "Incorrect credentials or account not verified. Check your email inbox/spam for verification, then try again.";
  if (lower.includes("email not confirmed")) return "Please check your email and confirm your account to sign in.";
  if (lower.includes("invalid credentials")) return "Incorrect credentials or account not verified. Check your email inbox/spam for verification, then try again.";
  if (lower.includes("already registered")) return "An account with this email already exists. Try signing in.";
  if (lower.includes("password") && lower.includes("6")) return "Password must be at least 6 characters.";
  if (lower.includes("weak password")) return "Password must be at least 6 characters.";
  if (lower.includes("rate limit")) return "Too many attempts. Please wait a moment.";
  return msg;
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const parallaxLayers = useMemo(
    () => [
      { className: "h-2.5 w-2.5 rounded-full bg-primary/80 shadow-[0_0_18px_rgba(59,130,246,0.9)]", x: 18, y: 18, float: 10, duration: 8, blur: false },
      { className: "h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.85)]", x: 30, y: 34, float: 14, duration: 11, blur: false },
      { className: "h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(253,224,71,0.8)]", x: 42, y: 18, float: 12, duration: 9, blur: false },
      { className: "h-2 w-2 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.75)]", x: 58, y: 30, float: 9, duration: 10, blur: false },
      { className: "h-2.5 w-2.5 rounded-full bg-primary/70 shadow-[0_0_18px_rgba(59,130,246,0.8)]", x: 70, y: 14, float: 13, duration: 12, blur: false },
      { className: "h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]", x: 82, y: 26, float: 11, duration: 8, blur: false },
      { className: "h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_16px_rgba(232,121,249,0.7)]", x: 88, y: 42, float: 15, duration: 13, blur: false },
      { className: "h-1.5 w-1.5 rounded-full bg-primary/70 shadow-[0_0_14px_rgba(59,130,246,0.8)]", x: 12, y: 52, float: 11, duration: 10, blur: false },
      { className: "h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(165,243,252,0.8)]", x: 24, y: 74, float: 12, duration: 9, blur: false },
      { className: "h-2 w-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.72)]", x: 38, y: 68, float: 14, duration: 11, blur: false },
      { className: "h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_18px_rgba(253,230,138,0.75)]", x: 54, y: 82, float: 10, duration: 12, blur: false },
      { className: "h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.75)]", x: 68, y: 68, float: 13, duration: 9, blur: false },
      { className: "h-2.5 w-2.5 rounded-full bg-primary/70 shadow-[0_0_18px_rgba(59,130,246,0.85)]", x: 84, y: 80, float: 9, duration: 10, blur: false },
      { className: "h-24 w-24 rounded-full bg-primary/10 blur-3xl", x: 40, y: 40, float: 8, duration: 16, blur: true },
      { className: "h-20 w-20 rounded-full bg-cyan-400/10 blur-3xl", x: 78, y: 66, float: 10, duration: 18, blur: true },
    ],
    []
  );

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    setPointer({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (!normalizedEmail || !normalizedPassword) return;
    if (!isLogin && !displayName.trim()) {
      toast({ title: "Missing Information", description: "Please enter a display name.", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(normalizedEmail, normalizedPassword);
      if (error) {
        toast({ title: "Login failed", description: friendlyAuthError(error), variant: "destructive" });
      } else {
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        navigate("/");
      }
    } else {
      const { error } = await signUp(normalizedEmail, normalizedPassword, displayName);
      if (error) {
        toast({ title: "Sign up failed", description: friendlyAuthError(error), variant: "destructive" });
      } else {
        setEmail(normalizedEmail);
        setSignupSuccess(true);
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!hasSupabaseConfig) {
      toast({ title: "Configuration missing", description: supabaseConfigError, variant: "destructive" });
      return;
    }

    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildAuthRedirectUrl(),
        },
      });
      if (error) {
        toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Google sign-in failed", description: "Something went wrong", variant: "destructive" });
    }
    setGoogleLoading(false);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6"
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setPointer({ x: 0.5, y: 0.5 })}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.72),_rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,_rgba(7,10,20,0.88),_rgba(7,10,20,0.96))]" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)] dark:opacity-[0.12]" />
        {parallaxLayers.map((layer, index) => {
          const depth = index % 2 === 0 ? 1 : -1;
          const moveX = (pointer.x - 0.5) * layer.x * depth;
          const moveY = (pointer.y - 0.5) * layer.y * depth;
          const intensity = index < 14 ? 1.2 : 1;
          const drift = index % 3 === 0 ? 1 : -1;

          return (
            <motion.div
              key={`auth-layer-${index}`}
              className="absolute"
              style={{ left: `${layer.x}%`, top: `${layer.y}%` }}
              animate={{
                x: [0, drift * (layer.float * 0.5), 0, drift * -(layer.float * 0.35), 0],
                y: [0, -layer.float, 0, layer.float * 0.6, 0],
                rotate: [0, drift * 6, 0, drift * -4, 0],
              }}
              transition={{ duration: layer.duration, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className={layer.className}
                style={{ x: moveX * intensity, y: moveY * intensity }}
              />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center shadow-elevated">
            <Plane className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Planzo.ai</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin ? "Welcome back, traveler" : "Start your journey"}
          </p>
          <div className="mt-4 grid w-full grid-cols-2 rounded-xl border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setSignupSuccess(false); }}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setSignupSuccess(false); }}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${!isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Create account
            </button>
          </div>
        </div>

        {signupSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-card shadow-card text-center"
          >
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="font-display font-bold text-foreground text-lg">Check your email!</h2>
            <p className="text-sm text-muted-foreground mt-2">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
            <button
              onClick={() => { setSignupSuccess(false); setIsLogin(true); }}
              className="mt-4 w-full py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Back to Sign In
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-muted/40 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
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
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={6}
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-10 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {isLogin && (
                <div className="text-right -mt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-hero py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isLogin ? "Sign In" : "Create Account"}
              </button>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => navigate(`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Reset password now
                </button>
              )}

              <div className="flex items-center gap-3 pt-1.5">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Or Testing</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {!hasSupabaseConfig && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail("test@planzo.ai");
                    setPassword("password");
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.requestSubmit();
                    }, 100);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 py-3 text-xs font-bold text-amber-600 shadow-sm transition-all hover:bg-amber-500/20 dark:text-amber-500"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Quick Test Login (No Network)
                </button>
              )}
            </form>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => { setIsLogin(!isLogin); setSignupSuccess(false); }} className="font-semibold text-primary hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
        {/* Guest access removed for production */}
      </motion.div>
    </div>
  );
};

export default Auth;
