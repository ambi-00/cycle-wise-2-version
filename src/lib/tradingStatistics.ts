/**
 * Trading Statistics & Psychology Helper Functions
 * 
 * Helps traders build statistical confidence and reduce fear
 * by providing context and perspective on their trading results.
 */

export interface TradeStatistics {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRatio: number;
  largestWin: number;
  largestLoss: number;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: { type: 'win' | 'loss', count: number };
  maxDrawdown: number;
  currentDrawdown: number;
  totalPnL: number;
  expectedLossesPerTen: number;
  minWinRateNeeded: number;
  statisticalBuffer: number;
}

export interface DrawdownPeriod {
  startDate: Date;
  endDate: Date;
  tradeCount: number;
  amount: number;
  percentOfAccount: number;
}

/**
 * Calculate comprehensive trading statistics
 */
export function calculateTradeStatistics(trades: any[]): TradeStatistics {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      riskRewardRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      currentStreak: { type: 'win', count: 0 },
      maxDrawdown: 0,
      currentDrawdown: 0,
      totalPnL: 0,
      expectedLossesPerTen: 0,
      minWinRateNeeded: 0,
      statisticalBuffer: 0,
    };
  }

  const wins = trades.filter(t => (t.result === 'win' || t.pnl > 0));
  const losses = trades.filter(t => (t.result === 'loss' || t.pnl < 0));
  
  const winRate = (wins.length / trades.length) * 100;
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / losses.length : 0;
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Calculate streaks
  const streaks = calculateStreaks(trades);
  
  // Calculate drawdowns
  const drawdowns = calculateDrawdowns(trades);
  const maxDrawdown = drawdowns.maxDrawdown;
  const currentDrawdown = drawdowns.currentDrawdown;

  // Calculate minimum win rate needed for profitability
  const minWinRateNeeded = riskRewardRatio > 0 ? (1 / (1 + riskRewardRatio)) * 100 : 50;
  const statisticalBuffer = winRate - minWinRateNeeded;

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  return {
    totalTrades: trades.length,
    winRate,
    avgWin,
    avgLoss,
    riskRewardRatio,
    largestWin: wins.length > 0 ? Math.max(...wins.map(t => Math.abs(t.pnl || 0))) : 0,
    largestLoss: losses.length > 0 ? Math.max(...losses.map(t => Math.abs(t.pnl || 0))) : 0,
    longestWinStreak: streaks.longestWinStreak,
    longestLossStreak: streaks.longestLossStreak,
    currentStreak: streaks.currentStreak,
    maxDrawdown,
    currentDrawdown,
    totalPnL,
    expectedLossesPerTen: Math.round((1 - winRate / 100) * 10),
    minWinRateNeeded,
    statisticalBuffer,
  };
}

/**
 * Calculate win/loss streaks
 */
function calculateStreaks(trades: any[]) {
  let currentStreak = { type: 'win' as 'win' | 'loss', count: 0 };
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  // Sort by date (newest first)
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(b.entryTime || b.date).getTime() - new Date(a.entryTime || a.date).getTime()
  );

  for (let i = sortedTrades.length - 1; i >= 0; i--) {
    const trade = sortedTrades[i];
    const isWin = trade.result === 'win' || trade.pnl > 0;

    if (isWin) {
      tempWinStreak++;
      tempLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
    } else {
      tempLossStreak++;
      tempWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
    }

    // Track current streak (most recent trades)
    if (i === sortedTrades.length - 1) {
      currentStreak = {
        type: isWin ? 'win' : 'loss',
        count: 1
      };
    } else if (i === sortedTrades.length - 2 && 
               ((isWin && currentStreak.type === 'win') || (!isWin && currentStreak.type === 'loss'))) {
      currentStreak.count++;
    }
  }

  return { longestWinStreak, longestLossStreak, currentStreak };
}

/**
 * Calculate drawdown statistics
 */
function calculateDrawdowns(trades: any[]) {
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.entryTime || a.date).getTime() - new Date(b.entryTime || b.date).getTime()
  );

  let maxDrawdown = 0;
  let currentDrawdown = 0;
  let peak = 0;
  let runningTotal = 0;

  sortedTrades.forEach(trade => {
    runningTotal += (trade.pnl || 0);
    
    if (runningTotal > peak) {
      peak = runningTotal;
      currentDrawdown = 0;
    } else {
      currentDrawdown = peak - runningTotal;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
    }
  });

  return { maxDrawdown, currentDrawdown };
}

/**
 * Get context message for win rate
 */
