import { useMemo } from "react";

interface Trade {
  id: string;
  date: string;
  result: 'win' | 'loss' | 'breakeven';
  closed_rrr?: number;
  r_multiple?: number;
  rMultiple?: number;
  maxRReached?: number;
  planned_rrr?: number;
  rrr?: number;
  sl_distance?: number;
  created_at?: string | number;
}

interface AnalysisInsight {
  type: 'critical' | 'warning' | 'recommendation' | 'success';
  category: 'overtrading' | 'rrr' | 'sl' | 'avoidable_losses' | 'performance';
  message: string;
  priority: number; // 1-5, higher = more important
  actionable: boolean;
}

export type { AnalysisInsight };

// RRR Analysis Logic
const analyzeRRR = (trades: Trade[]): AnalysisInsight[] => {
  const insights: AnalysisInsight[] = [];
  
  if (trades.length < 5) return insights;

  const tradesWithData = trades.filter(t => 
    t.result && (t.maxRReached !== undefined || t.planned_rrr !== undefined)
  );

  if (tradesWithData.length < 5) return insights;

  // Calculate avoidable losses
  const lossTrades = tradesWithData.filter(t => t.result === 'loss' && (t.maxRReached || 0) > 0);
  
  // Find optimal RRR first (simplified version)
  const testRRRs = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  const rrrStats = testRRRs.map(targetRRR => {
    const hits = tradesWithData.filter(t => (t.maxRReached || 0) >= targetRRR).length;
    const winRate = (hits / tradesWithData.length) * 100;
    const expectedValue = (winRate / 100) * targetRRR - ((100 - winRate) / 100) * 1;
    return { rrr: targetRRR, winRate, expectedValue };
  });

  const viable = rrrStats.filter(s => s.winRate >= 50);
  const optimal = viable.length > 0 ? viable.reduce((best, current) => 
    current.expectedValue > best.expectedValue ? current : best
  , viable[0]) : rrrStats[0];

  const avoidableLosses = lossTrades.filter(t => (t.maxRReached || 0) >= optimal.rrr);

  if (avoidableLosses.length > 0) {
    insights.push({
      type: 'critical',
      category: 'avoidable_losses',
      message: `🚨 ${avoidableLosses.length} losses could have been winners! They reached ${optimal.rrr}R in profit but hit SL. Consider using smaller TP targets.`,
      priority: 5,
      actionable: true
    });
  }

  // Check if trader is too conservative or too aggressive
  const avgPlannedRRR = tradesWithData.reduce((sum, t) => sum + (t.planned_rrr || t.rrr || 0), 0) / tradesWithData.length;
  const avgMaxReached = tradesWithData.reduce((sum, t) => sum + (t.maxRReached || 0), 0) / tradesWithData.length;

  if (avgMaxReached > avgPlannedRRR * 1.5) {
    insights.push({
      type: 'warning',
      category: 'rrr',
      message: `💡 You're leaving money on the table! Your trades often go to ${avgMaxReached.toFixed(1)}R but you target only ${avgPlannedRRR.toFixed(1)}R. Consider higher targets.`,
      priority: 3,
      actionable: true
    });
  } else if (avgMaxReached < avgPlannedRRR * 0.8) {
    insights.push({
      type: 'warning',
      category: 'rrr',
      message: `⚠️ Your targets are too ambitious. You reach ${avgMaxReached.toFixed(1)}R on average but target ${avgPlannedRRR.toFixed(1)}R. Consider more realistic goals.`,
      priority: 4,
      actionable: true
    });
  }

  return insights;
};

// SL Analysis Logic
const analyzeSL = (trades: Trade[]): AnalysisInsight[] => {
  const insights: AnalysisInsight[] = [];
  
  const tradesWithSL = trades.filter(t => t.sl_distance && t.sl_distance > 0);
  
  if (tradesWithSL.length < 5) return insights;

  // Group by trade number of day (simplified)
  const tradesByDate: Record<string, Trade[]> = {};
  tradesWithSL.forEach(trade => {
    if (!tradesByDate[trade.date]) {
      tradesByDate[trade.date] = [];
    }
    tradesByDate[trade.date].push(trade);
  });

  let totalLosses = 0;
  let earlyStopLosses = 0;

  Object.values(tradesByDate).forEach(dayTrades => {
    dayTrades.forEach(trade => {
      if (trade.result === 'loss') {
        totalLosses++;
        // If SL distance is very small (< 15 pips) and it's a loss, might be too tight
        if (trade.sl_distance && trade.sl_distance < 15) {
          earlyStopLosses++;
        }
      }
    });
  });

  if (earlyStopLosses / totalLosses > 0.4 && earlyStopLosses > 3) {
    insights.push({
      type: 'warning',
      category: 'sl',
      message: `⚠️ ${earlyStopLosses} of your ${totalLosses} losses might be due to SL being too tight (<15 pips). Consider wider stop losses.`,
      priority: 4,
      actionable: true
    });
  }

  return insights;
};

