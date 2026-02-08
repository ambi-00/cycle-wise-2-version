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
import { useEffect } from "react";
import { initializeSyncManager } from "@/lib/syncManager";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import TradeJournal from "./pages/TradeJournal";
import CycleTracker from "./pages/CycleTracker";
import Day from "./pages/Day";
import NewTrade from "./pages/NewTrade";
import Strategies from "./pages/Strategies";
import StrategyList from "./pages/strategies/StrategyList";
import StrategyEdit from "./pages/strategies/StrategyEdit";
import StrategyDetail from "./pages/strategies/StrategyDetail";
import StrategyAnalytics from "./pages/strategies/StrategyAnalytics";
import NewStrategy from "./pages/strategies/NewStrategy";
import Challenges from "./pages/Challenges";
import AIInsights from "./pages/AIInsights";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Statistics from "./pages/Statistics";
import PropFirmAccounts from "./pages/PropFirmAccounts";
import PropFirmCompare from "./pages/PropFirmCompare";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import AdminSubscriptions from "./pages/AdminSubscriptions";

// ⭐ NEU: Login & Register importieren
import Login from "./pages/Login";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import ProtectedRoute from "@/components/ProtectedRoute";

// Legal Pages
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  // Initialize Sync Manager on app start
  useEffect(() => {
    initializeSyncManager();
  }, []);

  // Navigation nur auf Landing ausblenden
  const isLandingPage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {!isLandingPage && <Navigation />}

      {/* Top-right profile avatar is provided by the Dashboard page; removed global ProfileButton */}

      {/* AI Chatbot - available on all pages except landing */}
      {!isLandingPage && <AIChatbot />}

      {/* AI Insights Notifications - pop up when new insights are discovered */}
      {!isLandingPage && <AIInsightsNotification />}

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
        <Route path="/prop-firms" element={<ProtectedRoute><PropFirmAccounts /></ProtectedRoute>} />
        <Route path="/propfirm-compare" element={<ProtectedRoute><PropFirmCompare /></ProtectedRoute>} />
        <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
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
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <XPToastContainer />
      <ThemeProvider attribute="class" defaultTheme="light">
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
