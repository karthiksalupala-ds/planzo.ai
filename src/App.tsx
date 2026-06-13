import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import PlanTrip from "./pages/PlanTrip";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/SettingsPage";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DestinationDetail from "./pages/DestinationDetail";
import TripExpenses from "./pages/TripExpenses";
import TripJournal from "./pages/TripJournal";
import NotFound from "./pages/NotFound";
import { Plane, Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const TripRedirect = () => {
  const { tripId } = useParams();
  return <Navigate to={`/plan?id=${tripId}`} replace />;
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute right-[-8%] top-[18%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.02),_transparent_30%)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo with Plane Icon */}
          <div className="h-16 w-16 rounded-2xl gradient-hero flex items-center justify-center shadow-elevated animate-bounce">
            <Plane className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="font-display text-3xl font-black tracking-tight text-foreground">Planzo.ai</h1>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.25em]">Ready for take-off</p>
          </div>

          {/* Loading Spinner */}
          <Loader2 className="h-6 w-6 animate-spin text-primary mt-4" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/plan" element={<PlanTrip />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/destination/:id" element={<DestinationDetail />} />
          <Route path="/trip/:tripId/expenses" element={<TripExpenses />} />
          <Route path="/trip/:tripId/journal" element={<TripJournal />} />
          <Route path="/trip/:tripId" element={<TripRedirect />} />
        </Route>
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
