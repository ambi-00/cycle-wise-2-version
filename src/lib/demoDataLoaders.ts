// Centralized demo data loaders for DEMO mode
// These functions check if app is in DEMO mode and return appropriate data

import { generateDemoCycleData, generateDemoHealthCheckIns, type DemoCycleSettings, type DemoHealthCheckIn } from "@/data/demo-data";
import { localDateStr } from "@/lib/utils";

/**
 * Check if app is in DEMO mode
 */
export function isInDemoMode(): boolean {
  const mode = localStorage.getItem('cw_app_mode');
  return mode === 'DEMO';
}

// ============ CYCLE DATA LOADERS ============

/**
 * Load cycle settings - returns demo data in DEMO mode, otherwise localStorage
 */
export function loadCycleSettings(): {
  avgCycleLength: number;
  periodLength: number;
  lastPeriodStart: string | null;
} {
  if (isInDemoMode()) {
    const demoData = generateDemoCycleData();
    return {
      avgCycleLength: demoData.avgCycleLength,
      periodLength: demoData.periodLength,
      lastPeriodStart: demoData.lastPeriodStart,
    };
  }
  
  // Normal USER mode - load from localStorage
  const avgCycleLength = Number(localStorage.getItem('cw_avgCycleLength')) || 28;
  const periodLength = Number(localStorage.getItem('cw_periodLength')) || 5;
  const lastPeriodStart = localStorage.getItem('cw_lastPeriodStart');
  
  return { avgCycleLength, periodLength, lastPeriodStart };
}

/**
 * Load period dates (for calendar marking) - returns demo data in DEMO mode
 */
export function loadPeriodDates(): string[] {
  if (isInDemoMode()) {
    const demoData = generateDemoCycleData();
    return demoData.periodDates;
  }
  
  // Normal USER mode - scan localStorage for cw_journal_ entries with hasPeriod
  const periodDates: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('cw_journal_')) {
      try {
        const journal = JSON.parse(localStorage.getItem(key) || '{}');
        if (journal.hasPeriod) {
          const dateStr = key.replace('cw_journal_', '');
          periodDates.push(dateStr);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  return periodDates.sort();
}

/**
 * Calculate personalized cycle statistics from logged period data
 * Returns average cycle length, period length, and prediction for next period
 */
export function calculatePersonalizedCycleStats(): {
  avgCycleLength: number;
  avgPeriodLength: number;
  totalCycles: number;
  nextPeriodPrediction: string | null;
  daysUntilNextPeriod: number | null;
  confidence: 'low' | 'medium' | 'high';
} | null {
  const periodDates = loadPeriodDates();
  
  if (periodDates.length === 0) {
    return null;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  
  // Group consecutive days into periods
  const periods: Date[][] = [];
  let currentPeriod: Date[] = [];
  
  const sortedDates = periodDates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (currentPeriod.length === 0) {
      currentPeriod.push(sortedDates[i]);
    } else {
      const lastDate = currentPeriod[currentPeriod.length - 1];
      const daysDiff = (sortedDates[i].getTime() - lastDate.getTime()) / msPerDay;
      
      if (daysDiff <= 1.5) {
        // Consecutive day - same period
        currentPeriod.push(sortedDates[i]);
      } else {
        // Gap - new period
        periods.push([...currentPeriod]);
        currentPeriod = [sortedDates[i]];
      }
    }
  }
  
  if (currentPeriod.length > 0) {
    periods.push(currentPeriod);
  }
  
  if (periods.length === 0) {
    return null;
  }
  
  // Calculate average period length
  const periodLengths = periods.map(p => p.length);
  const avgPeriodLength = Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length);
  
  // Calculate cycle lengths (time between period starts)
  const cycleLengths: number[] = [];
  for (let i = 1; i < periods.length; i++) {
    const prevStart = periods[i - 1][0];
    const currentStart = periods[i][0];
    const cycleLength = Math.round((currentStart.getTime() - prevStart.getTime()) / msPerDay);
    cycleLengths.push(cycleLength);
  }
  
  let avgCycleLength = 28; // Default
  let confidence: 'low' | 'medium' | 'high' = 'low';
  
  if (cycleLengths.length > 0) {
    avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    
    // Determine confidence based on data points
    if (cycleLengths.length >= 3) confidence = 'high';
    else if (cycleLengths.length >= 2) confidence = 'medium';
  }
  
  // Predict next period
  const lastPeriod = periods[periods.length - 1];
  const lastPeriodStart = lastPeriod[0];
  const predictedNextPeriod = new Date(lastPeriodStart.getTime() + (avgCycleLength * msPerDay));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntil = Math.round((predictedNextPeriod.getTime() - today.getTime()) / msPerDay);
  
  return {
    avgCycleLength,
    avgPeriodLength,
    totalCycles: periods.length,
    nextPeriodPrediction: predictedNextPeriod.toISOString().slice(0, 10),
    daysUntilNextPeriod: daysUntil,
    confidence,
  };
}

/**
 * Get current cycle day and phase - returns demo data in DEMO mode
 * Uses logged period days for accurate calculation
 */
export function getCurrentCycleInfo(): {
  cycleDay: number;
  phase: "menstruation" | "follicular" | "ovulation" | "luteal";
} | null {
  const { avgCycleLength, periodLength, lastPeriodStart } = loadCycleSettings();
  const periodDates = loadPeriodDates();
  
  if (!lastPeriodStart && periodDates.length === 0) return null;
  
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  
  /**
   * Find the most recent period start date that is on or before today
   * Logged periods have PRIORITY over lastPeriodStart prediction
   */
  const findPeriodStartBeforeDate = (date: Date): Date | null => {
    // If no logged periods, fall back to prediction
    if (periodDates.length === 0) {
      return lastPeriodStart ? new Date(lastPeriodStart) : null;
    }

    // Get all logged period dates
    const allLoggedDates = periodDates
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

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
          // Gap found - start new period group
          periodGroups.push([...currentGroup]);
          currentGroup = [allLoggedDates[i]];
        }
      }
    }
    // Don't forget the last group
    if (currentGroup.length > 0) {
      periodGroups.push(currentGroup);
    }

    // Find most recent period group that started on or before target date
    for (let i = periodGroups.length - 1; i >= 0; i--) {
      const periodStart = periodGroups[i][0];
      if (periodStart <= date) {
        return periodStart;
      }
    }

    // Fallback to prediction
    return lastPeriodStart ? new Date(lastPeriodStart) : null;
  };

  const periodStart = findPeriodStartBeforeDate(today);
  if (!periodStart) return null;

  const diff = Math.floor((today.getTime() - periodStart.getTime()) / msPerDay);
  const cycleDay = (((diff % avgCycleLength) + avgCycleLength) % avgCycleLength) + 1;
  
  // Calculate phase
  const follicularEnd = Math.min(periodLength + 7, avgCycleLength);
  const ovulationEnd = Math.min(periodLength + 11, avgCycleLength);
  
  let phase: "menstruation" | "follicular" | "ovulation" | "luteal" = "menstruation";
  if (cycleDay <= periodLength) phase = "menstruation";
  else if (cycleDay <= follicularEnd) phase = "follicular";
  else if (cycleDay <= ovulationEnd) phase = "ovulation";
  else phase = "luteal";
  
  return { cycleDay, phase };
}

