import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import PlanTrip from "./pages/PlanTrip";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/SettingsPage";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import DestinationDetail from "./pages/DestinationDetail";
import TripExpenses from "./pages/TripExpenses";
import TripJournal from "./pages/TripJournal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              </Route>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

