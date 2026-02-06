import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Calendar, Clock, Target, Brain, Lightbulb, AlertCircle, CheckCircle, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";

// AI Engine: Analyzes trade data and generates insights
const generateAIInsights = (trades: any[], healthData?: any) => {
  const rawInsights: any[] = [];
  const insightScores = new Map<string, number>();

  if (trades.length === 0) {
    return rawInsights;
  }

  const addInsight = (insight: any, relevanceScore: number = 50) => {
    rawInsights.push(insight);
    insightScores.set(insight.id, relevanceScore);
  };

  // ============ 1. PROFITABILITY STATUS ============
  const winningTrades = trades.filter((t) => t.result === "win" || t.profit > 0);
  const losingTrades = trades.filter((t) => t.result === "loss" || t.profit <= 0);
  const totalProfit = trades.reduce((sum, t) => sum + (t.profit || t.pnl || 0), 0);
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.profit || t.pnl || 0), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + Math.abs(t.profit || t.pnl || 0), 0) / losingTrades.length : 0;
  const winRate = ((winningTrades.length / trades.length) * 100).toFixed(1);
  const avgRRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "0";
  const isProfitable = totalProfit > 0;
  const expectancyPerTrade = (parseFloat(winRate) / 100 * avgWin) - ((100 - parseFloat(winRate)) / 100 * avgLoss);

  if (trades.length > 5) {
    if (isProfitable) {
      addInsight({
        id: "profitability-status",
        category: "strategy",
        title: `✅ Your System Is Profitable (+$${totalProfit.toFixed(0)})`,
        insight: `Overall: ${winRate}% win rate, ${avgRRR}:1 R:R, $${expectancyPerTrade.toFixed(2)}/trade expectancy.`,
        actionable: "Good baseline. Focus on consistency.",
        impact: "Low",
        icon: CheckCircle,
      }, 100);
    } else {
      addInsight({
        id: "profitability-crisis",
        category: "psychology",
        title: `⚠️ Not Profitable (-$${Math.abs(totalProfit).toFixed(0)})`,
        insight: `Currently losing. Win rate: ${winRate}%, R:R: ${avgRRR}:1.`,
        actionable: parseFloat(winRate) < 50 ? "Fix entries. Trade only your best 3 setups." : "Widen TP targets. Aim for 2:1 R:R minimum.",
        impact: "Critical",
        icon: AlertCircle,
      }, 120);
    }
  }

  // ============ 2. EMOTIONAL STATE IMPACT ============
  const calmTrades = trades.filter((t) => t.emotionalStateTrading === "calm" || (t.emotion_before && t.emotion_before >= 7));
  const anxiousTrades = trades.filter((t) => t.emotionalStateTrading === "anxious" || (t.emotion_before && t.emotion_before <= 3));

  if (calmTrades.length >= 3 && anxiousTrades.length >= 3) {
    const calmWins = (calmTrades.filter((t) => t.result === "win" || t.profit > 0).length / calmTrades.length) * 100;
    const anxiousWins = (anxiousTrades.filter((t) => t.result === "win" || t.profit > 0).length / anxiousTrades.length) * 100;
    const diff = Math.abs(calmWins - anxiousWins);

    if (diff > 15) {
      addInsight({
        id: "emotion-impact",
        category: "psychology",
        title: `Calm: ${calmWins.toFixed(0)}% | Anxious: ${anxiousWins.toFixed(0)}%`,
        insight: `Emotional state impacts your results by ${diff.toFixed(0)}%.`,
        actionable: calmWins > anxiousWins ? "Only trade when calm. Skip anxious trading days." : "Anxiety doesn't hurt. Stay consistent.",
        impact: diff > 25 ? "High" : "Medium",
        icon: Brain,
      }, 90);
    }
  }

  // ============ 3. R:R RATIO ============
  const rrrTrades = trades.filter((t) => t.rMultiple || t.rrr || t.r_multiple);
  if (rrrTrades.length >= 3) {
    const avgTradeRRR = (rrrTrades.reduce((sum, t) => sum + (t.rMultiple || t.rrr || t.r_multiple || 0), 0) / rrrTrades.length).toFixed(2);
    if (parseFloat(avgTradeRRR) < 1.5) {
      addInsight({
        id: "rrr-low",
        category: "strategy",
        title: `R:R Too Low: ${avgTradeRRR}:1`,
        insight: `Target 2:1+ for profitable trading.`,
        actionable: "Widen take-profit targets by 50%.",
        impact: "High",
        icon: Target,
      }, 95);
    } else if (parseFloat(avgTradeRRR) > 2.5) {
      addInsight({
        id: "rrr-excellent",
        category: "strategy",
        title: `Excellent R:R: ${avgTradeRRR}:1`,
        insight: `Your risk-reward is optimized.`,
        actionable: "Maintain this discipline.",
        impact: "Low",
        icon: CheckCircle,
      }, 60);
    }
  }

  // ============ 4. CYCLE PHASE ============
  const follicularTrades = trades.filter((t) => t.cycle_phase === "Follicular" || t.cyclePhase === "Follicular");
  const lutealTrades = trades.filter((t) => t.cycle_phase === "Luteal" || t.cyclePhase === "Luteal");

  if (follicularTrades.length >= 4 && lutealTrades.length >= 4) {
    const follicularWR = (follicularTrades.filter((t) => t.result === "win" || t.profit > 0).length / follicularTrades.length) * 100;
    const lutealWR = (lutealTrades.filter((t) => t.result === "win" || t.profit > 0).length / lutealTrades.length) * 100;
    const diff = Math.abs(follicularWR - lutealWR);

    if (diff > 20) {
      addInsight({
        id: "cycle-impact",
        category: "cycle",
        title: `Follicular: ${follicularWR.toFixed(0)}% | Luteal: ${lutealWR.toFixed(0)}%`,
        insight: `Cycle phase impacts performance by ${diff.toFixed(0)}%.`,
        actionable: follicularWR > lutealWR ? "Full size Follicular, 50% size Luteal." : "Trade more during Luteal.",
        impact: "High",
        icon: Calendar,
      }, 100);
    }
  }

  // ============ 5. SESSION TIMING ============
  const londonTrades = trades.filter((t) => t.sessionTime === "london");
  const newyorkTrades = trades.filter((t) => t.sessionTime === "newyork");
  const asiaTrades = trades.filter((t) => t.sessionTime === "asia");

  const sessionArray = [
    { name: "London", trades: londonTrades },
    { name: "New York", trades: newyorkTrades },
    { name: "Asia", trades: asiaTrades },
  ].filter((s) => s.trades.length >= 3);

  if (sessionArray.length >= 2) {
    const sessionStats = sessionArray.map((s) => ({
      name: s.name,
      wr: (s.trades.filter((t) => t.result === "win" || t.profit > 0).length / s.trades.length) * 100,
    }));

    const best = sessionStats.reduce((a, b) => a.wr > b.wr ? a : b);
    const worst = sessionStats.reduce((a, b) => a.wr < b.wr ? a : b);
    const diff = Math.abs(best.wr - worst.wr);

    if (diff > 20) {
      addInsight({
        id: "session-timing",
        category: "pattern",
        title: `Best: ${best.name} (${best.wr.toFixed(0)}%)`,
        insight: `${best.name} outperforms by ${diff.toFixed(0)}%.`,
        actionable: `Focus 80% on ${best.name}. Reduce or skip ${worst.name}.`,
        impact: "High",
        icon: Clock,
      }, 85);
    }
  }

  // ============ 6. PAIR PERFORMANCE ============
  const pairMap = new Map<string, { wins: number; total: number }>();
  trades.forEach((t) => {
    const pair = t.instrument || t.pair || "Unknown";
    const curr = pairMap.get(pair) || { wins: 0, total: 0 };
    curr.total++;
    if (t.result === "win" || t.profit > 0) curr.wins++;
    pairMap.set(pair, curr);
  });

  const pairPerfArray = Array.from(pairMap.entries())
    .filter(([_, d]) => d.total >= 3)
    .map(([pair, d]) => ({ pair, wr: (d.wins / d.total) * 100, total: d.total }))
    .sort((a, b) => b.wr - a.wr);

  if (pairPerfArray.length >= 2) {
    const best = pairPerfArray[0];
    const worst = pairPerfArray[pairPerfArray.length - 1];

    if (best.wr - worst.wr > 30) {
      addInsight({
        id: "pair-performance",
        category: "strategy",
        title: `${best.pair}: ${best.wr.toFixed(0)}% Win Rate`,
        insight: `${best.pair} outperforms ${worst.pair} by ${(best.wr - worst.wr).toFixed(0)}%.`,
        actionable: `Focus on ${best.pair}. Eliminate or reduce ${worst.pair}.`,
        impact: "High",
        icon: TrendingUp,
      }, 85);
    }
  }

  // ============ 7. BEST VS WORST TRADES ============
  const bestTrades = [...trades]
    .filter((t) => t.profit)
    .sort((a, b) => (b.profit || 0) - (a.profit || 0))
    .slice(0, 5);

  const worstTrades = [...trades]
    .filter((t) => t.profit)
    .sort((a, b) => (a.profit || 0) - (b.profit || 0))
    .slice(0, 5);

  if (bestTrades.length >= 3) {
    const bestEmotions = bestTrades.filter((t) => t.emotion_before).map((t) => t.emotion_before);
    const avgEmotion = bestEmotions.length > 0 ? (bestEmotions.reduce((a, b) => a + b, 0) / bestEmotions.length).toFixed(1) : null;

    if (avgEmotion && parseFloat(avgEmotion) > 6) {
      addInsight({
        id: "best-trades-pattern",
        category: "psychology",
        title: `Your Best Trades: When You're Calm`,
        insight: `Your top 5 trades avg emotion: ${avgEmotion}/10 (CALM).`,
        actionable: "Trade only when calm. Emotional control = edge.",
        impact: "High",
        icon: TrendingUp,
      }, 85);
    }
  }

  if (worstTrades.length >= 3) {
    const worstEmotions = worstTrades.filter((t) => t.emotion_before).map((t) => t.emotion_before);
    const avgEmotion = worstEmotions.length > 0 ? (worstEmotions.reduce((a, b) => a + b, 0) / worstEmotions.length).toFixed(1) : null;

    if (avgEmotion && parseFloat(avgEmotion) < 4) {
      addInsight({
        id: "worst-trades-pattern",
        category: "psychology",
        title: `Avoid: Trading When Anxious`,
        insight: `Your worst 5 trades avg emotion: ${avgEmotion}/10 (ANXIOUS).`,
        actionable: "Skip trading when anxiety high (< 4/10).",
        impact: "High",
        icon: AlertCircle,
      }, 85);
    }
  }

  // ============ 8. LOSS REASONS ============
  const lossMap = new Map<string, number>();
  trades.forEach((t) => {
    if (t.result === "loss" && t.loss_reason) {
      lossMap.set(t.loss_reason, (lossMap.get(t.loss_reason) || 0) + 1);
    }
  });

  const topLoss = Array.from(lossMap.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topLoss && topLoss[1] >= 2) {
    addInsight({
      id: "root-cause-loss",
      category: "psychology",
      title: `Top Losing Reason: "${topLoss[0]}" (${topLoss[1]}x)`,
      insight: `Your biggest loss leak.`,
      actionable: `Fix this pattern. Review these ${topLoss[1]} trades to identify the root cause.`,
      impact: topLoss[1] >= 5 ? "Critical" : "High",
      icon: AlertCircle,
    }, 95);
  }

  // ============ 9. WIN STREAKS & LOSING STREAKS ============
  let currentStreak = 0;
  let isWin = false;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  const streakList: { type: "win" | "loss"; len: number }[] = [];

  trades.forEach((trade, idx) => {
    const win = trade.result === "win" || trade.profit > 0;

    if (idx === 0) {
      currentStreak = 1;
      isWin = win;
    } else if ((win && isWin) || (!win && !isWin)) {
      currentStreak++;
    } else {
      streakList.push({ type: isWin ? "win" : "loss", len: currentStreak });
      maxWinStreak = Math.max(maxWinStreak, isWin ? currentStreak : 0);
      maxLossStreak = Math.max(maxLossStreak, !isWin ? currentStreak : 0);
      currentStreak = 1;
      isWin = win;
    }
  });

  if (currentStreak > 0) {
    streakList.push({ type: isWin ? "win" : "loss", len: currentStreak });
    maxWinStreak = Math.max(maxWinStreak, isWin ? currentStreak : 0);
    maxLossStreak = Math.max(maxLossStreak, !isWin ? currentStreak : 0);
  }

  // Losing streak insight
  if (maxLossStreak >= 3) {
    addInsight({
      id: "max-loss-streak",
      category: "psychology",
      title: `Worst Losing Streak: ${maxLossStreak} Trades`,
      insight: `Your longest losing streak was ${maxLossStreak} consecutive losses.`,
      actionable: `CRITICAL FOR RISK SIZING: If 10k account, max 5% loss = $500. Then: $500 ÷ ${maxLossStreak} = max $${(500 / maxLossStreak).toFixed(0)} SL per trade.`,
      impact: maxLossStreak >= 5 ? "High" : "Medium",
      icon: AlertCircle,
    }, 100);
  }

  // Winning streak insight
  if (maxWinStreak >= 3) {
    let overtradeCount = 0;
    for (let i = 0; i < trades.length - 1; i++) {
      const currWin = trades[i].result === "win" || trades[i].profit > 0;
      const nextWin = trades[i + 1].result === "win" || trades[i + 1].profit > 0;
      if (currWin && !nextWin && i > 0 && (trades[i - 1].result === "win" || trades[i - 1].profit > 0)) {
        overtradeCount++;
      }
    }

    addInsight({
      id: "max-win-streak",
      category: "psychology",
      title: `Best Winning Streak: ${maxWinStreak} Trades`,
      insight: `Longest win streak: ${maxWinStreak}. ${overtradeCount > 2 ? `After streaks, you overtrade (lose ${overtradeCount}x).` : "Good discipline."}`,
      actionable: overtradeCount > 2 ? "After 3+ wins: Take 30-min break before next trade." : "Maintain current discipline.",
      impact: overtradeCount > 2 ? "High" : "Low",
      icon: TrendingUp,
    }, 80);
  }

  // Average losing streak
  if (streakList.length >= 5) {
    const lossStreaks = streakList.filter((s) => s.type === "loss");
    if (lossStreaks.length > 0) {
      const avgLen = (lossStreaks.reduce((sum, s) => sum + s.len, 0) / lossStreaks.length).toFixed(1);
      addInsight({
        id: "avg-loss-streak",
        category: "strategy",
        title: `Avg Losing Streak: ${avgLen} Trades`,
        insight: `Typical losing streak: ${avgLen} trades. Worst: ${maxLossStreak}.`,
        actionable: `Use WORST case (${maxLossStreak}) for risk sizing, not average.`,
        impact: "Medium",
        icon: AlertCircle,
      }, 75);
    }
  }

  // ============ 10. CONFIRMATIONS ============
  const confirmMap = new Map<string, { wins: number; total: number }>();
  trades.forEach((t) => {
    (t.confirmations || []).forEach((conf: any) => {
      const key = typeof conf === "string" ? conf : conf.text || conf;
      const curr = confirmMap.get(key) || { wins: 0, total: 0 };
      curr.total++;
      if (t.result === "win" || t.profit > 0) curr.wins++;
      confirmMap.set(key, curr);
    });
  });

  const bestConfirm = Array.from(confirmMap.entries())
    .filter(([_, d]) => d.total >= 2)
    .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0];

  if (bestConfirm && (bestConfirm[1].wins / bestConfirm[1].total) * 100 > parseFloat(winRate) + 10) {
    const confirmWR = ((bestConfirm[1].wins / bestConfirm[1].total) * 100).toFixed(0);
    addInsight({
      id: "best-confirmation",
      category: "confirmation",
      title: `Best Confirmation: "${bestConfirm[0]}"`,
      insight: `${confirmWR}% win rate (${bestConfirm[1].total} trades).`,
      actionable: `Make "${bestConfirm[0]}" MANDATORY. Don't trade without it.`,
      impact: "Medium",
      icon: CheckCircle,
    }, 80);
  }

  // ============ 11. TIMEFRAMES ============
  const tfMap = new Map<string, { wins: number; total: number }>();
  trades.forEach((t) => {
    if (t.timeframe_small) {
      const curr = tfMap.get(t.timeframe_small) || { wins: 0, total: 0 };
      curr.total++;
      if (t.result === "win" || t.profit > 0) curr.wins++;
      tfMap.set(t.timeframe_small, curr);
    }
  });

  const bestTF = Array.from(tfMap.entries())
    .filter(([_, d]) => d.total >= 2)
    .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0];

  if (bestTF && (bestTF[1].wins / bestTF[1].total) * 100 > parseFloat(winRate) + 10) {
    const tfWR = ((bestTF[1].wins / bestTF[1].total) * 100).toFixed(0);
    addInsight({
      id: "best-timeframe",
      category: "pattern",
      title: `Best Timeframe: ${bestTF[0]}`,
      insight: `${tfWR}% win rate (${bestTF[1].total} trades).`,
      actionable: `Trade mainly on ${bestTF[0]}. Reduce other timeframes.`,
      impact: "Medium",
      icon: TrendingUp,
    }, 80);
  }

  // Return sorted by relevance
  return rawInsights.sort((a, b) => (insightScores.get(b.id) || 0) - (insightScores.get(a.id) || 0));
};

