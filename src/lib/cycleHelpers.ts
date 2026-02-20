/**
 * Cycle Tracking Helper Functions
 * Shared utilities for calendar generation and cycle phase calculations
 */

export interface DayData {
  day: number;
  date: Date;
  cycleDay: number;
  phase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal';
  isLoggedPeriodDay?: boolean;
}

/**
 * Generate calendar data with full cycle tracking
 * Supports both logged period days and predicted cycle based on last period start
 * 
 * @param year - Calendar year
 * @param monthIndex - Month (0-11)
 * @param avgCycleLength - Average cycle length in days (default: 28)
 * @param lastPeriodStartIso - ISO date string of last period start (for prediction)
 * @param periodLength - Length of menstruation phase in days (default: 5)
 * @param loggedPeriodDays - Array of ISO date strings for manually logged period days
 * @returns Array of DayData for each day in the month
 */
export const generateCalendarData = (
  year: number,
  monthIndex: number,
  avgCycleLength: number,
  lastPeriodStartIso: string | null,
  periodLength: number,
  loggedPeriodDays: string[] = []
): DayData[] => {
  const days: DayData[] = [];
  const msPerDay = 1000 * 60 * 60 * 24;

  const lastStart = lastPeriodStartIso ? new Date(lastPeriodStartIso) : null;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  /**
   * Helper: Find the most recent period start date that is on or before a given date
   * Logged periods have PRIORITY over lastPeriodStart prediction
   */
  const findPeriodStartBeforeDate = (date: Date): Date | null => {
    // If no logged periods, fall back to prediction
    if (loggedPeriodDays.length === 0) return lastStart;

    // Get all logged period dates
    const allLoggedDates = loggedPeriodDays
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
    return lastStart;
  };

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, monthIndex, i);
    const dateStr = date.toISOString().split('T')[0];

    // Check if this date is a logged period day
    const isLoggedPeriodDay = loggedPeriodDays.includes(dateStr);

    // Find the period start that applies to this date
    const periodStart = findPeriodStartBeforeDate(date);

    let cycleDay = 1;
    if (periodStart) {
      const diff = Math.floor((date.getTime() - periodStart.getTime()) / msPerDay);
      cycleDay = (((diff % avgCycleLength) + avgCycleLength) % avgCycleLength) + 1;
    }

    // Determine phase
    const follicularEnd = Math.min(periodLength + 7, avgCycleLength);
    const ovulationEnd = Math.min(periodLength + 11, avgCycleLength);
    const phase: DayData['phase'] =
      cycleDay <= periodLength
        ? 'menstruation'
        : cycleDay <= follicularEnd
          ? 'follicular'
          : cycleDay <= ovulationEnd
            ? 'ovulation'
            : 'luteal';

    days.push({
      day: i,
      date,
      cycleDay,
      phase,
      isLoggedPeriodDay,
    });
  }

  return days;
};

/**
 * Simple calendar generator (used by Dashboard for quick display)
 * Faster version without logged period support
 */
export const generateSimpleCalendarData = (
  year: number,
  monthIndex: number,
  avgCycleLength: number,
  lastPeriodStartIso: string | null,
  periodLength: number
): DayData[] => {
  const days: DayData[] = [];
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
    const phase: DayData['phase'] =
      cycleDay <= periodLength
        ? 'menstruation'
        : cycleDay <= follicularEnd
          ? 'follicular'
          : cycleDay <= ovulationEnd
            ? 'ovulation'
            : 'luteal';

    days.push({
      day: i,
      date,
      cycleDay,
      phase,
      isLoggedPeriodDay: false,
    });
  }

  return days;
};

/**
 * Get current cycle day and phase for a given date
 */
export const getCycleDayAndPhase = (
  date: Date,
  avgCycleLength: number,
  lastPeriodStartIso: string | null,
  periodLength: number
): { cycleDay: number; phase: DayData['phase'] } => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const lastStart = lastPeriodStartIso ? new Date(lastPeriodStartIso) : null;

  let cycleDay = 1;
  if (lastStart) {
    const diff = Math.floor((date.getTime() - lastStart.getTime()) / msPerDay);
    cycleDay = (((diff % avgCycleLength) + avgCycleLength) % avgCycleLength) + 1;
  }

  const follicularEnd = Math.min(periodLength + 7, avgCycleLength);
  const ovulationEnd = Math.min(periodLength + 11, avgCycleLength);
  const phase: DayData['phase'] =
    cycleDay <= periodLength
      ? 'menstruation'
      : cycleDay <= follicularEnd
        ? 'follicular'
        : cycleDay <= ovulationEnd
          ? 'ovulation'
          : 'luteal';

  return { cycleDay, phase };
};
