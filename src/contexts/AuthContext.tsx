import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { hasSupabaseConfig, supabase, supabaseConfigError } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

type MockUser = User & {
  user_metadata: {
    display_name: string;
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only allow mock user when Supabase is not configured.
    const mockUser = localStorage.getItem("planzo_mock_user");
    if (mockUser && !hasSupabaseConfig) {
      const parsed = JSON.parse(mockUser);
      setUser(parsed);
      setSession({ user: parsed, access_token: "mock-token", refresh_token: "mock-refresh", expires_in: 3600, token_type: "bearer" } as Session);
      setLoading(false);
      return;
    }
    if (mockUser && hasSupabaseConfig) {
      localStorage.removeItem("planzo_mock_user");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // If Supabase fails (e.g. DNS error), we still set loading to false
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Mock Signup
    if (normalizedEmail === "test@planzo.ai") return signIn(normalizedEmail, password);

    if (!hasSupabaseConfig) return { error: supabaseConfigError };

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName || "Traveler" },
        },
      });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Sign up failed. Please check your network and Supabase configuration." };
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Mock Login Bypass only when cloud auth is unavailable.
    if (!hasSupabaseConfig && normalizedEmail === "test@planzo.ai" && password === "password") {
      const mockUser: MockUser = {
        id: "mock-user-123",
        email: "test@planzo.ai",
        user_metadata: { display_name: "Test Traveler" },
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString()
      } as MockUser;
      
      localStorage.setItem("planzo_mock_user", JSON.stringify(mockUser));
      setUser(mockUser);
      setSession({
        user: mockUser,
        access_token: "mock-token",
        refresh_token: "mock-refresh",
        expires_in: 3600,
        token_type: "bearer",
      } as Session);
      return { error: null };
    }

    if (!hasSupabaseConfig) return { error: supabaseConfigError };

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Sign in failed. Please check your network and Supabase configuration." };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("planzo_mock_user");
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if offline
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
