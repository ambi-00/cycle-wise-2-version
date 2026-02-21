/**
 * Trade Loading Utilities - Single source of truth for all trade operations
 * Consolidates all localStorage iteration patterns into reusable functions
 */

import { generateDemoTrades } from "@/data/demo-data";

/**
 * Check if we're in DEMO mode
 */
function isInDemoMode(): boolean {
  try {
    // Check localStorage for app mode (set by Settings page)
    const profiles = localStorage.getItem('sb-localhost-auth-token') || localStorage.getItem('sb-xgqbpfgbccfghxajmrde-auth-token');
    if (profiles) {
      // In a real scenario, we'd check Supabase. For now, check a dedicated key.
      const demoMode = localStorage.getItem('cw_app_mode');
      return demoMode === 'DEMO';
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Load ALL trades from localStorage OR demo data
 * Used by: Dashboard, AIInsights, NaturalLanguageInsights, QuickStartChecklist, getWinLossStreak, etc.
 * 
 * @param filterByDate Optional: load only trades from a specific date (YYYY-MM-DD)
 * @returns Array of trade objects
 */
export function loadTradesFromLocalStorage(filterByDate?: string): any[] {
  // In DEMO mode, return demo trades
  if (isInDemoMode()) {
    console.log('📊 DEMO MODE ACTIVE - Loading demo trades');
    const demoTrades = generateDemoTrades();
    
    // Convert demo trade format to app trade format
    const convertedTrades = demoTrades.map((t: any) => ({
      id: t.id,
      date: t.entry_date.split('T')[0], // Convert ISO to YYYY-MM-DD
      entryDate: t.entry_date,
      exitDate: t.exit_date,
      symbol: t.symbol,
      direction: t.direction,
      entryPrice: t.entry_price,
      exitPrice: t.exit_price,
      positionSize: t.position_size,
      profitLoss: t.profit_loss,
      profitLossPercent: t.profit_loss_percent,
      strategy: t.strategy,
      notes: t.notes || '',
      screenshot: null,
      tags: [],
      cyclePhase: t.cycle_phase,
      createdAt: new Date(t.entry_date).getTime(),
    }));
    
    console.log('📊 Demo trades converted:', convertedTrades.length);
    
    if (filterByDate) {
      return convertedTrades.filter((t: any) => t.date === filterByDate);
    }
    return convertedTrades;
  }

  try {
    if (filterByDate) {
      // Single date lookup - faster
      const raw = localStorage.getItem(`cw_journal_${filterByDate}`);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return (data.trades || []).map((t: any) => ({ ...t }));
    }

    // Load ALL trades across all dates
    const allTrades: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cw_journal_')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw);
          if (data.trades && Array.isArray(data.trades)) {
            allTrades.push(...data.trades);
          }
        } catch (e) {
          // Ignore malformed entries silently
          console.warn(`Failed to parse ${key}:`, e);
        }
      }
    }

    // Sort by date descending (newest first)
    return allTrades.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  } catch (e) {
    console.error('Error loading trades from localStorage:', e);
    return [];
  }
}

/**
 * Check if ANY trade exists in localStorage
 * Used by: QuickStartChecklist and others for empty state checks
 * 
 * @returns boolean
 */
export function hasAnyTrades(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cw_journal_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.trades && data.trades.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Count total trades
 * Efficient for checks like: if (tradeCount < 5) show empty state
 */
export function countTradesInLocalStorage(): number {
  try {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cw_journal_')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            count += (data.trades || []).length;
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return count;
  } catch (e) {
    return 0;
  }
}

/**
 * Get trades grouped by month
 * Used for Statistics, Performance Cards, etc.
 */
export function getTradesGroupedByMonth(
  trades?: any[]
): Record<string, any[]> {
  const useTrades = trades || loadTradesFromLocalStorage();
  const grouped: Record<string, any[]> = {};

  useTrades.forEach((trade) => {
    const date = trade.date || new Date().toISOString().split('T')[0];
    const month = date.substring(0, 7); // YYYY-MM

    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(trade);
  });

  return grouped;
}

/**
 * Get trades grouped by date
 * Used for calendar displays, daily summaries, etc.
 */
export function getTradesGroupedByDate(
  trades?: any[]
): Record<string, any[]> {
  const useTrades = trades || loadTradesFromLocalStorage();
  const grouped: Record<string, any[]> = {};

  useTrades.forEach((trade) => {
    const date = trade.date || new Date().toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(trade);
  });

  return grouped;
}

/**
 * Count trades for a given month
 * Used by: NewTrade.tsx for trade limit checks
 */
export function countTradesInMonth(year: number, month: number): number {
  try {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    let count = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cw_journal_')) {
        const dateStr = key.replace('cw_journal_', '');
        const tradeDate = new Date(dateStr);

        if (tradeDate >= monthStart && tradeDate <= monthEnd) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const data = JSON.parse(raw);
              count += (data.trades || []).length;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }

    return count;
  } catch (e) {
    return 0;
  }
}

/**
 * Calculate win/loss streak
 * Consecutive wins or losses from most recent trades
 */
export function getWinLossStreak(trades?: any[]): {
  winStreak: number;
  lossStreak: number;
  currentType: 'win' | 'loss' | 'none';
} {
  try {
    const useTrades = trades || loadTradesFromLocalStorage();

    // Sort by date descending (newest first)
    const sorted = [...useTrades].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    let winStreak = 0;
    let lossStreak = 0;
    let currentType: 'win' | 'loss' | 'none' = 'none';

    for (const trade of sorted) {
      if (trade.result === 'win') {
        if (currentType === 'win') {
          winStreak += 1;
        } else {
          if (currentType === 'loss' && lossStreak > 0) break;
          currentType = 'win';
          winStreak = 1;
        }
      } else if (trade.result === 'loss') {
        if (currentType === 'loss') {
          lossStreak += 1;
        } else {
          if (currentType === 'win' && winStreak > 0) break;
          currentType = 'loss';
          lossStreak = 1;
        }
      }
    }

    return { winStreak, lossStreak, currentType };
  } catch (e) {
    return { winStreak: 0, lossStreak: 0, currentType: 'none' };
  }
}
