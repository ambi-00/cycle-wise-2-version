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
import { Plus, Droplets, Heart, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
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

  type CheckIn = {
    date: string;
    nutrition: 'poor' | 'fair' | 'good' | 'excellent';
    mood: number;
    concentration: number;
    sleep: number;
    stress: number;
    hasExercised: boolean;
    recommendations: string[];
    riskAdjustment: 'reduce' | 'maintain' | 'increase' | null;
    riskReduction: number;
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
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);

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
      try {
        const ciRaw = localStorage.getItem(`cw_daily_checkin_${isoDate}`);
        setCheckIn(ciRaw ? JSON.parse(ciRaw) : null);
      } catch {
        setCheckIn(null);
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

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="w-full lg:w-[340px] flex-shrink-0 space-y-6">

            {/* Morning Check-In Summary */}
            {checkIn ? (
              <div className="rounded-2xl bg-card p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Morning Check-In</h3>
                      <p className="text-xs text-muted-foreground">Logged today</p>
                    </div>
                  </div>
                  {checkIn.riskAdjustment && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      checkIn.riskAdjustment === 'reduce'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        : checkIn.riskAdjustment === 'increase'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {checkIn.riskAdjustment === 'reduce' ? `↓ Risk −${checkIn.riskReduction}%` : checkIn.riskAdjustment === 'increase' ? '↑ Risk +' : '✓ Normal risk'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                  {[
                    { label: 'Mood', value: checkIn.mood, color: 'rgb(110,231,183)' },
                    { label: 'Sleep', value: checkIn.sleep, color: 'rgb(167,154,210)' },
                    { label: 'Focus', value: checkIn.concentration, color: 'rgb(125,211,252)' },
                    { label: 'Stress', value: checkIn.stress, color: 'rgb(249,168,212)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">{value}/10</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${value * 10}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm pt-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>🥗 Nutrition:</span>
                    <span className="font-medium text-foreground capitalize">{checkIn.nutrition}</span>
                  </div>
                  {checkIn.hasExercised && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">🏃 Exercised</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-muted p-2.5">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Morning Check-In</p>
                    <p className="text-xs text-muted-foreground">No check-in logged for this day</p>
                  </div>
                </div>
              </div>
            )}

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
                      // Notify CycleTracker to reload (same-tab SPA navigation)
                      window.dispatchEvent(new CustomEvent('period-updated'));
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