// ============ HEALTH CHECK-IN DATA LOADERS ============

/**
 * Load today's health check-in - returns demo data in DEMO mode
 */
export function loadTodayHealthCheckIn(): DemoHealthCheckIn | null {
  const today = localDateStr();
  
  if (isInDemoMode()) {
    const allCheckIns = generateDemoHealthCheckIns();
    return allCheckIns.find(c => c.date === today) || null;
  }
  
  // Normal USER mode
  const key = `cw_daily_checkin_${today}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Load all health check-ins - returns demo data in DEMO mode
 */
export function loadAllHealthCheckIns(): DemoHealthCheckIn[] {
  if (isInDemoMode()) {
    return generateDemoHealthCheckIns();
  }
  
  // Normal USER mode - scan localStorage
  const checkIns: DemoHealthCheckIn[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('cw_daily_checkin_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        checkIns.push(data);
      } catch {
        // Ignore parse errors
      }
    }
  }
  return checkIns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Check if health check-in was completed today
 */
export function hasCompletedTodayCheckIn(): boolean {
  const today = localDateStr();
  const lastCheckIn = localStorage.getItem('cw_last_checkin');
  
  if (!lastCheckIn) return false;
  
  // Compare stored date string directly if it's already YYYY-MM-DD, else parse locally
  const lastCheckInDate = /^\d{4}-\d{2}-\d{2}$/.test(lastCheckIn)
    ? lastCheckIn
    : localDateStr(new Date(lastCheckIn));
  return lastCheckInDate === today;
}

/**
 * Get last check-in recommendations (for display in widgets)
 */
export function getLastCheckInRecommendations(): {
  recommendations: string[];
  riskAdjustment: 'reduce' | 'maintain' | 'increase' | null;
  riskReduction: number;
} | null {
  const todayCheckIn = loadTodayHealthCheckIn();
  
  if (todayCheckIn) {
    return {
      recommendations: todayCheckIn.recommendations,
      riskAdjustment: todayCheckIn.riskAdjustment,
      riskReduction: todayCheckIn.riskReduction,
    };
  }
  
  // If no check-in today, get most recent
  const allCheckIns = loadAllHealthCheckIns();
  if (allCheckIns.length === 0) return null;
  
  const mostRecent = allCheckIns[allCheckIns.length - 1];
  return {
    recommendations: mostRecent.recommendations,
    riskAdjustment: mostRecent.riskAdjustment,
    riskReduction: mostRecent.riskReduction,
  };
}
