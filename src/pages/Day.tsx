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
import { Plus, Droplets, Brain, Heart, Frown, Smile, Meh, Zap, Moon, Activity, HeartPulse, ChevronLeft, ChevronRight } from "lucide-react";
import { loadCycleSettings } from "@/lib/demoDataLoaders";

export default function Day() {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();

  // Support both numeric day (e.g., '24') and ISO date (YYYY-MM-DD)
  const parseDate = (d?: string) => {
    if (!d) return new Date(2025, 0, 1);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d);
    const n = Number(d);
    return new Date(2025, 0, isNaN(n) ? 1 : n);
  };

  const dateObj = parseDate(day);
  const dayNum = dateObj.getDate();

  // Navigation functions
  const goToPreviousDay = () => {
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevIso = prevDate.toISOString().slice(0, 10);
    navigate(`/day/${prevIso}`);
  };

  const goToNextDay = () => {
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextIso = nextDate.toISOString().slice(0, 10);
    navigate(`/day/${nextIso}`);
  };



  // Load settings for accurate phase calculation
  const [avgCycleLength, setAvgCycleLength] = useState<number>(28);
  const [periodLength, setPeriodLength] = useState<number>(5);


  // Calculate phase for this day (same logic as CycleTracker)
  type CyclePhase = "menstruation" | "follicular" | "ovulation" | "luteal";
  const msPerDay = 1000 * 60 * 60 * 24;
  let phase: CyclePhase = "menstruation";


  const isoDate = dateObj.toISOString().slice(0, 10);

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
    direction: "long" | "short";
    rMultiple?: number | null;
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
    instrument: t.instrument || 'Unknown',
    direction: t.direction,
    result: (t as any).result || 'breakeven',
    rMultiple: typeof t.rMultiple === 'number' && t.rMultiple !== null ? t.rMultiple : 0,
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
    } catch (e) {
      // ignore
    }
  }, []);

  // load journal for this isoDate
  useEffect(() => {
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

  const dayLabel = `January ${dayNum}`;

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
            <Link to={`/journal?date=2025-01-${String(dayNum).padStart(2, "0")}`} className="text-sm text-primary underline">Open in Journal</Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
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
              <div className="rounded-2xl bg-card p-6 text-center">
                <p className="text-muted-foreground">No trades logged for this day.</p>
                <div className="mt-4">
                  <Link to={`/trade/new?date=${isoDate}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add New Trade
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">

            <CyclePhaseIndicator
              phase={phase}
              day={dayNum}
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

            {/* Trading-Mindset Card */}
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cycle-ovulation/20">
                  <Brain className="h-5 w-5 text-cycle-ovulation" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Trading-Mindset</h3>
                  <p className="text-sm text-muted-foreground">Faktoren die dein Trading beeinflussen</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Sleep Quality - Enhanced Visual */}
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 dark:border-indigo-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Sleep Quality</Label>
                        <p className="text-xs text-muted-foreground">How well did you sleep?</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{journal.sleepQuality}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="range" 
                      min={0} 
                      max={10} 
                      value={journal.sleepQuality} 
                      onChange={(e) => saveJournal({ sleepQuality: Number(e.target.value) })} 
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer" 
                      style={{
                        background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${journal.sleepQuality * 10}%, rgb(219, 222, 252) ${journal.sleepQuality * 10}%, rgb(219, 222, 252) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>😴 Poor</span>
                      <span>😴😴😴 Great</span>
                    </div>
                  </div>
                </div>

                {/* Energie - Enhanced Visual */}
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-200/30 dark:border-yellow-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                        <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Energy Level</Label>
                        <p className="text-xs text-muted-foreground">How energized do you feel?</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{journal.energy}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="range" 
                      min={0} 
                      max={10} 
                      value={journal.energy} 
                      onChange={(e) => saveJournal({ energy: Number(e.target.value) })} 
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer" 
                      style={{
                        background: `linear-gradient(to right, rgb(217, 119, 6) 0%, rgb(217, 119, 6) ${journal.energy * 10}%, rgb(254, 243, 199) ${journal.energy * 10}%, rgb(254, 243, 199) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>🪫 Drained</span>
                      <span>⚡ Energized</span>
                    </div>
                  </div>
                </div>

                {/* Fokus - Enhanced Visual */}
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/30 dark:border-blue-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Focus/Clarity</Label>
                        <p className="text-xs text-muted-foreground">Mental clarity and concentration</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{journal.focus}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="range" 
                      min={0} 
                      max={10} 
                      value={journal.focus} 
                      onChange={(e) => saveJournal({ focus: Number(e.target.value) })} 
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer" 
                      style={{
                        background: `linear-gradient(to right, rgb(6, 182, 212) 0%, rgb(6, 182, 212) ${journal.focus * 10}%, rgb(207, 250, 254) ${journal.focus * 10}%, rgb(207, 250, 254) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>🌫️ Foggy</span>
                      <span>🎯 Sharp</span>
                    </div>
                  </div>
                </div>

                {/* Stress - Enhanced Visual */}
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-200/30 dark:border-red-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <HeartPulse className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Stress Level</Label>
                        <p className="text-xs text-muted-foreground">How stressed do you feel?</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400">{journal.stress}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="range" 
                      min={0} 
                      max={10} 
                      value={journal.stress} 
                      onChange={(e) => saveJournal({ stress: Number(e.target.value) })} 
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer" 
                      style={{
                        background: `linear-gradient(to right, rgb(220, 38, 38) 0%, rgb(220, 38, 38) ${journal.stress * 10}%, rgb(254, 226, 226) ${journal.stress * 10}%, rgb(254, 226, 226) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>😌 Calm</span>
                      <span>😰 Anxious</span>
                    </div>
                  </div>
                </div>

                {/* Stimmung - Enhanced Visual */}
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-200/30 dark:border-green-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Mood</Label>
                        <p className="text-xs text-muted-foreground">How is your emotional state?</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl">
                        {journal.mood <= 2 ? '😢' : journal.mood <= 4 ? '😞' : journal.mood <= 6 ? '😐' : journal.mood <= 8 ? '🙂' : '😄'}
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{journal.mood}</span>
                        <span className="text-xs text-muted-foreground">/10</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="range" 
                      min={0} 
                      max={10} 
                      value={journal.mood} 
                      onChange={(e) => saveJournal({ mood: Number(e.target.value) })} 
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer" 
                      style={{
                        background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${journal.mood * 10}%, rgb(220, 252, 231) ${journal.mood * 10}%, rgb(220, 252, 231) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>😭 Sad</span>
                      <span>😄 Happy</span>
                    </div>
                  </div>
                </div>

                {/* Selbstvertrauen */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smile className="h-4 w-4 text-emerald-500" />
                      <Label className="text-sm font-medium">Selbstvertrauen</Label>
                    </div>
                    <span className="text-sm font-medium">{journal.confidence}/10</span>
                  </div>
                  <input type="range" min={0} max={10} value={journal.confidence} onChange={(e) => saveJournal({ confidence: Number(e.target.value) })} className="w-full accent-emerald-500" />
                </div>
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
        </div>
      </motion.div>
    </main>
  );
}

// TradeAdder removed — journal no longer collects trades inline
