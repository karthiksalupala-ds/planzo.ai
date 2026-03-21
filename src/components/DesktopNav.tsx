import { Home, Compass, Map, User, Plane } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navTabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Map, label: "Plan Trip", path: "/plan" },
];

const DesktopNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = user?.user_metadata?.display_name as string | undefined;

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Planzo.ai
          </span>
        </button>
        <nav className="flex items-center gap-1">
          {navTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
          {/* Unified profile entry point */}
          <button
            onClick={() => navigate("/profile")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === "/profile"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {user && avatarUrl ? (
              <img src={avatarUrl} alt={displayName || "Profile"} className="h-7 w-7 rounded-full object-cover ring-2 ring-primary/30" />
            ) : (
              <div className="h-7 w-7 rounded-full gradient-hero flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default DesktopNav;
