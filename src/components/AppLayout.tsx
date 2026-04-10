import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTrip, setCurrentTrip] = useState<{ id: string; title: string } | null>(null);

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
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className="pb-20 md:pb-0 md:pt-16">
        <Outlet />
      </main>
      {currentTrip && !location.pathname.includes("/plan") && (
        <button
          onClick={() => navigate(`/plan?id=${currentTrip.id}`)}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 rounded-full px-4 py-2.5 bg-primary text-primary-foreground shadow-elevated text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity"
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
