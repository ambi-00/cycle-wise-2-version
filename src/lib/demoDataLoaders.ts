// Centralized demo data loaders for DEMO mode
// These functions check if app is in DEMO mode and return appropriate data

import { generateDemoCycleData, generateDemoHealthCheckIns, type DemoCycleSettings, type DemoHealthCheckIn } from "@/data/demo-data";

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
  return periodDates;
}

/**
 * Get current cycle day and phase - returns demo data in DEMO mode
 */
export function getCurrentCycleInfo(): {
  cycleDay: number;
  phase: "menstruation" | "follicular" | "ovulation" | "luteal";
} | null {
  const { avgCycleLength, periodLength, lastPeriodStart } = loadCycleSettings();
  
  if (!lastPeriodStart) return null;
  
  const today = new Date();
  const last = new Date(lastPeriodStart);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.floor((today.getTime() - last.getTime()) / msPerDay);
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
  const today = new Date().toISOString().split('T')[0];
  
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
  const today = new Date().toISOString().split('T')[0];
  const lastCheckIn = localStorage.getItem('cw_last_checkin');
  
  if (!lastCheckIn) return false;
  
  const lastCheckInDate = new Date(lastCheckIn).toISOString().split('T')[0];
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