export function getWinRateContext(stats: TradeStatistics): {
  message: string;
  isNormal: boolean;
  color: 'green' | 'yellow' | 'red';
} {
  const { winRate, longestLossStreak, currentStreak, expectedLossesPerTen } = stats;

  if (currentStreak.type === 'loss') {
    const expectedMaxStreak = Math.ceil(expectedLossesPerTen * 0.7); // Estimate
    const isNormal = currentStreak.count <= expectedMaxStreak;

    return {
      message: isNormal 
        ? `${currentStreak.count} losses in a row is statistically normal. Expected: up to ${expectedMaxStreak} losses.`
        : `${currentStreak.count} loss streak is above average. Consider reviewing strategy.`,
      isNormal,
      color: isNormal ? 'green' : 'yellow'
    };
  }

  return {
    message: `${Math.round(expectedLossesPerTen)} losses per 10 trades is normal at ${winRate.toFixed(1)}% win rate.`,
    isNormal: true,
    color: 'green'
  };
}

/**
 * Get context message for risk/reward
 */
export function getRiskRewardContext(stats: TradeStatistics): {
  message: string;
  strength: 'weak' | 'good' | 'excellent';
  color: 'red' | 'yellow' | 'green';
} {
  const { riskRewardRatio, winRate, minWinRateNeeded, statisticalBuffer } = stats;

  if (riskRewardRatio >= 2.0) {
    return {
      message: `With ${winRate.toFixed(1)}% WR + ${riskRewardRatio.toFixed(1)}:1 RR, you only need ${minWinRateNeeded.toFixed(1)}% to break even. You have ${statisticalBuffer.toFixed(1)}% buffer. Your edge is SOLID.`,
      strength: 'excellent',
      color: 'green'
    };
  } else if (riskRewardRatio >= 1.5) {
    return {
      message: `Decent RR ratio. At ${winRate.toFixed(1)}% WR, you need ${minWinRateNeeded.toFixed(1)}% to break even. Buffer: ${statisticalBuffer.toFixed(1)}%.`,
      strength: 'good',
      color: 'yellow'
    };
  } else {
    return {
      message: `Low RR ratio. Consider targeting better entries or wider targets to improve edge.`,
      strength: 'weak',
      color: 'red'
    };
  }
}

/**
 * Get context message for drawdown
 */
export function getDrawdownContext(stats: TradeStatistics): {
  message: string;
  status: 'safe' | 'warning' | 'danger';
  color: 'green' | 'yellow' | 'red';
} {
  const { maxDrawdown, currentDrawdown, totalPnL } = stats;
  
  if (totalPnL === 0) {
    return {
      message: 'No drawdown data yet. Keep tracking trades.',
      status: 'safe',
      color: 'green'
    };
  }

  const accountSize = Math.abs(totalPnL) + maxDrawdown; // Estimate
  const maxDDPercent = accountSize > 0 ? (maxDrawdown / accountSize) * 100 : 0;
  const currentDDPercent = accountSize > 0 ? (currentDrawdown / accountSize) * 100 : 0;

  if (currentDDPercent < 10) {
    return {
      message: `Current drawdown is ${currentDDPercent.toFixed(1)}% - small and normal. Historical max: ${maxDDPercent.toFixed(1)}%. Stay the course.`,
      status: 'safe',
      color: 'green'
    };
  } else if (currentDDPercent < 20) {
    return {
      message: `Drawdown at ${currentDDPercent.toFixed(1)}% - moderate but manageable. Review recent trades.`,
      status: 'warning',
      color: 'yellow'
    };
  } else {
    return {
      message: `High drawdown (${currentDDPercent.toFixed(1)}%). Time to pause and review strategy.`,
      status: 'danger',
      color: 'red'
    };
  }
}

/**
 * Get trade significance message
 */
export function getTradeSignificanceMessage(tradeNumber: number, currentWinRate: number): string {
  const impactIfLoss = currentWinRate - (1 / tradeNumber) * 100;
  
  return `This is trade #${tradeNumber}. Even if loss, your win rate only changes from ${currentWinRate.toFixed(1)}% → ${impactIfLoss.toFixed(1)}%. This trade doesn't define you.`;
}

/**
 * Get post-loss perspective message
 */
export function getPostLossMessage(stats: TradeStatistics, lossAmount: number): string {
  const { totalTrades, totalPnL } = stats;
  const newPnL = totalPnL - Math.abs(lossAmount);
  const percentage = ((1 / totalTrades) * 100).toFixed(1);
  
  return `This loss is 1/${totalTrades} = ${percentage}% of your results. Total P&L: ${totalPnL >= 0 ? '+' : ''}€${totalPnL.toFixed(0)} → ${newPnL >= 0 ? '+' : ''}€${newPnL.toFixed(0)}. ${newPnL > 0 ? 'Still profitable.' : 'Part of the journey.'} One loss is noise, not signal.`;
}