const getCategoryStyles = (category: string) => {
  const styles = {
    pattern: { bg: "bg-muted/50", text: "text-muted-foreground", label: "Pattern" },
    cycle: { bg: "bg-muted/50", text: "text-muted-foreground", label: "Cycle" },
    strategy: { bg: "bg-muted/50", text: "text-muted-foreground", label: "Strategy" },
    psychology: { bg: "bg-muted/50", text: "text-muted-foreground", label: "Psychology" },
    confirmation: { bg: "bg-muted/50", text: "text-muted-foreground", label: "Confirmation" },
  };
  return styles[category as keyof typeof styles] || styles.pattern;
};

const getImpactStyles = (impact: string) => {
  const styles = {
    Critical: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400",
    High: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400",
    Medium: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-600",
    Low: "bg-muted text-muted-foreground",
  };
  return styles[impact as keyof typeof styles] || styles.Medium;
};

export default function AIInsights() {
  const navigate = useNavigate();
  const { hasFeature } = useSubscription();
  const [trades, setTrades] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<any[]>([]);

  useEffect(() => {
    const allTrades = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("cw_trade_")) {
        try {
          const trade = JSON.parse(localStorage.getItem(key) || "{}");
          allTrades.push(trade);
        } catch {}
      }
    }

    if (allTrades.length > 0) {
      setTrades(allTrades);
      setHasData(true);
      const insights = generateAIInsights(allTrades);
      setGeneratedInsights(insights);
    }
  }, []);

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Trading Data</h1>
          <p className="text-muted-foreground mb-6">Start tracking trades to get AI insights</p>
          <Button onClick={() => navigate("/new-trade")} size="lg">
            Log Your First Trade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            AI Trading Insights
          </h1>
          <p className="text-muted-foreground">Based on {trades.length} trades analyzed</p>
        </div>

        <div className="space-y-4">
          {generatedInsights.map((insight, idx) => {
            const categoryStyle = getCategoryStyles(insight.category);
            const impactStyle = getImpactStyles(insight.impact);
            const IconComponent = insight.icon || Lightbulb;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={impactStyle}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <IconComponent className="h-6 w-6 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{insight.title}</h3>
                            <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${categoryStyle.bg} ${categoryStyle.text}`}>
                              {categoryStyle.label}
                            </span>
                          </div>
                          <span className="text-xs font-semibold whitespace-nowrap">{insight.impact}</span>
                        </div>
                        <p className="text-sm mb-3">{insight.insight}</p>
                        <div className="bg-background/50 p-3 rounded text-sm border-l-2 border-primary">
                          <strong>Action:</strong> {insight.actionable}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {generatedInsights.length === 0 && (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center">
              <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No significant insights yet. Log more trades to get AI analysis.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
