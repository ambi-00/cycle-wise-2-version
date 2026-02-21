/**
 * Execution Quality Calculations
 * Separate from P&L metrics - focuses on process adherence
 */

import { loadTradesFromLocalStorage } from './tradeLoaders';

export interface ExecutionMetrics {
  totalTrades: number;
  tradesWithReview: number;
  executionRate: number; // % of trades following plan
  avgExecutionScore: number; // Average score (0-100)
  followedEntry: number; // % of trades
  followedExit: number;
  riskAppropriate: number;
  emotionallyNeutral: number;
  perfectExecutions: number; // 100% score trades
  goodExecutions: number; // 75-99% score
  fairExecutions: number; // 50-74% score
  poorExecutions: number; // < 50% score
}

export interface ProcessVsOutcome {
  perfectWins: number; // 100% execution + win
  perfectLosses: number; // 100% execution + loss (GOOD trades!)
  brokenWins: number; // < 75% execution + win (lucky)
  brokenLosses: number; // < 75% execution + loss (worst)
}

/**
 * Calculate execution quality metrics for all closed trades
 */
export function calculateExecutionMetrics(): ExecutionMetrics {
  const trades = loadTradesFromLocalStorage().filter(t => t.status === 'closed');
  const reviewed = trades.filter(t => t.execution_score !== undefined && t.execution_score !== null);

  const totalTrades = trades.length;
  const tradesWithReview = reviewed.length;

  if (tradesWithReview === 0) {
    return {
      totalTrades,
      tradesWithReview: 0,
      executionRate: 0,
      avgExecutionScore: 0,
      followedEntry: 0,
      followedExit: 0,
      riskAppropriate: 0,
      emotionallyNeutral: 0,
      perfectExecutions: 0,
      goodExecutions: 0,
      fairExecutions: 0,
      poorExecutions: 0,
    };
  }

  // Calculate averages
  const avgScore = reviewed.reduce((sum, t) => sum + (t.execution_score || 0), 0) / tradesWithReview;
  
  // Individual criteria adherence
  const followedEntry = reviewed.filter(t => t.followed_entry_criteria === true).length / tradesWithReview * 100;
  const followedExit = reviewed.filter(t => t.followed_exit_criteria === true).length / tradesWithReview * 100;
  const riskAppropriate = reviewed.filter(t => t.risk_appropriate === true).length / tradesWithReview * 100;
  const emotionallyNeutral = reviewed.filter(t => t.emotionally_neutral === true).length / tradesWithReview * 100;

  // Execution rate: % of trades with score >= 75%
  const goodTrades = reviewed.filter(t => (t.execution_score || 0) >= 75).length;
  const executionRate = (goodTrades / tradesWithReview) * 100;

  // Score distribution
  const perfectExecutions = reviewed.filter(t => t.execution_score === 100).length;
  const goodExecutions = reviewed.filter(t => (t.execution_score || 0) >= 75 && t.execution_score < 100).length;
  const fairExecutions = reviewed.filter(t => (t.execution_score || 0) >= 50 && t.execution_score < 75).length;
  const poorExecutions = reviewed.filter(t => (t.execution_score || 0) < 50).length;

  return {
    totalTrades,
    tradesWithReview,
    executionRate,
    avgExecutionScore: avgScore,
    followedEntry,
    followedExit,
    riskAppropriate,
    emotionallyNeutral,
    perfectExecutions,
    goodExecutions,
    fairExecutions,
    poorExecutions,
  };
}

/**
 * Analyze Process vs Outcome
 * The most important insight: Good execution can have bad outcomes, and vice versa
 */
export function analyzeProcessVsOutcome(): ProcessVsOutcome {
  const trades = loadTradesFromLocalStorage().filter(t => 
    t.status === 'closed' && 
    t.execution_score !== undefined && 
    t.execution_score !== null &&
    t.result && 
    t.result !== 'breakeven'
  );

  const perfectWins = trades.filter(t => 
    t.execution_score === 100 && t.result === 'win'
  ).length;

  const perfectLosses = trades.filter(t => 
    t.execution_score === 100 && t.result === 'loss'
  ).length;

  const brokenWins = trades.filter(t => 
    (t.execution_score || 0) < 75 && t.result === 'win'
  ).length;

  const brokenLosses = trades.filter(t => 
    (t.execution_score || 0) < 75 && t.result === 'loss'
  ).length;

  return {
    perfectWins,
    perfectLosses,
    brokenWins,
    brokenLosses,
  };
}

/**
 * Get execution quality message and coaching
 */
export function getExecutionQualityMessage(metrics: ExecutionMetrics): {
  message: string;
  tip: string;
  color: string;
} {
  const { executionRate, avgExecutionScore } = metrics;

  if (metrics.tradesWithReview < 10) {
    return {
      message: "Start reviewing your trades to build execution awareness",
      tip: "The Trade Review appears after closing a trade. It takes 30 seconds and helps you separate process from outcome.",
      color: "text-muted-foreground"
    };
  }

  if (executionRate >= 80) {
    return {
      message: `Outstanding discipline! ${executionRate.toFixed(0)}% execution rate`,
      tip: "You're trading like a professional. Your edge will compound with this consistency.",
      color: "text-green-500"
    };
  }

  if (executionRate >= 65) {
    return {
      message: `Strong execution rate: ${executionRate.toFixed(0)}%`,
      tip: "You're consistently following your plan. Keep this up and results will follow.",
      color: "text-green-500"
    };
  }

  if (executionRate >= 50) {
    return {
      message: `Decent execution: ${executionRate.toFixed(0)}% plan adherence`,
      tip: "You're on the right track. Focus on identifying which rules you break most often.",
      color: "text-yellow-500"
    };
  }

  return {
    message: `Execution needs improvement: ${executionRate.toFixed(0)}% plan adherence`,
    tip: "Most trades aren't following your plan. This is normal early on. The key is awareness - you're tracking it, which is the first step.",
    color: "text-orange-500"
  };
}

/**
 * Get process vs outcome insights
 */
export function getProcessVsOutcomeInsight(pvo: ProcessVsOutcome): {
  message: string;
  tip: string;
} {
  const { perfectWins, perfectLosses, brokenWins, brokenLosses } = pvo;
  const totalPerfect = perfectWins + perfectLosses;
  const totalBroken = brokenWins + brokenLosses;

  if (perfectLosses > brokenWins && perfectLosses > 0) {
    return {
      message: `You have ${perfectLosses} perfect-execution losses. These are WINS in terms of process!`,
      tip: "These trades prove you're disciplined enough to follow your plan even when it results in a loss. That's professional trading."
    };
  }

  if (brokenWins > perfectWins && brokenWins > 0) {
    return {
      message: `${brokenWins} wins came from broken rules. This is dangerous.`,
      tip: "Luck is not a strategy. These wins reinforce bad habits. Focus on execution quality, not just P&L."
    };
  }

  if (totalPerfect > totalBroken * 2) {
    return {
      message: "Your execution quality is strong across wins AND losses",
      tip: "This is what sustainable trading looks like. You're focused on process, not outcome."
    };
  }

  return {
    message: "Continue focusing on execution quality, regardless of outcome",
    tip: "The goal: Perfect execution on every trade, win or lose. P&L is just feedback, not the measure of success."
  };
}
