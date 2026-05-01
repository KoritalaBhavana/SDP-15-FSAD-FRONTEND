import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/AuthV2";
import TouristDashboard from "./pages/TouristDashboard";
import HostDashboard from "./pages/HostDashboard";
import GuideDashboard from "./pages/GuideDashboard";
import ChefDashboard from "./pages/ChefDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import HomestayListing from "./pages/HomestayListing";
import HomestayDetail from "./pages/HomestayDetail";
import Booking from "./pages/BookingV2";
import Payment from "./pages/PaymentV2";
import Attractions from "./pages/Attractions";
import Guides from "./pages/Guides";
import Dining from "./pages/Dining";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import AboutUs from "./pages/AboutUs";
import HostOnboarding from "./pages/HostOnboarding";
import PendingApproval from "./pages/PendingApproval";

const queryClient = new QueryClient();

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route render failed", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
            <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please refresh the page or try again.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ScrollToTopOnRouteChange() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function HostRouteGuard() {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "host" || !user.isApproved) {
      return;
    }

    const allowedPaths = ["/auth", "/pending-approval", "/host-dashboard", "/host-onboarding", "/add-property"];
    const isAllowed = allowedPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

    if (!isAllowed) {
      navigate("/host-dashboard?tab=overview", { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate, user?.isApproved, user?.role]);

  return null;
}

function GuideRouteGuard() {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "guide" || !user.isApproved) {
      return;
    }

    const allowedPaths = ["/auth", "/pending-approval", "/guide-dashboard", "/guide-onboarding", "/add-itinerary"];
    const isAllowed = allowedPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

    if (!isAllowed) {
      navigate("/guide-dashboard", { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate, user?.isApproved, user?.role]);

  return null;
}

function ProfileRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role === "host") {
    return <HostDashboard />;
  }

  if (user.role === "guide") {
    return <GuideDashboard />;
  }

  if (user.role === "chef") {
    return <ChefDashboard />;
  }

  return <TouristDashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTopOnRouteChange />
          <HostRouteGuard />
          <GuideRouteGuard />
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tourist-dashboard" element={<ProtectedRoute allowedRoles={["tourist"]}><TouristDashboard /></ProtectedRoute>} />
            <Route path="/host-dashboard" element={<ProtectedRoute allowedRoles={["host"]}><HostDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={["tourist", "host", "guide", "chef"]}><ProfileRoute /></ProtectedRoute>} />
            <Route path="/add-property" element={<ProtectedRoute allowedRoles={["host"]}><HostOnboarding /></ProtectedRoute>} />
            <Route path="/host-onboarding" element={<ProtectedRoute allowedRoles={["host"]}><HostOnboarding /></ProtectedRoute>} />
            <Route path="/guide-dashboard" element={<ProtectedRoute allowedRoles={["guide"]}><GuideDashboard /></ProtectedRoute>} />
            <Route path="/create-itinerary" element={<ProtectedRoute allowedRoles={["guide"]}><GuideDashboard /></ProtectedRoute>} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/guide-onboarding" element={<Navigate to="/guide-dashboard" replace />} />
            <Route path="/chef-dashboard" element={<ProtectedRoute allowedRoles={["chef"]}><ChefDashboard /></ProtectedRoute>} />
            <Route path="/add-meal" element={<ProtectedRoute allowedRoles={["chef"]}><ChefDashboard /></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
            <Route path="/onboarding" element={<Navigate to="/home" replace />} />
            <Route path="/homestays" element={<HomestayListing />} />
            <Route path="/homestay/:id" element={<HomestayDetail />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/payment/:id" element={<Payment />} />
            <Route path="/attractions" element={<Attractions />} />
            <Route path="/dining" element={<Dining />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center p-6">Page Not Found</div>} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
