/**
 * Computes live performance statistics for a given strategy
 * by scanning all trades in localStorage.
 *
 * Always call this at render time – never rely on the static winRate/avgR
 * values stored on the strategy object, since those are never updated.
 */

export interface StrategyStats {
  tradesCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;     // 0-100
  avgR: number;        // average closed R-multiple
  totalPnl: number;
  profitFactor: number; // gross profit / gross loss
  score: number;        // 0-100 composite
}

/** Extract the closed R-multiple from a trade object (handles all field name variants) */
function getR(t: any): number {
  const r = t.closed_rrr ?? t.r_multiple ?? t.rMultiple ?? null;
  return r !== null && r !== '' ? Number(r) : 0;
}

/**
 * Load ALL trades from localStorage (ignores DEMO mode – only real trades).
 * We scan all `cw_journal_*` keys.
 */
function loadAllRealTrades(): any[] {
  try {
    const all: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cw_journal_')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            (data.trades || []).forEach((t: any) => all.push(t));
          }
        } catch {
          // skip malformed entries
        }
      }
    }
    return all;
  } catch {
    return [];
  }
}

/**
 * Compute live stats for one strategy from all logged trades.
 *
 * @param strategyName  The exact strategy name as stored on trades
 * @returns StrategyStats object
 */
export function computeStrategyStats(strategyName: string): StrategyStats {
  const all = loadAllRealTrades();

  // Match only closed trades that used this strategy
  const trades = all.filter(
    (t) =>
      (t.strategy === strategyName) &&
      (t.status === 'closed' || t.result === 'win' || t.result === 'loss' || t.result === 'breakeven')
  );

  if (trades.length === 0) {
    return {
      tradesCount: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: 0,
      avgR: 0,
      totalPnl: 0,
      profitFactor: 0,
      score: 0,
    };
  }

  const wins      = trades.filter((t) => t.result === 'win');
  const losses    = trades.filter((t) => t.result === 'loss');
  const breakevens = trades.filter((t) => t.result === 'breakeven');

  const winRate = (wins.length / trades.length) * 100;

  const totalR = trades.reduce((sum, t) => sum + getR(t), 0);
  const avgR   = totalR / trades.length;

  const totalPnl   = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const grossProfit = wins.reduce((sum, t)   => sum + Math.abs(Number(t.pnl) || 0), 0);
  const grossLoss   = losses.reduce((sum, t) => sum + Math.abs(Number(t.pnl) || 0), 0);
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  // Score: blend of win rate (40%), avg R contribution (40%), trade count bonus (20%)
  const wrScore    = Math.min(winRate, 100) * 0.4;
  const rScore     = Math.min(Math.max(avgR * 25, 0), 100) * 0.4; // 4R = 100 pts
  const countScore = Math.min(trades.length * 2, 100) * 0.2;      // 50 trades = full
  const score      = Math.round(wrScore + rScore + countScore);

  return {
    tradesCount: trades.length,
    winCount: wins.length,
    lossCount: losses.length,
    breakevenCount: breakevens.length,
    winRate: Math.round(winRate * 10) / 10,
    avgR: Math.round(avgR * 100) / 100,
    totalPnl,
    profitFactor: Math.round(profitFactor * 100) / 100,
    score,
  };
}
