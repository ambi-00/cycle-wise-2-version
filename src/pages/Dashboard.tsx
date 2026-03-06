import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { CyclePhaseIndicator } from "@/components/CyclePhaseIndicator";
import { PeriodPrediction } from "@/components/PeriodPrediction";
import { SafetyModeToggle } from "@/components/SafetyModeToggle";
import { PerformanceCard } from "@/components/PerformanceCard";
import { DailyHealthCheckIn } from "@/components/DailyHealthCheckIn";
import { loadCycleSettings, getCurrentCycleInfo, hasCompletedTodayCheckIn, loadPeriodDates } from "@/lib/demoDataLoaders";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";
import { useWeeklyInsightGeneration } from "@/hooks/use-weekly-insights";
import { useXPNotifications } from "@/hooks/use-xp-notifications";
import MigrationDialog from "@/components/MigrationDialog";
import DashboardTour from "@/components/DashboardTour";
import QuickStartChecklist from "@/components/QuickStartChecklist";
import { XPBar } from "@/components/XPBar";
import { StreakDisplay } from "@/components/StreakDisplay";
import { ProfileButton } from "@/components/ProfileButton";
import { DashboardCustomizer } from "@/components/DashboardCustomizer";
import { useFeatureFlags, useAppMode } from "@/hooks/use-app-mode";
import {
  loadDashboardConfig,
  saveDashboardConfig,
  DashboardConfig,
} from "@/lib/dashboardWidgets";
const AIInsightCard = lazy(() => import("@/components/AIInsightCard").then((m) => ({ default: m.AIInsightCard })));
const RecentTradesTable = lazy(() => import("@/components/RecentTradesTable").then((m) => ({ default: m.RecentTradesTable })));
const LeaderboardPreview = lazy(() => import("@/components/LeaderboardPreview").then((m) => ({ default: m.LeaderboardPreview })));
const PropFirmSummary = lazy(() => import("@/components/PropFirmSummary").then((m) => ({ default: m.PropFirmSummary })));
import { Bell, Settings, Edit3, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { updateLoginStreak } from "@/lib/supabaseHelpers";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Mock data for demonstration
const rawMockTrades = [
  { id: "1", date: "Jan 24", instrument: "EUR/USD", direction: "long" as const, result: "win" as const, rMultiple: 2.1, strategy: "ICT", cyclePhase: "Follicular" },
  { id: "2", date: "Jan 23", instrument: "GBP/JPY", direction: "short" as const, result: "loss" as const, rMultiple: -1, strategy: "SMC", cyclePhase: "Follicular" },
  { id: "3", date: "Jan 22", instrument: "NAS100", direction: "long" as const, result: "win" as const, rMultiple: 1.5, strategy: "ICT", cyclePhase: "Ovulation" },
  { id: "4", date: "Jan 21", instrument: "XAU/USD", direction: "short" as const, result: "breakeven" as const, rMultiple: 0, strategy: "SMC", cyclePhase: "Ovulation" },
];

const parseToIso = (d: string) => {
  try {
    const dt = new Date(`${d} 2025`);
    if (isNaN(dt.getTime())) return undefined;
    return dt.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
};

// Sortable Widget Wrapper
function SortableWidget({ id, children, isEditMode }: { id: string; children: React.ReactNode; isEditMode: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditMode ? 'move' : 'default',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      className={`${isEditMode ? 'ring-2 ring-primary/50 rounded-2xl hover:ring-primary' : ''}`}
      onClick={handleClick}
      onClickCapture={handleClick}
    >
      {isEditMode && (
        <div className="absolute inset-0 z-10" style={{ pointerEvents: 'all' }} />
      )}
      {children}
    </div>
  );
}

const mockTrades = rawMockTrades.map((t) => ({ ...t, iso: parseToIso(t.date) }));

const mockLeaderboard = [
  { rank: 1, name: "Sarah M.", avatar: "👩‍💼", score: 847, badge: "Miss Discipline" },
  { rank: 2, name: "Emma K.", avatar: "👩‍🎤", score: 792, badge: "Cycle Master" },
  { rank: 3, name: "Luna P.", avatar: "👩‍🔬", score: 756 },
];

// Use centralized trade loader (supports DEMO mode)
const loadAllStoredTrades = () => {
  console.log('📊 Dashboard: Loading trades...');
  const trades = loadTradesFromLocalStorage();
  console.log('📊 Dashboard: Loaded', trades.length, 'trades');
  return trades;
};

export default function Dashboard() {
  const features = useFeatureFlags();
  const { appMode, isLoading: appModeLoading } = useAppMode();
  const [safetyModeEnabled, setSafetyModeEnabled] = useState(() => {
    return localStorage.getItem('cw_safety_mode_enabled') === 'true';
  });
  const [userName, setUserName] = useState<string>("");
  const [showHealthCheckIn, setShowHealthCheckIn] = useState(false);
  const [healthCheckData, setHealthCheckData] = useState<any>(null);
  const [riskAdjustment, setRiskAdjustment] = useState<number>(0);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() =>
    loadDashboardConfig()
  );
  const [isEditMode, setIsEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Enable automatic weekly AI insights generation
  useWeeklyInsightGeneration();

  const [avgCycleLength, setAvgCycleLength] = useState<number>(28);
  const [lastPeriodStart, setLastPeriodStart] = useState<string | null>(null);
  const [periodLength, setPeriodLength] = useState<number>(5);
  const [currentCycleDay, setCurrentCycleDay] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<"menstruation" | "follicular" | "ovulation" | "luteal">("follicular");
  const [todayCycleDay, setTodayCycleDay] = useState<number>(new Date().getDate());
  const [isPeriodLogged, setIsPeriodLogged] = useState<boolean>(false); // Is today's period logged?
  const [storedTrades, setStoredTrades] = useState<any[]>([]);
  const navigate = useNavigate();

  // Enable XP notifications
  useXPNotifications();

  // Check if daily health check-in needs to be shown (but only AFTER tour is complete)
  useEffect(() => {
    const hasDoneTour = localStorage.getItem("cw_tour_dashboard");
    
    // Check if already completed today (DEMO or USER mode)
    const hasCheckedInToday = hasCompletedTodayCheckIn();

    if (!hasCheckedInToday && hasDoneTour) {
      setTimeout(() => setShowHealthCheckIn(true), 1000);
    }
  }, []);

  useEffect(() => {
    // Load user name from Supabase
    const loadUserName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.name) {
          setUserName(user.user_metadata.name);
        } else {
          setUserName("");
        }

        if (user) {
          try {
            await updateLoginStreak(user.id);
          } catch (error) {
            console.error('Failed to update login streak:', error);
          }
        }
      } catch (e) {
        setUserName("");
      }
    };
    loadUserName();

    // Load cycle settings (DEMO or USER mode)
    const cycleSettings = loadCycleSettings();
    setAvgCycleLength(cycleSettings.avgCycleLength);
    setPeriodLength(cycleSettings.periodLength);
    setLastPeriodStart(cycleSettings.lastPeriodStart);

    // Get current cycle info
    const cycleInfo = getCurrentCycleInfo();
    if (cycleInfo) {
      setCurrentCycleDay(cycleInfo.cycleDay);
      setCurrentPhase(cycleInfo.phase);
    }

    // Check if today has a logged period
    const todayIso = new Date().toISOString().slice(0, 10);
    const periodDates = loadPeriodDates();
    setIsPeriodLogged(periodDates.includes(todayIso));

    // load stored trades and watch storage events
    const load = () => setStoredTrades(loadAllStoredTrades());
    load();
    const onStorage = () => load();
    const onTradesUpdated = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("trades-updated", onTradesUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("trades-updated", onTradesUpdated);
    };
  }, []);

  // compute overall and per-strategy stats
  const { totalTrades, totalWins, totalPnl, avgR, strategySummary } = useMemo(() => {
    let total = 0;
    let wins = 0;
    let pnl = 0;
    let rSum = 0;
    const map: Record<string, { count: number; wins: number; totalR: number; pnl: number }> = {};

    for (const t of storedTrades) {
      total += 1;
      if (t.result === 'win') wins += 1;
      const r = typeof t.rMultiple === 'number' && t.rMultiple != null ? t.rMultiple : Number(t.rMultiple) || 0;
      const p = Number(t.pnl) || 0;
      rSum += r;
      pnl += p;
      const name = t.strategy || 'Unknown';
      if (!map[name]) map[name] = { count: 0, wins: 0, totalR: 0, pnl: 0 };
      map[name].count += 1;
      if (t.result === 'win') map[name].wins += 1;
      map[name].totalR += r;
      map[name].pnl += p;
    }
    const summary = Object.keys(map).map((k) => ({ name: k, ...map[k] })).sort((a, b) => b.count - a.count);
    return {
      totalTrades: total,
      totalWins: wins,
      totalPnl: Math.round(pnl),
      avgR: total > 0 ? +(rSum / total).toFixed(2) : 0,
      strategySummary: summary,
    };
  }, [storedTrades]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleHealthCheckInComplete = (data: any) => {
    setHealthCheckData(data);
    setRiskAdjustment(data.riskReduction);
    setShowHealthCheckIn(false);
    localStorage.setItem(`cw_daily_checkin_${data.date}`, JSON.stringify(data));
  };

  const handleSaveConfig = (newConfig: DashboardConfig) => {
    setDashboardConfig(newConfig);
    saveDashboardConfig(newConfig);
  };

  const enabledWidgets = dashboardConfig.widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = enabledWidgets.findIndex(w => w.id === active.id);
      const newIndex = enabledWidgets.findIndex(w => w.id === over.id);
      
      const reordered = arrayMove(enabledWidgets, oldIndex, newIndex);
      
      const updated = {
        ...dashboardConfig,
        widgets: dashboardConfig.widgets.map(w => {
          const newOrderIndex = reordered.findIndex(rw => rw.id === w.id);
          if (newOrderIndex !== -1) {
            return { ...w, order: newOrderIndex };
          }
          return w;
        }),
      };
      setDashboardConfig(updated);
      saveDashboardConfig(updated);
    }
  };

  // Render widget based on ID
  const renderWidget = (widget: any) => {
    switch (widget.id) {
      case 'cycle-phase':
        return (
          <CyclePhaseIndicator
            phase={currentPhase}
            day={currentCycleDay || 1}
            recommendation={
              currentPhase === "menstruation" ? "Energy may be lower. Consider smaller position sizes or taking a break."
              : currentPhase === "follicular" ? "Rising energy and focus. Good time for analytical trading."
              : currentPhase === "ovulation" ? "Peak confidence and communication. Be mindful of overconfidence."
              : "Increased emotional sensitivity. Review decisions carefully before entering."
            }
          />
        );
      case 'performance-cards':
        // Always show performance cards - display 0 if no trades, no fake change percentages
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PerformanceCard title="Monthly P&L" value={totalPnl} change={0} type="currency" />
            <PerformanceCard title="Win Rate" value={totalTrades ? Math.round((totalWins / totalTrades) * 100) : 0} change={0} type="percentage" icon="percent" />
            <PerformanceCard title="Avg R" value={avgR} change={0} type="ratio" icon="target" />
            <PerformanceCard title="Trades" value={totalTrades} type="count" />
          </div>
        );
      case 'ai-insight':
        // Always show patterns - real data or "No trades yet" message
        return features.showGamification ? (
          <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-24" />}>
            <AIInsightCard
              insight={
                strategySummary && strategySummary.length > 0
                  ? strategySummary
                      .slice(0, 3)
                      .map((s: any) => `${s.name}: ${Math.round((s.wins / s.count) * 100) || 0}% (${s.count})`)
                      .join(" • ")
                  : "No trades yet. Start logging trades to discover patterns."
              }
              category="pattern"
              actionLabel="View Full Analysis"
            />
          </Suspense>
        ) : null;
      case 'recent-trades':
        // Always show recent trades - empty array in FILMING mode without trades
        return (
          <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card" />}>
            <RecentTradesTable
              trades={(() => {
                const mapTrade = (t: any) => ({
                  id: t.id || String(t.created_at || Date.now()),
                  date: t.date || "Unknown",
                  iso: t.date, // For date links
                  instrument: t.symbol || t.instrument || "Unknown",
                  direction: (t.direction === "short" ? "short" : "long") as "long" | "short",
                  result: (t.result === "win" || t.result === "loss" || t.result === "breakeven" ? t.result : "breakeven") as "win" | "loss" | "breakeven",
                  rMultiple: typeof t.r_multiple === "number" ? t.r_multiple : (typeof t.rMultiple === "number" ? t.rMultiple : Number(t.r_multiple || t.rMultiple || 0)),
                  strategy: t.strategy || "",
                  cyclePhase: t.cycle_phase || t.cyclePhase || t.phase || "",
                });
                const displayed = (storedTrades || []).map(mapTrade);
                if (displayed.length > 0) return displayed;
                // In FILMING mode, don't show mock trades
                if (appMode === 'FILMING') return [];
                return mockTrades.map((m) => ({
                  id: m.id,
                  date: m.date,
                  instrument: m.instrument,
                  direction: m.direction,
                  result: m.result,
                  rMultiple: m.rMultiple,
                  strategy: m.strategy,
                  cyclePhase: (m.cyclePhase || "") as string,
                }));
              })()}
            />
          </Suspense>
        );
      case 'journal-entry':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-card p-2.5">
                <span className="text-[22px]">📔</span>
              </div>
              <h3 className="font-semibold text-foreground">Journal Entry</h3>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground max-w-md">
                Reflect on your cycle, symptoms, and trading day. Journaling helps you discover patterns and improve your performance.
              </p>
              <Button
                className="w-full py-3 text-sm font-medium mt-6"
                size="default"
                onClick={() => {
                  const today = new Date();
                  const iso = today.toISOString().slice(0, 10);
                  navigate(`/day/${iso}`);
                }}
              >
                Add Journal Entry for Today
              </Button>
            </div>
          </motion.div>
        );
      case 'prop-firm-summary':
        return (
          <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-32" />}>
            <PropFirmSummary totalExpenses={2450} totalPayouts={8920} netProfit={6470} roi={264} />
          </Suspense>
        );
      case 'leaderboard-preview':
        return (
          <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-32" />}>
            <LeaderboardPreview entries={mockLeaderboard} type="discipline" currentUserRank={12} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24 pt-20 lg:pl-64 lg:pt-8">
      <MigrationDialog />
      <DailyHealthCheckIn isOpen={showHealthCheckIn} onComplete={handleHealthCheckInComplete} />
      <DashboardTour />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mx-auto max-w-7xl p-4 lg:p-8">
        <motion.header variants={itemVariants} className="dashboard-header mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">Welcome back, {userName ? userName : "Trader"}</h1>
            <p className="mt-1 text-muted-foreground">Let's make today profitable and aligned with your body.</p>
            {riskAdjustment > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">
                  ⚠️ Recommended Risk Reduction: -{riskAdjustment}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-xl bg-card p-2.5 text-muted-foreground shadow-soft hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCustomizer(true)}
              className="rounded-xl"
              title="Customize Dashboard"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <ProfileButton />
          </div>
        </motion.header>

        {/* Quick Start Checklist - only in USER mode */}
        {features.showGamification && <QuickStartChecklist />}

        {/* XP Bar - only in USER mode */}
        {features.showGamification && (
          <motion.div variants={itemVariants} className="mb-6 xp-bar">
            <XPBar />
          </motion.div>
        )}

        {/* Streaks - only in USER mode */}
        {features.showGamification && (
          <motion.div variants={itemVariants} className="mb-6">
            <StreakDisplay />
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="space-y-6 lg:col-span-2">
            {/* Cycle Phase */}
            <CyclePhaseIndicator
              phase={currentPhase}
              day={currentCycleDay || 1}
              cycleLength={avgCycleLength}
              isPeriodLogged={isPeriodLogged}
              recommendation={
                currentPhase === "menstruation" ? "Energy may be lower. Consider smaller position sizes or taking a break."
                : currentPhase === "follicular" ? "Rising energy and focus. Good time for analytical trading."
                : currentPhase === "ovulation" ? "Peak confidence and communication. Be mindful of overconfidence."
                : "Increased emotional sensitivity. Review decisions carefully before entering."
              }
            />

            {/* Always show performance cards - shows 0 if no trades, no fake change percentages */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PerformanceCard title="Monthly P&L" value={totalPnl} change={0} type="currency" />
              <PerformanceCard title="Win Rate" value={totalTrades ? Math.round((totalWins / totalTrades) * 100) : 0} change={0} type="percentage" icon="percent" />
              <PerformanceCard title="Avg R" value={avgR} change={0} type="ratio" icon="target" />
              <PerformanceCard title="Trades" value={totalTrades} type="count" />
            </div>

            {/* Always show AI insights - real patterns or "No trades yet" */}
            {!(appMode === 'FILMING' && storedTrades.length === 0) && (
              <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-24" />}>
                <AIInsightCard
                  insight={
                    strategySummary && strategySummary.length > 0
                      ? strategySummary
                          .slice(0, 3)
                          .map((s: any) => `${s.name}: ${Math.round((s.wins / s.count) * 100) || 0}% (${s.count})`)
                          .join(" • ")
                      : "No trades yet. Start logging trades to discover patterns."
                  }
                  category="pattern"
                  actionLabel="View Full Analysis"
                />
              </Suspense>
            )}

            {/* Always show recent trades table - shows empty or mock data */}
            <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card" />}>
              <RecentTradesTable
                trades={(() => {
                  const mapTrade = (t: any) => ({
                  id: t.id || String(t.created_at || Date.now()),
                  date: t.date || "Unknown",
                  iso: t.date, // For date links
                  instrument: t.symbol || t.instrument || "Unknown",
                  direction: (t.direction === "short" ? "short" : "long") as "long" | "short",
                  result: (t.result === "win" || t.result === "loss" || t.result === "breakeven" ? t.result : "breakeven") as "win" | "loss" | "breakeven",
                  rMultiple: typeof t.r_multiple === "number" ? t.r_multiple : (typeof t.rMultiple === "number" ? t.rMultiple : Number(t.r_multiple || t.rMultiple || 0)),
                  strategy: t.strategy || "",
                  cyclePhase: t.cycle_phase || t.cyclePhase || t.phase || "",
                  });

                  const displayed = (storedTrades || []).map(mapTrade);
                  if (displayed.length > 0) return displayed;
                  // In FILMING mode with no trades: show empty array (RecentTradesTable will show "No trades yet")
                  if (appMode === 'FILMING') return [];
                  // In USER/DEMO mode: show mock trades as placeholder
                  return mockTrades.map((m) => ({
                    id: m.id,
                    date: m.date,
                    instrument: m.instrument,
                    direction: m.direction,
                    result: m.result,
                    rMultiple: m.rMultiple,
                    strategy: m.strategy,
                    cyclePhase: (m.cyclePhase || "") as string,
                  }));
                })()}
              />
            </Suspense>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <PeriodPrediction />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-card p-2.5">
                  <span className="text-[22px]">📔</span>
                </div>
                <h3 className="font-semibold text-foreground">Journal Entry</h3>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground max-w-md">
                  Reflect on your cycle, symptoms, and trading day. Journaling helps you discover patterns and improve your performance.
                </p>
                <Button
                  className="w-full py-3 text-sm font-medium mt-6"
                  size="default"
                  onClick={() => {
                    const today = new Date();
                    const iso = today.toISOString().slice(0, 10);
                    navigate(`/day/${iso}`);
                  }}
                >
                  Add Journal Entry for Today
                </Button>
              </div>
            </motion.div>

            <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-32" />}>
              <PropFirmSummary totalExpenses={2450} totalPayouts={8920} netProfit={6470} roi={264} />
            </Suspense>

            {features.showLeaderboard && (
              <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-32" />}>
                <LeaderboardPreview entries={mockLeaderboard} type="discipline" currentUserRank={12} />
              </Suspense>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Customizer Modal */}
      {showCustomizer && (
        <DashboardCustomizer
          config={dashboardConfig}
          onClose={() => setShowCustomizer(false)}
          onSave={handleSaveConfig}
        />
      )}
    </main>
  );
}
