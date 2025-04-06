
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import InvoiceUpload from "./pages/InvoiceUpload";
import InvoiceReview from "./pages/InvoiceReview";
import GstFiling from "./pages/GstFiling";
import Payments from "./pages/Payments";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Protected route component that requires authentication
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // If still loading, show nothing or a loading indicator
  if (isLoading) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the children
  return children;
};

// Auth route - redirects to dashboard if already logged in
const AuthRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  // If still loading, show nothing or a loading indicator
  if (isLoading) {
    return null;
  }
  
  // If already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Otherwise, render login/register page
  return children;
};

const AppRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Index />} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
      <Route path="/invoices/upload" element={<ProtectedRoute><InvoiceUpload /></ProtectedRoute>} />
      <Route path="/invoices/review" element={<ProtectedRoute><InvoiceReview /></ProtectedRoute>} />
      <Route path="/gst-filing" element={<ProtectedRoute><GstFiling /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Structure the app to properly provide the Router context before AuthProvider
const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
