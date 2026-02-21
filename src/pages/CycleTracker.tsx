import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Shield, Plus, Lock } from "lucide-react";
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
import { loadCycleSettings, loadPeriodDates } from "@/lib/demoDataLoaders";

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

// Calendar data generator using settings
const generateCalendarData = (year: number, monthIndex: number, avgCycleLength: number, lastPeriodStartIso: string, periodLength: number, loggedPeriodDays: string[] = []): DayData[] => {
  const days: DayData[] = [];
  const msPerDay = 1000 * 60 * 60 * 24;

  // parse last period start
  const lastStart = lastPeriodStartIso ? new Date(lastPeriodStartIso) : null;

  // number of days in month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Helper: Find the most recent period start date that is on or before a given date
  // Logged periods have PRIORITY over lastPeriodStart prediction
  const findPeriodStartBeforeDate = (date: Date): Date | null => {
    // If no logged periods, fall back to the prediction (lastPeriodStart)
    if (loggedPeriodDays.length === 0) return lastStart;
    
    // Get all logged period dates
    const allLoggedDates = loggedPeriodDays
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime()); // Sort ascending
    
    // Find all period "groups" (consecutive days = one period)
    const periodGroups: Date[][] = [];
    let currentGroup: Date[] = [];
    
    for (let i = 0; i < allLoggedDates.length; i++) {
      if (currentGroup.length === 0) {
        currentGroup.push(allLoggedDates[i]);
      } else {
        const lastInGroup = currentGroup[currentGroup.length - 1].getTime();
        const current = allLoggedDates[i].getTime();
        const diff = current - lastInGroup;
        
        // If consecutive (within 1.5 days), add to current group
        if (diff <= msPerDay * 1.5) {
          currentGroup.push(allLoggedDates[i]);
        } else {
          // Gap found - start a new period group
          periodGroups.push([...currentGroup]);
          currentGroup = [allLoggedDates[i]];
        }
      }
    }
    // Don't forget the last group
    if (currentGroup.length > 0) {
      periodGroups.push(currentGroup);
    }
    
    // Find the most recent period group that started on or before the target date
    for (let i = periodGroups.length - 1; i >= 0; i--) {
      const periodStart = periodGroups[i][0]; // First day of this period
      if (periodStart <= date) {
        return periodStart;
      }
    }
    
    // If no logged period is before this date, fall back to prediction
    return lastStart;
  };

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, monthIndex, i);
    const dateStr = date.toISOString().split('T')[0];

    // Check if this date is a logged period day
    const isLoggedPeriodDay = loggedPeriodDays.includes(dateStr);

    // Find the period start that applies to this date
    const relevantPeriodStart = findPeriodStartBeforeDate(date) || lastStart;

    // Determine the earliest tracking start date
    let earliestTrackingDate: Date | null = null;
    
    // Use the earliest logged period day if available
    if (loggedPeriodDays.length > 0) {
      const sortedLoggedDays = [...loggedPeriodDays].sort();
      earliestTrackingDate = new Date(sortedLoggedDays[0]);
    } else if (lastStart) {
      // Otherwise use lastPeriodStart
      earliestTrackingDate = lastStart;
    }

    // Check if this date is before tracking started
    const isBeforeTracking = earliestTrackingDate && date.getTime() < earliestTrackingDate.getTime();

    // compute cycle day relative to relevant period start
    let cycleDay = 1;
    let phase: "menstruation" | "follicular" | "ovulation" | "luteal" = "menstruation";
    
    if (!isBeforeTracking && relevantPeriodStart) {
      const diff = Math.floor((date.getTime() - relevantPeriodStart.getTime()) / msPerDay);
      cycleDay = (diff % avgCycleLength) + 1;
      
      // Handle negative cycle days (shouldn't happen but just in case)
      if (cycleDay < 1) cycleDay = 1;

      // Determine actual period length for THIS specific logged period
      let actualPeriodLength = periodLength; // Default to settings
      const periodStartStr = relevantPeriodStart.toISOString().split('T')[0];
      
      // Find all consecutive logged period days starting from this period start
      const periodDaysForThisCycle = loggedPeriodDays.filter(d => {
        const loggedDate = new Date(d);
        const daysSinceStart = Math.floor((loggedDate.getTime() - relevantPeriodStart.getTime()) / msPerDay);
        return daysSinceStart >= 0 && daysSinceStart < 15; // Look within first 15 days
      }).sort();
      
      if (periodDaysForThisCycle.length > 0) {
        // Find consecutive days from the start
        let consecutiveCount = 0;
        for (const pd of periodDaysForThisCycle) {
          const dayNum = Math.floor((new Date(pd).getTime() - relevantPeriodStart.getTime()) / msPerDay);
          if (dayNum === consecutiveCount) {
            consecutiveCount++;
          } else {
            break;
          }
        }
        if (consecutiveCount > 0) {
          actualPeriodLength = consecutiveCount;
        }
      }

      const follicularEnd = Math.min(actualPeriodLength + 7, avgCycleLength);
      const ovulationEnd = Math.min(actualPeriodLength + 11, avgCycleLength);
      
      // If this day is logged as period, it's definitely menstruation
      // Otherwise use cycle day calculation
      phase = isLoggedPeriodDay 
        ? "menstruation" 
        : cycleDay <= actualPeriodLength 
          ? "menstruation" 
          : cycleDay <= follicularEnd 
            ? "follicular" 
            : cycleDay <= ovulationEnd 
              ? "ovulation" 
              : "luteal";
    }

    // Load real trades from journal instead of demo data
    const dateIso = date.toISOString().slice(0, 10);
    let trades = 0;
    let pnl = 0;
    
    try {
      const journalData = localStorage.getItem(`cw_journal_${dateIso}`);
      if (journalData) {
        const journal = JSON.parse(journalData);
        if (journal.trades && Array.isArray(journal.trades)) {
          trades = journal.trades.length;
          pnl = journal.trades.reduce((sum: number, trade: any) => {
            return sum + (typeof trade.pnl === 'number' ? trade.pnl : 0);
          }, 0);
        }
      }
    } catch {
      // ignore parse errors
    }

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
      
      // Auto-update lastPeriodStart based on logged period days
      const detectedStart = findLastPeriodStartFromLogs(logged);
      if (detectedStart) {
        setLastPeriodStart(detectedStart);
        localStorage.setItem('cw_lastPeriodStart', detectedStart);
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
      
      // Auto-update lastPeriodStart
      const detectedStart = findLastPeriodStartFromLogs(logged);
      if (detectedStart) {
        setLastPeriodStart(detectedStart);
        localStorage.setItem('cw_lastPeriodStart', detectedStart);
      }
    };

    // Reload when window gets focus (user comes back from Day page)
    window.addEventListener('focus', reloadLoggedPeriods);
    return () => window.removeEventListener('focus', reloadLoggedPeriods);
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
  const currentCycleDay = lastPeriodStart ? (((Math.floor((todayDate.getTime() - new Date(lastPeriodStart).getTime()) / msPerDay) % avgCycleLength) + avgCycleLength) % avgCycleLength) + 1 : null;
  const nextPeriodIn = currentCycleDay ? (avgCycleLength - currentCycleDay + 1) : null;
  const tradesLogged = calendarData.reduce((s, d) => s + (d.trades || 0), 0);

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

  const { subscription, loading: subLoading } = useSubscription();

  // Show blank while subscription loads (no flicker)
  if (subLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  const hasPremium = subscription.tier === 'premium' || subscription.tier === 'pro';

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
                  onClick={() => navigate(`/day/${todayDate.toISOString().slice(0, 10)}`)}
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
                        // Get today's cycle day from calendar data
                        const todayDayOfMonth = todayDate.getDate();
                        const isCurrentMonth = displayedDate.getFullYear() === todayDate.getFullYear() && 
                                                displayedDate.getMonth() === todayDate.getMonth();
                        const todayDayData = isCurrentMonth ? calendarData[todayDayOfMonth - 1] : null;
                        const currentDay = todayDayData?.cycleDay || null;
                        
                        const getPhaseColor = (day: number) => {
                          if (day <= periodLength) return 'hsl(0 70% 70%)'; // menstruation
                          if (day <= periodLength + 7) return 'hsl(45 80% 65%)'; // follicular
                          if (day <= periodLength + 11) return 'hsl(160 50% 60%)'; // ovulation
                          return 'hsl(270 50% 70%)'; // luteal
                        };

                        const radius = 70;
                        const centerX = 100;
                        const centerY = 100;
                        
                        // Calculate date for each cycle day
                        const cycleStartDate = new Date(lastPeriodStart);
                        
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
                        onClick={() => navigate(`/day/${todayDate.toISOString().slice(0, 10)}`)}
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