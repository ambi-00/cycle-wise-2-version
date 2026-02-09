import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { CyclePhaseIndicator } from "@/components/CyclePhaseIndicator";
import { SafetyModeToggle } from "@/components/SafetyModeToggle";
import { PerformanceCard } from "@/components/PerformanceCard";
import { DailyHealthCheckIn } from "@/components/DailyHealthCheckIn";
import { useWeeklyInsightGeneration } from "@/hooks/use-weekly-insights";
import { useXPNotifications } from "@/hooks/use-xp-notifications";
import MigrationDialog from "@/components/MigrationDialog";
import DashboardTour from "@/components/DashboardTour";
import QuickStartChecklist from "@/components/QuickStartChecklist";
import { XPBar } from "@/components/XPBar";
import { StreakDisplay } from "@/components/StreakDisplay";
import { ProfileButton } from "@/components/ProfileButton";
const AIInsightCard = lazy(() => import("@/components/AIInsightCard").then((m) => ({ default: m.AIInsightCard })));
const RecentTradesTable = lazy(() => import("@/components/RecentTradesTable").then((m) => ({ default: m.RecentTradesTable })));
const LeaderboardPreview = lazy(() => import("@/components/LeaderboardPreview").then((m) => ({ default: m.LeaderboardPreview })));
const PropFirmSummary = lazy(() => import("@/components/PropFirmSummary").then((m) => ({ default: m.PropFirmSummary })));
import { Bell, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { updateLoginStreak } from "@/lib/supabaseHelpers";

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

const mockTrades = rawMockTrades.map((t) => ({ ...t, iso: parseToIso(t.date) }));

const mockLeaderboard = [
  { rank: 1, name: "Sarah M.", avatar: "👩‍💼", score: 847, badge: "Miss Discipline" },
  { rank: 2, name: "Emma K.", avatar: "👩‍🎤", score: 792, badge: "Cycle Master" },
  { rank: 3, name: "Luna P.", avatar: "👩‍🔬", score: 756 },
];

// helper: load all trades stored under cw_journal_{ISO}
const loadAllStoredTrades = () => {
  const trades: any[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    if (key.startsWith("cw_journal_")) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        (data.trades || []).forEach((t: any) => trades.push(t));
      } catch (e) {
        // ignore malformed entries
      }
    }
  }
  return trades;
};