// Overtrading Analysis Logic
const analyzeOvertrading = (trades: Trade[]): AnalysisInsight[] => {
  const insights: AnalysisInsight[] = [];
  
  if (trades.length < 10) return insights;

  // Group trades by date
  const tradesByDate: Record<string, Trade[]> = {};
  trades.forEach(trade => {
    if (!tradesByDate[trade.date]) {
      tradesByDate[trade.date] = [];
    }
    tradesByDate[trade.date].push(trade);
  });

  // Sort trades by time for each day
  Object.keys(tradesByDate).forEach(date => {
    tradesByDate[date].sort((a, b) => {
      const timeA = typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at || 0).getTime();
      const timeB = typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });
  });

  // Analyze performance degradation by trade number
  const performanceByTradeNumber: Record<number, { wins: number; total: number }> = {};

  Object.values(tradesByDate).forEach(dayTrades => {
    dayTrades.forEach((trade, index) => {
      const tradeNum = index + 1;
      if (!performanceByTradeNumber[tradeNum]) {
        performanceByTradeNumber[tradeNum] = { wins: 0, total: 0 };
      }
      performanceByTradeNumber[tradeNum].total += 1;
      if (trade.result === 'win') performanceByTradeNumber[tradeNum].wins += 1;
    });
  });

  // Calculate win rates
  const tradeNumberStats = Object.entries(performanceByTradeNumber).map(([num, stats]) => ({
    tradeNumber: Number(num),
    winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
    count: stats.total
  })).filter(s => s.count >= 3); // Need at least 3 samples

  if (tradeNumberStats.length >= 2) {
    const firstTradeWinRate = tradeNumberStats[0].winRate;
    const degradationFound = tradeNumberStats.find((stat, index) => {
      if (index === 0) return false;
      const previous = tradeNumberStats[index - 1];
      return stat.winRate < previous.winRate - 15; // 15% drop
    });

    if (degradationFound) {
      insights.push({
        type: 'critical',
        category: 'overtrading',
        message: `🛑 OVERTRADING DETECTED! Your win rate drops from ${firstTradeWinRate.toFixed(0)}% to ${degradationFound.winRate.toFixed(0)}% after ${degradationFound.tradeNumber} trades. Stop earlier!`,
        priority: 5,
        actionable: true
      });
    }
  }

  // Check for consecutive losses today
  const today = new Date().toISOString().slice(0, 10);
  const todayTrades = tradesByDate[today] || [];
  
  if (todayTrades.length >= 2) {
    const lastTwo = todayTrades.slice(-2);
    if (lastTwo[0].result === 'loss' && lastTwo[1].result === 'loss') {
      insights.push({
        type: 'critical',
        category: 'overtrading',
        message: `🚨 STOP TRADING NOW! You've had 2 consecutive losses today. Historical data shows this leads to more losses.`,
        priority: 5,
        actionable: true
      });
    }
  }

  return insights;
};

// Performance Analysis Logic
const analyzePerformance = (trades: Trade[]): AnalysisInsight[] => {
  const insights: AnalysisInsight[] = [];
  
  if (trades.length < 10) return insights;

  const wins = trades.filter(t => t.result === 'win').length;
  const winRate = (wins / trades.length) * 100;
  
  const totalR = trades.reduce((sum, t) => {
    const rValue = t.closed_rrr ?? t.r_multiple ?? t.rMultiple ?? 0;
    return sum + Number(rValue);
  }, 0);
  const avgR = totalR / trades.length;

  // Excellent performance
  if (winRate > 70 && avgR > 1.5) {
    insights.push({
      type: 'success',
      category: 'performance',
      message: `🎉 Excellent performance! ${winRate.toFixed(0)}% win rate with ${avgR.toFixed(1)}R average. You're in the top 5% of traders!`,
      priority: 2,
      actionable: false
    });
  }
  // Good performance with room for improvement
  else if (winRate > 50 && avgR > 0.5) {
    insights.push({
      type: 'recommendation',
      category: 'performance',
      message: `✅ Solid performance: ${winRate.toFixed(0)}% win rate, ${avgR.toFixed(1)}R average. Focus on consistency to reach the next level.`,
      priority: 2,
      actionable: true
    });
  }
  // Struggling performance
  else if (winRate < 45 || avgR < 0) {
    insights.push({
      type: 'warning',
      category: 'performance',
      message: `⚠️ Performance needs attention: ${winRate.toFixed(0)}% win rate, ${avgR.toFixed(1)}R average. Consider reviewing your strategy and risk management.`,
      priority: 4,
      actionable: true
    });
  }

  return insights;
};

export function useAIInsightsAnalysis(trades: Trade[]): AnalysisInsight[] {
  return useMemo(() => {
    const allInsights: AnalysisInsight[] = [];
    
    // Collect insights from all analyzers
    allInsights.push(...analyzeRRR(trades));
    allInsights.push(...analyzeSL(trades));
    allInsights.push(...analyzeOvertrading(trades));
    allInsights.push(...analyzePerformance(trades));
    
    // Sort by priority (highest first)
    return allInsights.sort((a, b) => b.priority - a.priority);
  }, [trades]);
}

// Helper function to get the most important insight for display
export function getTopInsight(insights: AnalysisInsight[]): AnalysisInsight | null {
  return insights.length > 0 ? insights[0] : null;
}

// Helper function to format insight for display
export function formatInsightForCard(insight: AnalysisInsight | null): {
  text: string;
  category: "pattern" | "recommendation" | "warning";
} {
  if (!insight) {
    return {
      text: "No trades yet. Start logging trades to get AI insights!",
      category: "pattern"
    };
  }

  const categoryMap = {
    'critical': 'warning' as const,
    'warning': 'warning' as const,
    'recommendation': 'recommendation' as const,
    'success': 'pattern' as const
  };

  return {
    text: insight.message,
    category: categoryMap[insight.type]
  };
}