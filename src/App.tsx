import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Services = lazy(() => import("./pages/Services"));
const RequestInspection = lazy(() => import("./pages/RequestInspection"));
const BecomeAgent = lazy(() => import("./pages/BecomeAgent"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error?.message?.includes('Unauthorized')) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/agent" element={<ProtectedRoute requiredRole="agent"><AgentDashboard /></ProtectedRoute>} />
                <Route path="/user" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/services" element={<Services />} />
                <Route path="/request-inspection" element={<RequestInspection />} />
                <Route path="/become-agent" element={<BecomeAgent />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
