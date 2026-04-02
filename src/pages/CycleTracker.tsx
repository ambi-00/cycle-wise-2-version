import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Shield, Plus, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SafetyModeToggle } from "@/components/SafetyModeToggle";
import CyclePredictions from "@/components/CyclePredictions";
import CycleTrackerTour from "@/components/CycleTrackerTour";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { FeatureGuard } from "@/components/FeatureGuard";
import { usePaymentSuccess } from "@/hooks/use-payment-success";
import { generateCalendarData, DayData } from "@/lib/cycleHelpers";
import { localDateStr } from "@/lib/utils";
import { loadCycleSettings, loadPeriodDates } from "@/lib/demoDataLoaders";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

type DayData = {
  day: number;
  date: Date;
  cycleDay: number;
  phase: "menstruation" | "follicular" | "ovulation" | "luteal";
  mood: number;
  energy: number;
  trades: number;
  pnl: number;
  isBeforeTracking?: boolean;
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const cyclePhases = [
  { name: "Menstruation", days: "1-5", color: "bg-cycle-menstruation/30 border-cycle-menstruation", description: "Bleeding and low energy.", icon: Info },
  { name: "Follicular", days: "6-12", color: "bg-cycle-follicular/30 border-cycle-follicular", description: "Rising energy and focus.", icon: Info },
  { name: "Ovulation", days: "13-16", color: "bg-cycle-ovulation/30 border-cycle-ovulation", description: "Peak energy and social drive.", icon: Info },
  { name: "Luteal", days: "17-28", color: "bg-cycle-luteal/30 border-cycle-luteal", description: "Pre-menstrual phase, possible irritability.", icon: Info },
];

// ─── Cycle Phase Intelligence ─────────────────────────────────────────────────
type PhaseKey = "menstruation" | "follicular" | "ovulation" | "luteal";

const CYCLE_PHASE_INFO: Record<
  PhaseKey,
  {
    emoji: string;
    name: string;
    days: string;
    borderColor: string;
    bgColor: string;
    badgeColor: string;
    hormone: string;
    mental: string;
    trading: string;
    tip: string;
  }
> = {
  menstruation: {
    emoji: "❄️",
    name: "Menstruation",
    days: "Days 1–5",
    borderColor: "border-red-400",
    bgColor: "bg-red-500/5",
    badgeColor: "bg-red-500/10 text-red-500",
    hormone: "Estrogen & progesterone are at their lowest levels",
    mental: "Introspection, detail-focus, lower physical energy, heightened self-awareness. Emotionally you may feel more sensitive or withdrawn.",
    trading: "Risk tolerance often decreases naturally — this can protect you from impulsive trades. Analytical clarity can be sharp, but emotional resilience is lower. Ideal for reviewing trades and preparing watchlists.",
    tip: "Pre-plan setups during this phase. Prioritise quality over quantity, and use this time to journal past trades.",
  },
  follicular: {
    emoji: "🌸",
    name: "Follicular",
    days: "Days 6–13",
    borderColor: "border-emerald-400",
    bgColor: "bg-emerald-500/5",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    hormone: "Estrogen is rising steadily",
    mental: "Energy and optimism increase, sharper focus, better memory and creativity. Confidence builds gradually. You feel more curious and motivated.",
    trading: "Cognitively your best phase. Great for learning new strategies, backtesting, and making important decisions. Decision-making quality is high.",
    tip: "Leverage this phase — dig into statistics, study new setups, and set your trading intentions for the cycle ahead.",
  },
  ovulation: {
    emoji: "☀️",
    name: "Ovulation",
    days: "Days 14–16",
    borderColor: "border-amber-400",
    bgColor: "bg-amber-500/5",
    badgeColor: "bg-amber-500/10 text-amber-600",
    hormone: "Estrogen peaks + LH surge",
    mental: "Peak confidence, high energy, competitive drive, heightened communication. You feel at your most capable — and you often are.",
    trading: "Risk tolerance is highest. Your confidence can work in your favour — but watch for overconfidence, oversizing, and overtrading.",
    tip: "Stick strictly to your risk rules. Pre-set your max daily loss limit before trading to guard against overconfidence.",
  },
  luteal: {
    emoji: "🍂",
    name: "Luteal",
    days: "Days 17–28",
    borderColor: "border-violet-400",
    bgColor: "bg-violet-500/5",
    badgeColor: "bg-violet-500/10 text-violet-600",
    hormone: "Progesterone rises then falls with estrogen",
    mental: "Early luteal can feel calm and focused. Late luteal often brings anxiety, irritability, lower serotonin, and emotional sensitivity. Decision fatigue increases.",
    trading: "Higher emotional reactivity is possible in late luteal. Fear of loss and revenge-trading risk both elevate. However, some traders perform better early in this phase due to natural caution.",
    tip: "Consider reducing position sizes in late luteal (days 22–28). Journal your emotional state before each trade.",
  },
};

interface PhaseStats {
  phase: PhaseKey;
  count: number;
  winRate: number;
  avgR: number;
  hasData: boolean;
}

function normalizePhase(raw?: string): PhaseKey | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("menstr")) return "menstruation";
  if (lower.includes("follic")) return "follicular";
  if (lower.includes("ovul")) return "ovulation";
  if (lower.includes("lut")) return "luteal";
  return null;
}

