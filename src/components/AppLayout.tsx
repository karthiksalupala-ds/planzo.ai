import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navigation, Loader2 } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import { useAuth } from "@/contexts/AuthContext";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [currentTrip, setCurrentTrip] = useState<{ id: string; title: string } | null>(null);

  const pathname = location.pathname;
  const isProtectedPath = pathname === "/profile" || pathname === "/settings" || pathname.startsWith("/trip/");

  // Load dark mode preference on mount
  useEffect(() => {
    const theme = localStorage.getItem("planzo_theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user && isProtectedPath) {
      navigate("/auth");
    }
  }, [user, loading, isProtectedPath, navigate]);

  useEffect(() => {
    if (user && sessionStorage.getItem("planzo_pending_trip")) {
      navigate("/plan?restore_pending=true");
    }
  }, [user, navigate]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("planzo_current_trip");
      if (!cached) {
        setCurrentTrip(null);
        return;
      }
      const parsed = JSON.parse(cached);
      if (parsed?.id) {
        setCurrentTrip({ id: parsed.id, title: parsed.title || "Current trip" });
      }
    } catch {
      setCurrentTrip(null);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DesktopNav />
      <main className="flex-1 md:pt-16">
        {isProtectedPath && loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Minimalist Premium Footer */}
      <footer className="border-t border-border/50 bg-card/10 py-6 backdrop-blur-md mt-auto pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100">
              PLANZO<span className="text-primary">.AI</span>
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              © {new Date().getFullYear()} Planzo. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {currentTrip && !location.pathname.includes("/plan") && (
        <button
          onClick={() => navigate(`/plan?id=${currentTrip.id}`)}
          className="fixed right-4 md:bottom-6 md:right-6 z-40 rounded-full px-4 py-2.5 bg-primary text-primary-foreground shadow-elevated text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ bottom: "calc(6.25rem + env(safe-area-inset-bottom))" }}
        >
          <Navigation className="h-3.5 w-3.5" />
          Resume {currentTrip.title}
        </button>
      )}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