export default function Dashboard() {
  const [safetyModeEnabled, setSafetyModeEnabled] = useState(() => {
    return localStorage.getItem('cw_safety_mode_enabled') === 'true';
  });
  const [userName, setUserName] = useState<string>("");
  const [showHealthCheckIn, setShowHealthCheckIn] = useState(false);
  const [healthCheckData, setHealthCheckData] = useState<any>(null);
  const [riskAdjustment, setRiskAdjustment] = useState<number>(0); // percentage to reduce risk by

  // Enable automatic weekly AI insights generation
  useWeeklyInsightGeneration();

  const [avgCycleLength, setAvgCycleLength] = useState<number>(28);
  const [lastPeriodStart, setLastPeriodStart] = useState<string | null>(null);
  const [periodLength, setPeriodLength] = useState<number>(5);
  const [currentCycleDay, setCurrentCycleDay] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<"menstruation" | "follicular" | "ovulation" | "luteal">("follicular");
  const [todayCycleDay, setTodayCycleDay] = useState<number>(new Date().getDate());
  const [storedTrades, setStoredTrades] = useState<any[]>([]);
  const navigate = useNavigate();

  // Enable XP notifications
  useXPNotifications();

  // Check if daily health check-in needs to be shown (but only AFTER tour is complete)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastCheckinKey = `cw_daily_checkin_${today}`;
    const hasCheckedInToday = localStorage.getItem(lastCheckinKey);
    const hasDoneTour = localStorage.getItem("cw_tour_dashboard");
    
    // Only show health check-in if user has completed tour AND hasn't checked in today
    if (!hasCheckedInToday && hasDoneTour) {
      setTimeout(() => setShowHealthCheckIn(true), 1000); // Delay to let tour finish
    }
  }, []);

  useEffect(() => {
    // Load user name from Supabase
    const loadUserName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // Get the name as set during registration
        if (user?.user_metadata?.name) {
          setUserName(user.user_metadata.name);
        } else {
          setUserName("");
        }

        // Update login streak on dashboard load
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

    try {
      const a = localStorage.getItem("cw_avgCycleLength");
      const p = localStorage.getItem("cw_periodLength");
      if (a) setAvgCycleLength(Number(a));
      if (p) setPeriodLength(Number(p));
    } catch (e) {
      // ignore
    }

    // --- CycleTracker-Logik: letzten geloggten Periodenstart aus Journal finden ---
    const msPerDay = 1000 * 60 * 60 * 24;
    let detectedStart: string | null = null;
    const logged: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cw_journal_')) {
        try {
          const journal = JSON.parse(localStorage.getItem(key) || '{}');
          if (journal.hasPeriod) {
            const dateStr = key.replace('cw_journal_', '');
            logged.push(dateStr);
          }
        } catch { /* ignore */ }
      }
    }
    if (logged.length > 0) {
      // Sort descending, finde den Start der letzten Periode (wie CycleTracker)
      const sorted = [...logged].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      let currentPeriodStart = sorted[0];
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = new Date(sorted[i]).getTime();
        const next = new Date(sorted[i + 1]).getTime();
        const diff = current - next;
        if (diff <= msPerDay * 1.5) {
          currentPeriodStart = sorted[i + 1];
        } else {
          break;
        }
      }
      detectedStart = currentPeriodStart;
    } else {
      detectedStart = localStorage.getItem("cw_lastPeriodStart");
    }
    setLastPeriodStart(detectedStart);

    if (detectedStart) {
      const today = new Date();
      const last = new Date(detectedStart);
      const avg = Number(localStorage.getItem("cw_avgCycleLength") || 28);
      const per = Number(localStorage.getItem("cw_periodLength") || 5);
      const diff = Math.floor((today.getTime() - last.getTime()) / msPerDay);
      const cycleDay = (((diff % avg) + avg) % avg) + 1;
      setCurrentCycleDay(cycleDay);
      
      // Calculate the phase for the current cycle day
      const follicularEnd = Math.min(per + 7, avg);
      const ovulationEnd = Math.min(per + 11, avg);
      let phase: "menstruation" | "follicular" | "ovulation" | "luteal" = "menstruation";
      if (cycleDay <= per) phase = "menstruation";
      else if (cycleDay <= follicularEnd) phase = "follicular";
      else if (cycleDay <= ovulationEnd) phase = "ovulation";
      else phase = "luteal";
      setCurrentPhase(phase);
    }

    // load stored trades and watch storage events
    const load = () => setStoredTrades(loadAllStoredTrades());
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
    
    // Store in localStorage so it persists
    localStorage.setItem(`cw_daily_checkin_${data.date}`, JSON.stringify(data));
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
            <ProfileButton />
          </div>
        </motion.header>

        {/* Quick Start Checklist */}
        <QuickStartChecklist />

        {/* XP Bar */}
        <motion.div variants={itemVariants} className="mb-6 xp-bar">
          <XPBar />
        </motion.div>

        {/* Streaks */}
        <motion.div variants={itemVariants} className="mb-6">
          <StreakDisplay />
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="space-y-6 lg:col-span-2">

            {/* Calculate phase and day for today, using the same logic as CycleTracker (always use detectedStart from logs, not possibly outdated state) */}
            {(() => {
              // Hole die aktuelle Phase direkt aus dem Calendar-Generator wie im CycleTracker
              const today = new Date();
              const year = today.getFullYear();
              const month = today.getMonth();
              // Hole Settings aus localStorage
              const avg = Number(localStorage.getItem("cw_avgCycleLength") || 28);
              const per = Number(localStorage.getItem("cw_periodLength") || 5);
              const lastPeriodStart = localStorage.getItem("cw_lastPeriodStart") || null;
              // Calendar-Logik wie in CycleTracker
              function generateCalendarData(year: number, monthIndex: number, avgCycleLength: number, lastPeriodStartIso: string|null, periodLength: number) {
                const days = [];
                const msPerDay = 1000 * 60 * 60 * 24;
                const lastStart = lastPeriodStartIso ? new Date(lastPeriodStartIso) : null;
                const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                  const date = new Date(year, monthIndex, i);
                  let cycleDay = 1;
                  if (lastStart) {
                    const diff = Math.floor((date.getTime() - lastStart.getTime()) / msPerDay);
                    cycleDay = (((diff % avgCycleLength) + avgCycleLength) % avgCycleLength) + 1;
                  }
                  const follicularEnd = Math.min(periodLength + 7, avgCycleLength);
                  const ovulationEnd = Math.min(periodLength + 11, avgCycleLength);
                  const phase = cycleDay <= periodLength ? "menstruation" : cycleDay <= follicularEnd ? "follicular" : cycleDay <= ovulationEnd ? "ovulation" : "luteal";
                  days.push({ day: i, date, cycleDay, phase });
                }
                return days;
              }
              const calendarData = generateCalendarData(year, month, avg, lastPeriodStart, per);
              const todayObj = calendarData.find(d => d.date.getDate() === today.getDate());
              if (!todayObj) {
                return (
                  <div className="rounded-2xl bg-card p-6 shadow-card text-center">
                    <div className="text-lg font-semibold mb-2">No Period Data Found</div>
                    <div className="text-muted-foreground mb-2">Please log at least one period day in the calendar or journal so the cycle phase can be calculated.</div>
                  </div>
                );
              }
              // Passende Empfehlung je nach Phase
              const recommendations: Record<string, string> = {
                menstruation: "Energy may be lower. Consider smaller position sizes or taking a break.",
                follicular: "Rising energy and focus. Good time for analytical trading.",
                ovulation: "Peak confidence and communication. Be mindful of overconfidence.",
                luteal: "Increased emotional sensitivity. Review decisions carefully before entering.",
              };
              return (
                <CyclePhaseIndicator
                  phase={todayObj.phase}
                  day={todayObj.cycleDay}
                  recommendation={recommendations[todayObj.phase]}
                />
              );
            })()}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PerformanceCard title="Monthly P&L" value={totalPnl} change={12.5} type="currency" />
              <PerformanceCard title="Win Rate" value={totalTrades ? Math.round((totalWins / totalTrades) * 100) : 0} change={5} type="percentage" icon="percent" />
              <PerformanceCard title="Avg R" value={avgR} change={8} type="ratio" icon="target" />
              <PerformanceCard title="Trades" value={totalTrades} type="count" />
            </div>

            <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-24" />}>
              <AIInsightCard
                insight={
                  strategySummary && strategySummary.length > 0
                    ? strategySummary
                        .slice(0, 3)
                        .map((s: any) => `${s.name}: ${Math.round((s.wins / s.count) * 100) || 0}% (${s.count})`)
                        .join(" • ")
                    : "Your win rate increases by 42% when you trade during your Follicular phase with volume confirmation. Consider adding this to your checklist."
                }
                category="pattern"
                actionLabel="View Full Analysis"
              />
            </Suspense>

            {strategySummary && strategySummary.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {strategySummary.slice(0, 6).map((s: any) => (
                  <button
                    key={s.name}
                    onClick={() => navigate(`/journal?strategy=${encodeURIComponent(s.name)}`)}
                    className="rounded-full bg-muted/20 px-3 py-1 text-sm text-foreground hover:bg-muted/40"
                  >
                    {s.name} — {Math.round((s.wins / s.count) * 100) || 0}% ({s.count})
                  </button>
                ))}
              </div>
            )}

            <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card" />}> 
              <RecentTradesTable
                trades={(() => {
                const mapTrade = (t: any) => ({
                  id: t.id || String(t.createdAt || Date.now()),
                  date: t.date || t.iso || "Unknown",
                  instrument: t.instrument || "Unknown",
                  direction: (t.direction === "short" ? "short" : "long") as "long" | "short",
                  result: (t.result === "win" || t.result === "loss" || t.result === "breakeven" ? t.result : "breakeven") as
                    | "win"
                    | "loss"
                    | "breakeven",
                  rMultiple: typeof t.rMultiple === "number" && t.rMultiple != null ? t.rMultiple : Number(t.rMultiple) || 0,
                  strategy: t.strategy || "",
                  cyclePhase: t.cyclePhase || t.phase || "",
                });

                const displayed = (storedTrades || []).map(mapTrade);
                if (displayed.length > 0) return displayed;
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
            {/* Safety Mode Toggle - Hidden for initial launch, uncomment to re-enable */}
            {/* <SafetyModeToggle enabled={safetyModeEnabled} onToggle={setSafetyModeEnabled} suggested={false} /> */}

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
                  className="w-full py-4 text-base font-semibold mt-6"
                  size="lg"
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

            <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-32" />}>
              <LeaderboardPreview entries={mockLeaderboard} type="discipline" currentUserRank={12} />
            </Suspense>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}