function computePhaseStats(trades: any[]): PhaseStats[] {
  const phaseKeys: PhaseKey[] = ["menstruation", "follicular", "ovulation", "luteal"];
  const acc: Record<PhaseKey, { wins: number; losses: number; totalR: number }> = {
    menstruation: { wins: 0, losses: 0, totalR: 0 },
    follicular:   { wins: 0, losses: 0, totalR: 0 },
    ovulation:    { wins: 0, losses: 0, totalR: 0 },
    luteal:       { wins: 0, losses: 0, totalR: 0 },
  };
  const closed = trades.filter((t) => t.status === "closed" && (t.result === "win" || t.result === "loss"));
  closed.forEach((t) => {
    const pk = normalizePhase(t.cyclePhase || t.cycle_phase);
    if (!pk) return;
    const r = t.r_multiple !== undefined ? t.r_multiple : (t.rMultiple ?? 0);
    acc[pk].totalR += typeof r === "number" ? r : 0;
    if (t.result === "win") acc[pk].wins++;
    else acc[pk].losses++;
  });
  return phaseKeys.map((pk) => {
    const { wins, losses, totalR } = acc[pk];
    const count = wins + losses;
    return {
      phase:   pk,
      count,
      winRate: count > 0 ? (wins / count) * 100 : 0,
      avgR:    count > 0 ? totalR / count : 0,
      hasData: count >= 3,
    };
  });
}

