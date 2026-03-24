import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import AIChatbot from "@/components/AIChatbot";
import AIInsightsNotification from "@/components/AIInsightsNotification";
import { XPToastContainer } from "@/components/XPToast";
import { AchievementToastContainer } from "@/components/AchievementToast";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect, lazy, Suspense } from "react";
import { initializeSyncManager } from "@/lib/syncManager";
import { usePaymentSuccess } from "@/hooks/use-payment-success";

// Eagerly loaded (small / auth-critical pages)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/NotFound";
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazily loaded (heavy feature pages – split into separate chunks)
const Dashboard          = lazy(() => import("./pages/Dashboard"));
const TradeJournal       = lazy(() => import("./pages/TradeJournal"));
const CycleTracker       = lazy(() => import("./pages/CycleTracker"));
const Day                = lazy(() => import("./pages/Day"));
const NewTrade           = lazy(() => import("./pages/NewTrade"));
const Strategies         = lazy(() => import("./pages/Strategies"));
const StrategyList       = lazy(() => import("./pages/strategies/StrategyList"));
const StrategyEdit       = lazy(() => import("./pages/strategies/StrategyEdit"));
const StrategyDetail     = lazy(() => import("./pages/strategies/StrategyDetail"));
const StrategyAnalytics  = lazy(() => import("./pages/strategies/StrategyAnalytics"));
const NewStrategy        = lazy(() => import("./pages/strategies/NewStrategy"));
const Challenges         = lazy(() => import("./pages/Challenges"));
const AIInsights         = lazy(() => import("./pages/AIInsights"));
const Settings           = lazy(() => import("./pages/Settings"));
const Statistics         = lazy(() => import("./pages/Statistics"));
const MonthlyReflection  = lazy(() => import("./pages/MonthlyReflection"));
const PropFirmAccounts   = lazy(() => import("./pages/PropFirmAccounts"));
const PropFirmCompare    = lazy(() => import("./pages/PropFirmCompare"));
const MetaTraderConnect  = lazy(() => import("./pages/MetaTraderConnect"));
const Pricing            = lazy(() => import("./pages/Pricing"));
const Checkout           = lazy(() => import("./pages/Checkout"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const Profile            = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  // Handle payment success on ANY page (Stripe redirects back here)
  usePaymentSuccess();

  // Initialize Sync Manager on app start
  useEffect(() => {
    initializeSyncManager();
  }, []);

  // Navigation nur auf Landing ausblenden
  const isLandingPage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {!isLandingPage && <Navigation />}

      {/* AI Chatbot - available on all pages except landing */}
      {!isLandingPage && <AIChatbot />}

      {/* AI Insights Notifications - pop up when new insights are discovered */}
      {!isLandingPage && <AIInsightsNotification />}

      {/* XP Toast Notifications */}
      <XPToastContainer />

      {/* Achievement Toast Notifications */}
      <AchievementToastContainer />

      {/* Error Boundary wrapping all routes */}
      <ErrorBoundary>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
        <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* ⭐ Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />

        {/* Dashboard (Protected) */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Other Pages (Protected) */}
        <Route path="/journal" element={<ProtectedRoute><TradeJournal /></ProtectedRoute>} />
        <Route path="/trade/new" element={<ProtectedRoute><NewTrade /></ProtectedRoute>} />
        <Route path="/cycle" element={<ProtectedRoute><CycleTracker /></ProtectedRoute>} />
        <Route path="/cycle-tracker" element={<ProtectedRoute><CycleTracker /></ProtectedRoute>} />
        <Route path="/day/:day" element={<ProtectedRoute><Day /></ProtectedRoute>} />
        <Route path="/strategies" element={<ProtectedRoute><Strategies /></ProtectedRoute>} />
        <Route path="/strategies/new" element={<ProtectedRoute><NewStrategy /></ProtectedRoute>} />
        <Route path="/strategies/:id" element={<ProtectedRoute><StrategyDetail /></ProtectedRoute>} />
        <Route path="/strategies/:id/analytics" element={<ProtectedRoute><StrategyAnalytics /></ProtectedRoute>} />
        <Route path="/strategies/list" element={<ProtectedRoute><StrategyList /></ProtectedRoute>} />
        <Route path="/strategies/edit/:name" element={<ProtectedRoute><StrategyEdit /></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
        <Route path="/monthly-reflection" element={<ProtectedRoute><MonthlyReflection /></ProtectedRoute>} />
        <Route path="/prop-firms" element={<ProtectedRoute><PropFirmAccounts /></ProtectedRoute>} />
        <Route path="/propfirm-compare" element={<ProtectedRoute><PropFirmCompare /></ProtectedRoute>} />
        <Route path="/metatrader" element={<ProtectedRoute><MetaTraderConnect /></ProtectedRoute>} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedRoute><AdminSubscriptions /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        <Route path="/welcome" element={<Welcome />} />
        
        {/* Legal Pages - Public */}
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <XPToastContainer />
      <AchievementToastContainer />
      <ThemeProvider attribute="class" defaultTheme="light">
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
