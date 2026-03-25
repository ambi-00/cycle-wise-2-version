import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
const RecentTradesTable = lazy(() => import("@/components/RecentTradesTable").then((m) => ({ default: m.RecentTradesTable })));
import { CyclePhaseIndicator } from "@/components/CyclePhaseIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Droplets, Brain, Heart, Frown, Smile, Meh, Zap, Moon, Activity, HeartPulse, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { loadCycleSettings, loadPeriodDates } from "@/lib/demoDataLoaders";
import { localDateStr } from "@/lib/utils";

export default function Day() {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();

  // Support both numeric day (e.g., '24') and ISO date (YYYY-MM-DD)
  // IMPORTANT: new Date('YYYY-MM-DD') parses as UTC midnight which shifts the date
  // for UTC+ users. We parse manually to get local midnight.
  const parseDate = (d?: string) => {
    if (!d) return new Date(2025, 0, 1);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split('-').map(Number);
      return new Date(y, m - 1, day); // local midnight
    }
    const n = Number(d);
    return new Date(2025, 0, isNaN(n) ? 1 : n);
  };

  const dateObj = parseDate(day);
  const dayNum = dateObj.getDate();

  // Navigation functions
  const goToPreviousDay = () => {
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);
    navigate(`/day/${localDateStr(prevDate)}`);
  };

  const goToNextDay = () => {
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);
    navigate(`/day/${localDateStr(nextDate)}`);
  };



  // Load settings for accurate phase calculation
  const [avgCycleLength, setAvgCycleLength] = useState<number>(28);
  const [periodLength, setPeriodLength] = useState<number>(5);
  const [isPeriodLogged, setIsPeriodLogged] = useState<boolean>(false); // Is this day's period logged?


  // Calculate phase for this day (same logic as CycleTracker)
  type CyclePhase = "menstruation" | "follicular" | "ovulation" | "luteal";
  const msPerDay = 1000 * 60 * 60 * 24;
  let phase: CyclePhase = "menstruation";


  const isoDate = localDateStr(dateObj);

  const [lastPeriodStart, setLastPeriodStart] = useState<string | null>(null);

  // Phase-Berechnung nach Deklaration
  if (lastPeriodStart) {
    const diff = Math.floor((dateObj.getTime() - new Date(lastPeriodStart).getTime()) / msPerDay);
    const cycleDay = (((diff % avgCycleLength) + avgCycleLength) % avgCycleLength) + 1;
    const follicularEnd = Math.min(periodLength + 7, avgCycleLength);
    const ovulationEnd = Math.min(periodLength + 11, avgCycleLength);
    if (cycleDay <= periodLength) phase = "menstruation";
    else if (cycleDay <= follicularEnd) phase = "follicular";
    else if (cycleDay <= ovulationEnd) phase = "ovulation";
    else phase = "luteal";
  }
  const [periodDays, setPeriodDays] = useState<string[]>([]);
  const location = useLocation();

  type TradeEntry = {
    id: string;
    instrument: string;
    symbol?: string;
    direction: "long" | "short";
    rMultiple?: number | null;
    r_multiple?: number | null;
    pnl?: number | null;
    strategy?: string;
    // optional fields to align with RecentTradesTable.Trade shape
    date?: string;
    result?: "win" | "loss" | "breakeven";
    cyclePhase?: string;
  };

  type Journal = {
    quickNote: string;
    trades: TradeEntry[];
    mood: number;
    confidence: number;
    lessons: string;
    attachments?: string[];
    // Perioden-Tracking
    hasPeriod: boolean;
    flowIntensity: number; // 0 = none, 1 = light, 2 = medium, 3 = heavy
    // Trading-relevant factors
    energy: number;
    focus: number;
    stress: number;
    sleepQuality: number;
    cramps: number; // can be distracting while trading
  };

  const defaultJournal = (): Journal => ({ 
    quickNote: "", 
    trades: [], 
    mood: 5, 
    confidence: 5, 
    lessons: "", 
    attachments: [],
    hasPeriod: false,
    flowIntensity: 0,
    energy: 5,
    focus: 5,
    stress: 5,
    sleepQuality: 5,
    cramps: 0,
  });
  const [journal, setJournal] = useState<Journal>(defaultJournal());

  // Map stored journal trades to the shape RecentTradesTable expects
  type RecentTrade = {
    id: string;
    date: string;
    instrument: string;
    direction: "long" | "short";
    result: "win" | "loss" | "breakeven";
    rMultiple: number;
    strategy: string;
    cyclePhase: string;
    // optional iso flag used by RecentTradesTable rendering
    iso?: boolean;
  };

  const mappedTrades: RecentTrade[] = (journal.trades || []).map((t) => ({
    id: t.id,
    date: t.date || isoDate,
    instrument: t.symbol || t.instrument || 'Unknown',
    direction: t.direction,
    result: (t as any).result || 'breakeven',
    // Handle both r_multiple (snake_case) and rMultiple (camelCase)
    rMultiple: (() => {
      const rValue = (t as any).r_multiple !== undefined ? (t as any).r_multiple : t.rMultiple;
      return typeof rValue === 'number' && rValue !== null ? rValue : 0;
    })(),
    strategy: t.strategy || '',
    cyclePhase: (t as any).cyclePhase || phase,
    iso: !!t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date || ''),
  }));


  useEffect(() => {
    try {
      const cycleSettings = loadCycleSettings();
      setLastPeriodStart(cycleSettings.lastPeriodStart);
      setAvgCycleLength(cycleSettings.avgCycleLength);
      setPeriodLength(cycleSettings.periodLength);
      
      const pd = localStorage.getItem('cw_periodDays');
      if (pd) setPeriodDays(JSON.parse(pd));
      
      // Check if this day has a logged period
      const periodDates = loadPeriodDates();
      setIsPeriodLogged(periodDates.includes(isoDate));
    } catch (e) {
      // ignore
    }
  }, [isoDate]);

  // load journal for this isoDate
  useEffect(() => {
    const loadJournal = () => {
      try {
        const raw = localStorage.getItem(`cw_journal_${isoDate}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setJournal({ ...defaultJournal(), ...parsed });
        } else {
          setJournal(defaultJournal());
        }
      } catch (e) {
        setJournal(defaultJournal());
      }
    };
    loadJournal();
    // Reload when a trade is saved (e.g. user returns from NewTrade)
    window.addEventListener('trades-updated', loadJournal);
    window.addEventListener('storage', loadJournal);
    return () => {
      window.removeEventListener('trades-updated', loadJournal);
      window.removeEventListener('storage', loadJournal);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoDate]);

  // If the app links here with `?journal=1` we could auto-scroll to the journal section.

  const saveJournal = (next?: Partial<Journal>) => {
    const newJ = { ...journal, ...next };
    setJournal(newJ);
    try {
      localStorage.setItem(`cw_journal_${isoDate}`, JSON.stringify(newJ));
    } catch (e) {
      // ignore
    }
  };

  const save = () => {
    try {
      if (lastPeriodStart) localStorage.setItem('cw_lastPeriodStart', lastPeriodStart);
      localStorage.setItem('cw_periodDays', JSON.stringify(periodDays || []));
    } catch (e) {
      // ignore
    }
  };

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayLabel = `${monthNames[dateObj.getMonth()]} ${dayNum}, ${dateObj.getFullYear()}`;

  const phaseTip = {
    menstruation: "Consider smaller position sizes today 🔴",
    follicular: "Great time to try new strategies! 🌱",
    ovulation: "Your peak performance window – go for it 🚀",
    luteal: "Stay disciplined, stick to your plan 🎯",
  }[phase];

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousDay}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextDay}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">{dayLabel}</h1>
            <p className="mt-1 text-muted-foreground">Trades and notes — phase: {phase}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/cycle" className="text-sm text-primary underline">Back to Cycle Tracker</Link>
            <Link to={`/journal?date=${isoDate}`} className="text-sm text-primary underline">Open in Journal</Link>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Trades section */}
            {journal.trades && journal.trades.length > 0 ? (
              <div className="space-y-4">
                <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card" />}>
                  <RecentTradesTable trades={mappedTrades} />
                </Suspense>
                <Link to={`/trade/new?date=${isoDate}`} className="block">
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add New Trade
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed border-border">
                <div className="flex flex-col items-center gap-5">
                  <div className="rounded-full bg-primary/10 p-5">
                    <TrendingUp className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">No trades yet today</h3>
                    <p className="text-muted-foreground mt-1.5">Ready to capture your performance?</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 px-5 py-3 text-sm text-muted-foreground max-w-sm">
                    <span className="font-medium text-foreground">Phase tip: </span>{phaseTip}
                  </div>
                  <Link to={`/trade/new?date=${isoDate}`}>
                    <Button size="lg">
                      <Plus className="mr-2 h-5 w-5" /> Log your first trade
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* ── Mindset 2×3 Grid ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cycle-ovulation/20 p-2.5">
                  <Brain className="h-5 w-5 text-cycle-ovulation" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Trading-Mindset</h3>
                  <p className="text-sm text-muted-foreground">Faktoren die dein Trading beeinflussen</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">

                {/* Sleep */}
                <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 dark:border-indigo-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <Label className="text-sm font-semibold">Sleep Quality</Label>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{journal.sleepQuality}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${journal.sleepQuality * 10}%` }} />
                  </div>
                  <input type="range" min={0} max={10} value={journal.sleepQuality}
                    onChange={(e) => saveJournal({ sleepQuality: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, rgb(99,102,241) 0%, rgb(99,102,241) ${journal.sleepQuality * 10}%, rgb(219,222,252) ${journal.sleepQuality * 10}%, rgb(219,222,252) 100%)` }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>😴 Poor</span><span>😴😴😴 Great</span>
                  </div>
                </div>

                {/* Energy */}
                <div className="rounded-xl p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-200/30 dark:border-yellow-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                        <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <Label className="text-sm font-semibold">Energy Level</Label>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{journal.energy}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/50 overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${journal.energy * 10}%` }} />
                  </div>
                  <input type="range" min={0} max={10} value={journal.energy}
                    onChange={(e) => saveJournal({ energy: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, rgb(217,119,6) 0%, rgb(217,119,6) ${journal.energy * 10}%, rgb(254,243,199) ${journal.energy * 10}%, rgb(254,243,199) 100%)` }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>🪫 Drained</span><span>⚡ Energized</span>
                  </div>
                </div>

                {/* Focus */}
                <div className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/30 dark:border-blue-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Label className="text-sm font-semibold">Focus/Clarity</Label>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{journal.focus}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${journal.focus * 10}%` }} />
                  </div>
                  <input type="range" min={0} max={10} value={journal.focus}
                    onChange={(e) => saveJournal({ focus: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, rgb(6,182,212) 0%, rgb(6,182,212) ${journal.focus * 10}%, rgb(207,250,254) ${journal.focus * 10}%, rgb(207,250,254) 100%)` }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>🌫️ Foggy</span><span>🎯 Sharp</span>
                  </div>
                </div>

                {/* Stress */}
                <div className="rounded-xl p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-200/30 dark:border-red-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <HeartPulse className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <Label className="text-sm font-semibold">Stress Level</Label>
                    </div>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">{journal.stress}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-red-100 dark:bg-red-900/50 overflow-hidden">
                    <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${journal.stress * 10}%` }} />
                  </div>
                  <input type="range" min={0} max={10} value={journal.stress}
                    onChange={(e) => saveJournal({ stress: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, rgb(220,38,38) 0%, rgb(220,38,38) ${journal.stress * 10}%, rgb(254,226,226) ${journal.stress * 10}%, rgb(254,226,226) 100%)` }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>😌 Calm</span><span>😰 Anxious</span>
                  </div>
                </div>

                {/* Mood */}
                <div className="rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-200/30 dark:border-green-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <Label className="text-sm font-semibold">Mood</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{journal.mood <= 2 ? '😢' : journal.mood <= 4 ? '😞' : journal.mood <= 6 ? '😐' : journal.mood <= 8 ? '🙂' : '😄'}</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">{journal.mood}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-green-100 dark:bg-green-900/50 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${journal.mood * 10}%` }} />
                  </div>
                  <input type="range" min={0} max={10} value={journal.mood}
                    onChange={(e) => saveJournal({ mood: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, rgb(34,197,94) 0%, rgb(34,197,94) ${journal.mood * 10}%, rgb(220,252,231) ${journal.mood * 10}%, rgb(220,252,231) 100%)` }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>😭 Sad</span><span>😄 Happy</span>
                  </div>
                </div>

                {/* Confidence */}
                <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/30 dark:border-emerald-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Smile className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <Label className="text-sm font-semibold">Selbstvertrauen</Label>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{journal.confidence}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${journal.confidence * 10}%` }} />
                  </div>
                  <input type="range" min={0} max={10} value={journal.confidence}
                    onChange={(e) => saveJournal({ confidence: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>😟 Low</span><span>💪 High</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="w-full lg:w-[340px] flex-shrink-0 space-y-6">

            <CyclePhaseIndicator
              phase={phase}
              day={dayNum}
              cycleLength={avgCycleLength}
              isPeriodLogged={isPeriodLogged}
              recommendation={
                phase === "menstruation"
                  ? (journal.hasPeriod
                      ? ""
                      : "You should have your period today. If your period started, please log it!")
                  : (phase === "luteal" ? "Consider enabling Safety Mode on this day." : "")
              }
            />

            {/* Perioden-Tracking Card */}
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cycle-menstruation/20">
                  <Droplets className="h-5 w-5 text-cycle-menstruation" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Perioden-Tracking</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="period-toggle" className="text-sm font-medium">Are you on your period today?</Label>
                  <Switch
                    id="period-toggle"
                    checked={journal.hasPeriod}
                    onCheckedChange={(checked) => {
                      saveJournal({ hasPeriod: checked, flowIntensity: checked ? (journal.flowIntensity || 1) : 0 });
                      if (checked && !periodDays.includes(isoDate)) {
                        const newPeriodDays = [...periodDays, isoDate];
                        setPeriodDays(newPeriodDays);
                        localStorage.setItem('cw_periodDays', JSON.stringify(newPeriodDays));
                      } else if (!checked && periodDays.includes(isoDate)) {
                        const newPeriodDays = periodDays.filter(d => d !== isoDate);
                        setPeriodDays(newPeriodDays);
                        localStorage.setItem('cw_periodDays', JSON.stringify(newPeriodDays));
                      }
                    }}
                  />
                </div>

                {journal.hasPeriod && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Flow Strength</Label>
                      <div className="flex gap-2">
                        {[
                          { value: 1, label: "Light", color: "bg-red-200" },
                          { value: 2, label: "Medium", color: "bg-red-400" },
                          { value: 3, label: "Heavy", color: "bg-red-600" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => saveJournal({ flowIntensity: opt.value })}
                            className={`flex-1 rounded-lg p-3 text-sm font-medium transition-all ${
                              journal.flowIntensity === opt.value
                                ? `${opt.color} text-white shadow-md`
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>🔥</span>
                          <Label className="text-sm font-medium">Cramps</Label>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {journal.cramps === 0 ? "None" : journal.cramps <= 3 ? "Light" : journal.cramps <= 6 ? "Medium" : "Strong"}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={10} 
                        value={journal.cramps} 
                        onChange={(e) => saveJournal({ cramps: Number(e.target.value) })} 
                        className="w-full accent-cycle-menstruation" 
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notizen Card */}
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">📝 Trading-Notizen</h3>
                <div className="text-xs text-muted-foreground">Auto-saves</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Daily Note</label>
                  <Textarea 
                    value={journal.quickNote} 
                    onChange={(e) => saveJournal({ quickNote: e.target.value })} 
                    placeholder="How did you feel while trading today?"
                    className="mt-2 min-h-[80px]" 
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Lektionen</label>
                  <Textarea 
                    value={journal.lessons} 
                    onChange={(e) => saveJournal({ lessons: e.target.value })} 
                    placeholder="Was hast du heute gelernt?"
                    className="mt-2 min-h-[80px]" 
                  />
                </div>
              </div>
            </div>
          </div>

        </div>{/* end two-column */}
      </motion.div>
    </main>
  );
}

// TradeAdder removed — journal no longer collects trades inline