function PhaseCard({
  phaseKey,
  stats,
  isCurrent,
  delay = 0,
}: {
  phaseKey: PhaseKey;
  stats?: PhaseStats;
  isCurrent: boolean;
  delay?: number;
}) {
  const info = CYCLE_PHASE_INFO[phaseKey];
  const [expanded, setExpanded] = useState(isCurrent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border-2 ${info.bgColor} ${info.borderColor} p-5 shadow-soft cursor-pointer`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{info.name}</h3>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${info.badgeColor}`}>
                {info.days}
              </span>
              {isCurrent && (
                <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-primary/10 text-primary">
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{info.hormone}</p>
          </div>
        </div>
        {stats?.hasData ? (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-foreground">{stats.winRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{stats.count} trades</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0 mt-1">No data yet</span>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-card/70 p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mental & Emotional</p>
            <p className="text-sm text-foreground leading-relaxed">{info.mental}</p>
          </div>
          <div className="rounded-lg bg-card/70 p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Trading Influence</p>
            <p className="text-sm text-foreground leading-relaxed">{info.trading}</p>
          </div>
          {stats?.hasData ? (
            <div className="rounded-lg bg-card/70 p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Your Data ({stats.count} trades)
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.winRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div>
                  <p className={`text-xl font-bold ${stats.avgR >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stats.avgR >= 0 ? "+" : ""}{stats.avgR.toFixed(2)}R
                  </p>
                  <p className="text-xs text-muted-foreground">Avg R</p>
                </div>
              </div>
              <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
                <p className="text-sm leading-relaxed text-foreground">
                  {stats.winRate >= 60 && stats.avgR >= 0.5 ? (
                    <>✅ You're performing <strong>above average</strong> in this phase. Keep your usual approach.</>
                  ) : stats.avgR < 0 || stats.winRate < 45 ? (
                    <>⚠️ Your numbers dip here. Consider <strong>reducing position sizes</strong> during {info.name.toLowerCase()}.</>
                  ) : (
                    <>📊 Your performance here is <strong>consistent with your overall average</strong>.</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-card/70 p-3 border border-border">
              <p className="text-sm text-muted-foreground">
                💡 Log at least 3 trades with cycle phase data to see your personalised performance here.
              </p>
            </div>
          )}
          <div className="rounded-lg bg-card/70 p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">💡 Tip</p>
            <p className="text-sm text-foreground leading-relaxed">{info.tip}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Calendar data generator using settings
const generateCalendarData = (year: number, monthIndex: number, avgCycleLength: number, lastPeriodStartIso: string, periodLength: number, loggedPeriodDays: string[] = []): DayData[] => {
  const days: DayData[] = [];
  const msPerDay = 1000 * 60 * 60 * 24;

  // Parse ISO date string as LOCAL midnight (not UTC) to avoid timezone off-by-one bugs
  const parseLocalDate = (iso: string): Date => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const lastStart = lastPeriodStartIso ? parseLocalDate(lastPeriodStartIso) : null;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Helper: local YYYY-MM-DD string (avoids UTC offset bug)
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Build period groups from logged days (sorted ascending) — parse as local midnight
  const allLoggedDates = loggedPeriodDays
    .map(d => parseLocalDate(d))
    .sort((a, b) => a.getTime() - b.getTime());

  const periodGroups: Date[][] = [];
  let _group: Date[] = [];
  for (const d of allLoggedDates) {
    if (_group.length === 0 || d.getTime() - _group[_group.length - 1].getTime() <= msPerDay * 1.5) {
      _group.push(d);
    } else {
      periodGroups.push([..._group]);
      _group = [d];
    }
  }
  if (_group.length > 0) periodGroups.push(_group);
  const periodGroupStarts: Date[] = periodGroups.map(g => g[0]);

  // Anchor = earliest known period start (used to count predicted cycles)
  const anchor: Date | null = (() => {
    if (lastStart && (periodGroupStarts.length === 0 || lastStart <= periodGroupStarts[0])) return lastStart;
    return periodGroupStarts.length > 0 ? periodGroupStarts[0] : null;
  })();

  // For a predicted cycle starting at `predictedStart`, find the corresponding
  // logged period start (if the user actually tracked it). Allows ±50% of cycle length.
  const findLoggedStartForCycle = (predictedStart: Date): Date | null => {
    const window = avgCycleLength * 0.5 * msPerDay;
    for (const ps of periodGroupStarts) {
      const delta = ps.getTime() - predictedStart.getTime();
      if (delta >= -window && delta <= window) return ps;
    }
    return null;
  };

  // Earliest tracking date (before this = neutral/grey)
  const earliestTracking: Date | null = anchor;

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, monthIndex, i);
    const dateStr = toLocalDateStr(date);
    const isLoggedPeriodDay = loggedPeriodDays.includes(dateStr);

    // Before any tracking data → neutral
    const isBeforeTracking = !earliestTracking || date.getTime() < earliestTracking.getTime();

    let cycleDay = 1;
    let phase: "menstruation" | "follicular" | "ovulation" | "luteal" = "menstruation";

    if (!isBeforeTracking && anchor) {
      // ── Step 1: Find the predicted cycle start for this date ──────────────
      const daysSinceAnchor = Math.floor((date.getTime() - anchor.getTime()) / msPerDay);
      const n = Math.floor(daysSinceAnchor / avgCycleLength);
      const predictedCycleStart = new Date(anchor.getTime() + n * avgCycleLength * msPerDay);

      // ── Step 2: Find corresponding logged period (if user tracked it) ─────
      const loggedCycleStart = findLoggedStartForCycle(predictedCycleStart);

      // ── Step 3: Determine effective cycle start + luteal-extension flag ───
      //   Case A: period came late (logged > predicted)
      //     → days between predicted and logged-1 are LUTEAL (extending prev luteal)
      //     → from logged start: new cycle begins
      //   Case B: period came early or on time (logged <= predicted)
      //     → use logged start directly
      //   Case C: no logged period yet → use prediction
      let effectiveCycleStart: Date = predictedCycleStart;
      let isLutealExtension = false;

      if (loggedCycleStart) {
        if (date.getTime() < loggedCycleStart.getTime()) {
          // Before the actual logged start
          if (date.getTime() >= predictedCycleStart.getTime()) {
            // Predicted period window but user hasn't had it yet → luteal extension
            isLutealExtension = true;
          }
          effectiveCycleStart = predictedCycleStart; // used for cycleDay in luteal extension
        } else {
          // On or after actual logged start
          effectiveCycleStart = loggedCycleStart;
        }
      }
      // else: no logged period → effectiveCycleStart stays = predictedCycleStart

      // ── Step 4: Effective cycle length (distance to next logged start) ────
      let effectiveCycleLength = avgCycleLength;
      for (const ps of periodGroupStarts) {
        if (ps.getTime() > effectiveCycleStart.getTime()) {
          const dist = Math.floor((ps.getTime() - effectiveCycleStart.getTime()) / msPerDay);
          if (dist > 10) { effectiveCycleLength = dist; break; }
        }
      }

      // ── Step 5: Compute cycleDay ──────────────────────────────────────────
      cycleDay = Math.floor((date.getTime() - effectiveCycleStart.getTime()) / msPerDay) + 1;
      if (cycleDay < 1) cycleDay = 1;

      // ── Step 6: Determine period length for this cycle ───────────────────
      let actualPeriodLength = periodLength;
      const periodDaysForThisCycle = loggedPeriodDays.filter(d => {
        const ld = new Date(d);
        const diff = Math.floor((ld.getTime() - effectiveCycleStart.getTime()) / msPerDay);
        return diff >= 0 && diff < 15;
      }).sort();

      if (periodDaysForThisCycle.length > 0) {
        let consecutive = 0;
        for (const pd of periodDaysForThisCycle) {
          const dayNum = Math.floor((new Date(pd).getTime() - effectiveCycleStart.getTime()) / msPerDay);
          if (dayNum === consecutive) consecutive++;
          else break;
        }
        if (consecutive > 0) actualPeriodLength = Math.max(consecutive, periodLength);
      }

      // ── Step 7: Assign phase ──────────────────────────────────────────────
      const follicularEnd = Math.min(actualPeriodLength + 7, effectiveCycleLength);
      const ovulationEnd  = Math.min(actualPeriodLength + 11, effectiveCycleLength);

      if (isLutealExtension) {
        phase = "luteal";
      } else if (isLoggedPeriodDay) {
        phase = "menstruation";
      } else {
        phase = cycleDay <= actualPeriodLength ? "menstruation"
              : cycleDay <= follicularEnd      ? "follicular"
              : cycleDay <= ovulationEnd       ? "ovulation"
              : "luteal";
      }
    }

    // Load trades for this day
    let trades = 0;
    let pnl = 0;
    try {
      const journalData = localStorage.getItem(`cw_journal_${dateStr}`);
      if (journalData) {
        const journal = JSON.parse(journalData);
        if (journal.trades && Array.isArray(journal.trades)) {
          trades = journal.trades.length;
          pnl = journal.trades.reduce((sum: number, trade: any) =>
            sum + (typeof trade.pnl === 'number' ? trade.pnl : 0), 0);
        }
      }
    } catch { /* ignore */ }

    days.push({
      day: i,
      date,
      phase,
      cycleDay,
      mood: Math.floor(Math.random() * 5) + 5,
      energy: Math.floor(Math.random() * 5) + 5,
      trades,
      pnl,
      isBeforeTracking,
    });
  }
  return days;
};

export default function CycleTracker() {
  const [currentMonth] = useState("January 2025");
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());
  const navigate = useNavigate();
  usePaymentSuccess();
  const [safetyModeEnabled, setSafetyModeEnabled] = useState(() => {
    return localStorage.getItem('cw_safety_mode_enabled') === 'true';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Save Safety Mode to localStorage for browser extension
  useEffect(() => {
    localStorage.setItem('cw_safety_mode_enabled', safetyModeEnabled.toString());
  }, [safetyModeEnabled]);
  const [avgCycleLength, setAvgCycleLength] = useState<number>(28);
  const [lastPeriodStart, setLastPeriodStart] = useState<string>("2025-01-17");
  const [pmsDays, setPmsDays] = useState<number>(3);
  const [variationDays, setVariationDays] = useState<number>(2);
  const [periodLength, setPeriodLength] = useState<number>(5);
  const [periodDays, setPeriodDays] = useState<string[]>([]);
  const [loggedPeriodDays, setLoggedPeriodDays] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [storedTrades, setStoredTrades] = useState<any[]>([]);

  // Load trades once for Phase Intelligence
  useEffect(() => {
    setStoredTrades(loadTradesFromLocalStorage());
  }, []);

  // Helper: Find the start of the most recent period from logged days
  const findLastPeriodStartFromLogs = (loggedDays: string[]): string | null => {
    if (loggedDays.length === 0) return null;
    
    // Sort dates descending (newest first)
    const sorted = [...loggedDays].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Find consecutive period days starting from the most recent
    // Walk backwards to find the start of the current/last period
    let currentPeriodStart = sorted[0];
    const msPerDay = 1000 * 60 * 60 * 24;
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = new Date(sorted[i]).getTime();
      const next = new Date(sorted[i + 1]).getTime();
      const diff = current - next;
      
      // If days are consecutive (1 day apart), continue
      if (diff <= msPerDay * 1.5) {
        currentPeriodStart = sorted[i + 1];
      } else {
        // Gap found - we have the start of the most recent period
        break;
      }
    }
    
    return currentPeriodStart;
  };

  // Helper: Compute average cycle length from all logged period group starts
  const computeAvgCycleFromLogs = (loggedDays: string[]): number | null => {
    if (loggedDays.length === 0) return null;
    const ms = 1000 * 60 * 60 * 24;
    const allDates = [...loggedDays].map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
    // Build period groups
    const groups: Date[][] = [];
    let g: Date[] = [];
    for (const d of allDates) {
      if (g.length === 0 || d.getTime() - g[g.length - 1].getTime() <= ms * 1.5) {
        g.push(d);
      } else {
        groups.push([...g]);
        g = [d];
      }
    }
    if (g.length > 0) groups.push(g);
    if (groups.length < 2) return null; // Need at least 2 periods to compute
    const starts = groups.map(gr => gr[0].getTime());
    let total = 0;
    for (let i = 1; i < starts.length; i++) {
      total += Math.floor((starts[i] - starts[i - 1]) / ms);
    }
    return Math.round(total / (starts.length - 1));
  };

  // load saved settings from localStorage on mount
  useEffect(() => {
    try {
      // Load cycle settings (DEMO or USER mode)
      const cycleSettings = loadCycleSettings();
      setAvgCycleLength(cycleSettings.avgCycleLength);
      setPeriodLength(cycleSettings.periodLength);
      if (cycleSettings.lastPeriodStart) {
        setLastPeriodStart(cycleSettings.lastPeriodStart);
      }
      
      // Load logged period dates (DEMO or USER mode)
      const logged = loadPeriodDates();
      setLoggedPeriodDays(logged);
      
      // Load other settings from localStorage (only in USER mode)
      const p = localStorage.getItem('cw_pmsDays');
      const v = localStorage.getItem('cw_variationDays');
      const pd = localStorage.getItem('cw_periodDays');
      if (p) setPmsDays(Number(p));
      if (v) setVariationDays(Number(v));
      if (pd) {
        try { setPeriodDays(JSON.parse(pd)); } catch { setPeriodDays([]); }
      }
      
      // Auto-update avgCycleLength from actual logged cycle distances
      // NOTE: We do NOT overwrite lastPeriodStart here — it must stay as the
      // original prediction anchor from settings. Logged period days are passed
      // separately to generateCalendarData which already handles actual-vs-predicted.
      const computedAvg = computeAvgCycleFromLogs(logged);
      if (computedAvg && computedAvg >= 20 && computedAvg <= 45) {
        setAvgCycleLength(computedAvg);
        localStorage.setItem('cw_avgCycleLength', String(computedAvg));
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  // Reload logged period days when returning to this page (e.g. after logging period on Day page)
  useEffect(() => {
    const reloadLoggedPeriods = () => {
      const logged = loadPeriodDates();
      setLoggedPeriodDays(logged);
      
      // Auto-update avgCycleLength from actual logged cycle distances
      // NOTE: We do NOT overwrite lastPeriodStart — must stay as original anchor.
      const computedAvg = computeAvgCycleFromLogs(logged);
      if (computedAvg && computedAvg >= 20 && computedAvg <= 45) {
        setAvgCycleLength(computedAvg);
        localStorage.setItem('cw_avgCycleLength', String(computedAvg));
      }
    };

    // Reload when window gets focus (user comes back from Day page)
    window.addEventListener('focus', reloadLoggedPeriods);
    // Also reload when period is logged via same-tab SPA navigation
    window.addEventListener('period-updated', reloadLoggedPeriods);
    window.addEventListener('storage', reloadLoggedPeriods);
    return () => {
      window.removeEventListener('focus', reloadLoggedPeriods);
      window.removeEventListener('period-updated', reloadLoggedPeriods);
      window.removeEventListener('storage', reloadLoggedPeriods);
    };
  }, []);

  const saveSettings = () => {
    try {
      localStorage.setItem('cw_avgCycleLength', String(avgCycleLength));
      localStorage.setItem('cw_lastPeriodStart', lastPeriodStart);
      localStorage.setItem('cw_pmsDays', String(pmsDays));
      localStorage.setItem('cw_variationDays', String(variationDays));
      localStorage.setItem('cw_periodLength', String(periodLength));
      localStorage.setItem('cw_periodDays', JSON.stringify(periodDays));
    } catch (e) {
      // ignore
    }
  };

  // (no auto-save) — saving happens when user clicks Save Edits

  // displayed month (initially current month); navigation updates this
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [displayedDate, setDisplayedDate] = useState<Date>(new Date());
  const calendarYear = displayedDate.getFullYear();
  const calendarMonthIndex = displayedDate.getMonth();
  const currentMonthLabel = `${monthNames[calendarMonthIndex]} ${calendarYear}`;

  const [todayDate, setTodayDate] = useState<Date>(() => new Date());

  // generate calendar with the (possibly) loaded settings (periodLength affects phases)
  const calendarData = generateCalendarData(calendarYear, calendarMonthIndex, avgCycleLength, lastPeriodStart, periodLength, loggedPeriodDays);

  // derived stats
  const msPerDay = 1000 * 60 * 60 * 24;
  // For display (current cycle day / next period countdown), use the most recent
  // logged period start if available, otherwise fall back to the settings anchor.
  const detectedLastStart = findLastPeriodStartFromLogs(loggedPeriodDays);
  const displayLastPeriodStart = detectedLastStart || lastPeriodStart;
  const currentCycleDay = displayLastPeriodStart ? (((Math.floor((todayDate.getTime() - new Date(displayLastPeriodStart).getTime()) / msPerDay) % avgCycleLength) + avgCycleLength) % avgCycleLength) + 1 : null;
  const nextPeriodIn = currentCycleDay ? (avgCycleLength - currentCycleDay + 1) : null;
  const tradesLogged = calendarData.reduce((s, d) => s + (d.trades || 0), 0);

  // Phase Intelligence derived values
  const phaseStats = useMemo(() => computePhaseStats(storedTrades), [storedTrades]);
  const currentPhaseKey: PhaseKey | null = currentCycleDay ? (() => {
    const follicularEnd = Math.min(periodLength + 7, avgCycleLength);
    const ovulationEnd  = Math.min(periodLength + 11, avgCycleLength);
    if (currentCycleDay <= periodLength) return "menstruation";
    if (currentCycleDay <= follicularEnd) return "follicular";
    if (currentCycleDay <= ovulationEnd)  return "ovulation";
    return "luteal";
  })() : null;

  const isSameDay = (a?: Date, b?: Date) => {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const selectedDayObj = selectedDay ? calendarData[selectedDay - 1] : null;

  // keep `todayDate` updated (checks every minute) so the calendar highlights the correct day across midnight
  useEffect(() => {
    const id = setInterval(() => setTodayDate(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // if the displayed month/year contains today, ensure selectedDay follows today
  useEffect(() => {
    if (displayedDate.getFullYear() === todayDate.getFullYear() && displayedDate.getMonth() === todayDate.getMonth()) {
      setSelectedDay(todayDate.getDate());
    }
  }, [displayedDate, todayDate]);

  const getPhaseColor = (phase: string) => {
    const colors = {
      menstruation: "bg-cycle-menstruation/10 border-cycle-menstruation/30",
      follicular: "bg-yellow-100/20 border-yellow-400/30",
      ovulation: "bg-green-100/20 border-green-400/30",
      luteal: "bg-cycle-luteal/10 border-cycle-luteal/30",
    };
    return colors[phase as keyof typeof colors];
  };

  const { subscription, loading: subLoading, hasFeature } = useSubscription();

  // Show blank while subscription loads (no flicker)
  if (subLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  // Use hasFeature from hook - checks subscription tier
  const hasPremium = hasFeature('cycle_tracking');

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <CycleTrackerTour />
      <div className="relative">
        {!hasPremium && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-xl mb-2">Premium Feature</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Upgrade to Premium to track your menstrual cycle and optimize your trading strategy based on hormonal phases.
                </p>
                <Button onClick={() => navigate(`/checkout?tier=premium&returnTo=${window.location.pathname}`)} size="lg" className="w-full">
                  Upgrade to Premium - €9.99/mo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <div className={`${hasPremium ? '' : 'blur-sm pointer-events-none'}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-7xl p-4 lg:p-8"
        >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">Cycle Tracker</h1>
            <p className="mt-1 text-muted-foreground">Sync your trading with your natural rhythm</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Open safety mode"
              onClick={() => setSettingsOpen(true)}
              className={`safety-mode-button rounded-xl p-2.5 shadow-soft hover:shadow ${safetyModeEnabled ? 'bg-destructive/10 text-destructive' : 'bg-card text-muted-foreground'}`}
            >
              <Shield className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Today's Recommendation - oben */}
        <div className="mb-8">
          <CyclePredictions mode="recommendation" />
        </div>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cycle Settings & Safety Mode</DialogTitle>
              <DialogDescription>Adjust your cycle parameters and Safety Mode preferences.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <section className="rounded-2xl bg-card p-4">
                <div className="grid gap-4 grid-cols-2">
                  {/* Left column: Average + Variation stacked */}
                  <div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Average Cycle Length</label>
                      <div className="mt-1.5 flex items-center gap-2">
                          <Input
                            type="number"
                            min={18}
                            max={45}
                            value={avgCycleLength}
                            onChange={(e) => { setAvgCycleLength(Number(e.target.value || 0)); setIsDirty(true); }}
                            className="w-28"
                          />
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mt-1.5">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-foreground">Period Length</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 text-xs">
                                <Info className="h-3 w-3" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <p className="text-sm">Typical duration of your period in days.</p>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={14}
                            value={periodLength}
                            onChange={(e) => { setPeriodLength(Number(e.target.value || 0)); setIsDirty(true); }}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">days</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column: Last Period Start + PMS under it */}
                  <div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Last Period Start</label>
                      <Input
                        type="date"
                        value={lastPeriodStart}
                        onChange={(e) => { setLastPeriodStart(e.target.value); setIsDirty(true); }}
                        className="mt-1.5"
                      />
                    </div>

                      <div className="mt-4">
                        <div className="mt-1.5">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-foreground">PMS Days (before period)</label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 text-xs">
                                    <Info className="h-3 w-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <p className="text-sm">PMS days will be used to auto-enable Safety Mode before your period to reduce risk during sensitive days.</p>
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={14}
                                value={pmsDays}
                                onChange={(e) => { setPmsDays(Number(e.target.value || 0)); setIsDirty(true); }}
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">days</span>
                            </div>
                          </div>
                    </div>
                  </div>
                </div>

                {/* Cycle variation centered under both columns */}
                <div className="mt-4 flex justify-center">
                  <div className="w-full max-w-md rounded-2xl bg-card p-4">
                    <div className="flex items-center gap-2 justify-center">
                      <label className="text-sm font-medium text-foreground">Cycle Variation</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 text-xs">
                            <Info className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <p className="text-sm">Cycle variation is the typical fluctuation in your cycle length from month to month. Use this to set expected variability.</p>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={14}
                        value={variationDays}
                        onChange={(e) => { setVariationDays(Number(e.target.value || 0)); setIsDirty(true); }}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </div>
                </div>

              </section>

              <section className="rounded-2xl bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto-enable during PMS</p>
                    <p className="text-sm text-muted-foreground">Automatically protect yourself during sensitive days</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto-enable late Luteal</p>
                    <p className="text-sm text-muted-foreground">Days 24-28 of your cycle</p>
                  </div>
                  <Switch />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">30-min cooldown after losses</p>
                    <p className="text-sm text-muted-foreground">Prevent revenge trading</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </section>

              {/* Safety Mode Toggle - Hidden for initial launch, uncomment to re-enable */}
              {/* <section>
                <SafetyModeToggle enabled={safetyModeEnabled} onToggle={setSafetyModeEnabled} suggested={true} />
              </section> */}
            </div>

            <div className="mt-4 flex justify-end">
              {isDirty ? (
                <Button onClick={() => { saveSettings(); setIsDirty(false); setSettingsOpen(false); }}>Save Edits</Button>
              ) : (
                <Button onClick={() => setSettingsOpen(false)}>Done</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Phase Legend */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cyclePhases.map((phase, index) => (
            <motion.div
              key={phase.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-xl ${phase.color} p-2.5`}>
                  <phase.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{phase.name}</h3>
                  <p className="text-xs text-muted-foreground">Days {phase.days}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{phase.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid max-w-md grid-cols-2">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="cycle">Cycle View</TabsTrigger>
            </TabsList>
          </div>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-0">
            <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-6 shadow-card lg:col-span-2 cycle-calendar"
          >
            <div className="mb-6 flex items-center justify-between">
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setDisplayedDate(new Date(calendarYear, calendarMonthIndex - 1, 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="font-serif text-xl font-semibold text-foreground">{currentMonthLabel}</h2>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setDisplayedDate(new Date(calendarYear, calendarMonthIndex + 1, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Week days header */}
            <div className="mb-4 grid grid-cols-7 gap-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for offset - calculate based on first day of month */}
              {(() => {
                const firstDayOfMonth = new Date(calendarYear, calendarMonthIndex, 1);
                // getDay() returns 0 (Sunday) to 6 (Saturday)
                // We want Monday = 0, so adjust: (getDay() + 6) % 7
                const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
                return [...Array(dayOfWeek)].map((_, i) => (
                  <div key={`empty-${i}`} />
                ));
              })()}
              
              {calendarData.filter(day => day !== null).map((day) => {
                const isTodayCell = isSameDay(day.date, todayDate);
                const dayIso = day.date.toISOString().slice(0,10);
                const isPeriodDay = periodDays.includes(dayIso);
                const isLoggedPeriod = loggedPeriodDays.includes(dayIso);
                
                // Days before tracking should be white/neutral
                const cellColor = day.isBeforeTracking
                  ? "bg-card border-muted"
                  : isLoggedPeriod 
                    ? "bg-cycle-menstruation/30 border-cycle-menstruation" 
                    : getPhaseColor(day.phase);
                
                return (
                  <motion.button
                    key={day.day}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedDay(day.day); navigate(`/day/${dayIso}`); }}
                    className={`relative aspect-square rounded-xl border-2 transition-all ${cellColor} ${isTodayCell ? 'ring-4 ring-primary/30' : ''}`}
                  >
                    <span className="text-sm font-medium text-foreground">{day.day}</span>
                    {isTodayCell && (
                      <span className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Today</span>
                    )}
                    {!day.isBeforeTracking && (pmsDays > 0 && day.cycleDay > avgCycleLength - pmsDays) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute top-1 left-1 flex items-center justify-center h-5 w-5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                            !
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">PMS warning — {pmsDays} days before period</div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {isLoggedPeriod && (
                      <div className="absolute bottom-1 left-1 rounded-md bg-cycle-menstruation/80 px-1 text-xs text-white font-medium">🩸</div>
                    )}
                    {day.trades > 0 && (
                      <div className="absolute top-1 right-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${day.pnl >= 0 ? 'bg-accent/70 text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
                              {day.pnl >= 0 ? `+$${day.pnl}` : `-$${Math.abs(day.pnl)}`}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">Trades: {day.trades}</div>
                            <div className="text-sm">Daily P&L: {day.pnl >= 0 ? `+$${day.pnl}` : `-$${Math.abs(day.pnl)}`}</div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Day Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {(() => {
              // Always show today's data in the right panel
              const todayDayOfMonth = todayDate.getDate();
              // Only use calendarData if we're viewing the current month
              const isCurrentMonth = displayedDate.getFullYear() === todayDate.getFullYear() && 
                                      displayedDate.getMonth() === todayDate.getMonth();
              const todayDayData = isCurrentMonth ? calendarData[todayDayOfMonth - 1] : null;
              
              return (
                <div className="rounded-2xl bg-card p-6 shadow-card">
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Today: {monthNames[todayDate.getMonth()]} {todayDayOfMonth}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {todayDayData?.phase.charAt(0).toUpperCase() + todayDayData?.phase.slice(1)} Phase
                    {todayDayData?.cycleDay && ` • Cycle Day ${todayDayData.cycleDay}`}
                  </p>

                  {todayDayData && (todayDayData.cycleDay > avgCycleLength - pmsDays) && (
                  <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-destructive text-sm font-semibold">!</span>
                      <div>
                        <div className="font-semibold text-destructive">PMS Warning</div>
                        <div className="text-sm text-muted-foreground">This day is within your PMS window — consider enabling Safety Mode or reducing risk.</div>
                      </div>
                    </div>
                  </div>
                )}

                  {/* Actions for today: mark as period start, toggle period day */}
                  {todayDayData && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => {
                        const iso = todayDayData.date.toISOString().slice(0,10);
                        setLastPeriodStart(iso);
                        if (!periodDays.includes(iso)) setPeriodDays([...periodDays, iso]);
                        saveSettings();
                        setIsDirty(false);
                      }}
                    >
                      Set as Period Start
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        const iso = todayDayData.date.toISOString().slice(0,10);
                        if (periodDays.includes(iso)) {
                          setPeriodDays(periodDays.filter(d => d !== iso));
                        } else {
                          setPeriodDays([...periodDays, iso]);
                        }
                        saveSettings();
                        setIsDirty(false);
                      }}
                    >
                      {periodDays.includes(todayDayData.date.toISOString().slice(0,10)) ? 'Unmark Period Day' : 'Mark Period Day'}
                    </Button>

                    {/* Clear Period Start removed — setting a different start will recompute period */}
                  </div>
                  )}

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mood</span>
                      <span className="font-medium text-foreground">{todayDayData?.mood || 0}/10</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div 
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(todayDayData?.mood || 0) * 10}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Energy</span>
                      <span className="font-medium text-foreground">{todayDayData?.energy || 0}/10</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div 
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${(todayDayData?.energy || 0) * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="mt-6 w-full"
                  onClick={() => navigate(`/day/${localDateStr(todayDate)}`)}
                >
                  <Plus className="h-4 w-4" />
                  Log Today's Data
                </Button>
              </div>
              );
            })()}

            {/* Quick Stats */}
            {(() => {
              const todayDayOfMonth = todayDate.getDate();
              const isCurrentMonth = displayedDate.getFullYear() === todayDate.getFullYear() && 
                                      displayedDate.getMonth() === todayDate.getMonth();
              const todayDayData = isCurrentMonth ? calendarData[todayDayOfMonth - 1] : null;
              const currentDay = todayDayData?.cycleDay || null;
              const nextPeriod = currentDay ? (avgCycleLength - currentDay + 1) : null;
              
              return (
                <div className="rounded-2xl bg-gradient-to-br from-secondary/50 to-accent/30 p-6">
                  <h3 className="font-semibold text-foreground">This Cycle</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Day</span>
                      <span className="font-semibold text-foreground">{currentDay ? `Day ${currentDay}` : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cycle Length</span>
                      <span className="font-semibold text-foreground">{avgCycleLength} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Next Period</span>
                      <span className="font-semibold text-foreground">{nextPeriod ? `In ${nextPeriod} days` : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Trades Logged</span>
                      <span className="font-semibold text-foreground">{tradesLogged} trades</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>

          {/* ── Current Phase Intelligence ── */}
          {currentPhaseKey && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-10 border-t border-border/40 pt-8"
            >
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  Current Phase Intelligence
                </h2>
              </div>
              <PhaseCard
                phaseKey={currentPhaseKey}
                stats={phaseStats.find((s) => s.phase === currentPhaseKey)}
                isCurrent={true}
                delay={0.2}
              />
            </motion.div>
          )}
          </TabsContent>

          {/* Cycle View Tab */}
          <TabsContent value="cycle" className="space-y-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cycle Circle Visualization */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-card p-6 shadow-card"
              >
                <h2 className="mb-6 font-serif text-xl font-semibold text-foreground">
                  Your Cycle
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </h2>
                <div className="flex items-center justify-center">
                  <div className="relative" style={{ width: '350px', height: '350px' }}>
                    <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                      {/* Helper function to get phase color for a specific day */}
                      {(() => {
                        // Parse lastPeriodStart as LOCAL date (same as cycleStartDate below)
                        // to avoid UTC offset causing the wrong dot to be highlighted
                        const [_csy2, _csm2, _csd2] = lastPeriodStart.split('-').map(Number);
                        const _refDate = new Date(_csy2, _csm2 - 1, _csd2);
                        const _msDay = 1000 * 60 * 60 * 24;
                        const _diff = Math.floor((todayDate.getTime() - _refDate.getTime()) / _msDay);
                        const currentDay = _diff >= 0
                          ? (_diff % avgCycleLength) + 1
                          : null;

                        const getPhaseColor = (day: number) => {
                          if (day <= periodLength) return 'hsl(0 70% 70%)'; // menstruation
                          if (day <= periodLength + 7) return 'hsl(45 80% 65%)'; // follicular
                          if (day <= periodLength + 11) return 'hsl(160 50% 60%)'; // ovulation
                          return 'hsl(270 50% 70%)'; // luteal
                        };

                        const radius = 70;
                        const centerX = 100;
                        const centerY = 100;
                        
                        // Calculate date for each cycle day – parse as LOCAL date (not UTC) to avoid timezone off-by-one
                        const [_csy, _csm, _csd] = lastPeriodStart.split('-').map(Number);
                        const cycleStartDate = new Date(_csy, _csm - 1, _csd);
                        
                        return Array.from({ length: avgCycleLength }, (_, i) => {
                          const day = i + 1;
                          const angle = (day / avgCycleLength) * 2 * Math.PI;
                          const x = centerX + radius * Math.cos(angle);
                          const y = centerY + radius * Math.sin(angle);
                          const isCurrentDay = day === currentDay;
                          const phaseColor = getPhaseColor(day);
                          
                          // Calculate the calendar date for this cycle day
                          const dateForDay = new Date(cycleStartDate);
                          dateForDay.setDate(cycleStartDate.getDate() + (day - 1));
                          const calendarDay = dateForDay.getDate();
                          
                          return (
                            <g key={day}>
                              {/* Day circle */}
                              <circle
                                cx={x}
                                cy={y}
                                r={isCurrentDay ? "10" : "7"}
                                fill={phaseColor}
                                opacity={isCurrentDay ? "1" : "0.8"}
                                className={isCurrentDay ? "drop-shadow-glow" : ""}
                              />
                              {/* Current day ring */}
                              {isCurrentDay && (
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="14"
                                  fill="none"
                                  stroke="#8b5cf6"
                                  strokeWidth="2"
                                  opacity="0.6"
                                />
                              )}
                              {/* Day number (calendar date) */}
                              <text
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[6px] font-bold fill-white"
                                transform={`rotate(90, ${x}, ${y})`}
                              >
                                {calendarDay}
                              </text>
                            </g>
                          );
                        });
                      })()}
                    </svg>
                    
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground">{currentCycleDay || "-"}</div>
                        <div className="text-sm text-muted-foreground">Day of Cycle</div>
                        {currentCycleDay && todayDate && (
                          <div className="mt-2">
                            <div className="text-xs font-medium text-primary capitalize">
                              {(() => {
                                const follicularEnd = Math.min(periodLength + 7, avgCycleLength);
                                const ovulationEnd = Math.min(periodLength + 11, avgCycleLength);
                                if (currentCycleDay <= periodLength) return "Menstruation";
                                if (currentCycleDay <= follicularEnd) return "Follicular";
                                if (currentCycleDay <= ovulationEnd) return "Ovulation";
                                return "Luteal";
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Phase legend */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--cycle-menstruation))' }} />
                    <span className="text-sm text-muted-foreground">Menstruation ({periodLength}d)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--cycle-follicular))' }} />
                    <span className="text-sm text-muted-foreground">Follicular (7d)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--cycle-ovulation))' }} />
                    <span className="text-sm text-muted-foreground">Ovulation (4d)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--cycle-luteal))' }} />
                    <span className="text-sm text-muted-foreground">Luteal ({avgCycleLength - periodLength - 11}d)</span>
                  </div>
                </div>
              </motion.div>

              {/* Today's Info (right side) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {(() => {
                  const todayDayOfMonth = todayDate.getDate();
                  const isCurrentMonth = displayedDate.getFullYear() === todayDate.getFullYear() && 
                                          displayedDate.getMonth() === todayDate.getMonth();
                  const todayDayData = isCurrentMonth ? calendarData[todayDayOfMonth - 1] : null;
                  
                  return (
                    <div className="rounded-2xl bg-card p-6 shadow-card">
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        Today: {monthNames[todayDate.getMonth()]} {todayDayOfMonth}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {todayDayData?.phase.charAt(0).toUpperCase() + todayDayData?.phase.slice(1)} Phase
                        {currentCycleDay && ` • Cycle Day ${currentCycleDay}`}
                      </p>

                      {todayDayData && (todayDayData.cycleDay > avgCycleLength - pmsDays) && (
                        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
                          <div className="flex items-start gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-sm font-semibold">!</span>
                            <div>
                              <div className="font-semibold text-destructive">PMS Warning</div>
                              <div className="text-sm text-muted-foreground">This day is within your PMS window — consider enabling Safety Mode or reducing risk.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Mood</span>
                            <span className="font-medium text-foreground">{todayDayData?.mood}/10</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-muted">
                            <div 
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${(todayDayData?.mood || 0) * 10}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Energy</span>
                            <span className="font-medium text-foreground">{todayDayData?.energy}/10</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-muted">
                            <div 
                              className="h-full rounded-full bg-accent transition-all"
                              style={{ width: `${(todayDayData?.energy || 0) * 10}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="mt-6 w-full"
                        onClick={() => navigate(`/day/${localDateStr(todayDate)}`)}
                      >
                        <Plus className="h-4 w-4" />
                        Log Today's Data
                      </Button>
                    </div>
                  );
                })()}

                {/* Quick Stats */}
                <div className="rounded-2xl bg-gradient-to-br from-secondary/50 to-accent/30 p-6">
                  <h3 className="font-semibold text-foreground">This Cycle</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Day</span>
                      <span className="font-semibold text-foreground">{currentCycleDay ? `Day ${currentCycleDay}` : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cycle Length</span>
                      <span className="font-semibold text-foreground">{avgCycleLength} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Next Period</span>
                      <span className="font-semibold text-foreground">{nextPeriodIn ? `In ${nextPeriodIn} days` : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Trades Logged</span>
                      <span className="font-semibold text-foreground">{tradesLogged} trades</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── All Phases Intelligence ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10 border-t border-border/40 pt-8"
            >
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  All Phases — tap to expand
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(["menstruation", "follicular", "ovulation", "luteal"] as PhaseKey[]).map(
                  (pk, i) => (
                    <PhaseCard
                      key={pk}
                      phaseKey={pk}
                      stats={phaseStats.find((s) => s.phase === pk)}
                      isCurrent={pk === currentPhaseKey}
                      delay={0.1 + i * 0.08}
                    />
                  )
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Smart Predictions - ganz unten */}
        <div className="mt-8">
          <CyclePredictions mode="predictions" />
        </div>
      </motion.div>
      </div>
      </div>
    </main>
  );
}