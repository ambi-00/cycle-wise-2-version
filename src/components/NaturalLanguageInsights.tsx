import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { loadTradesFromLocalStorage, useStoredTrades } from "@/lib/tradeLoaders";

interface TradePattern {
  type: "positive" | "negative" | "warning";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  suggestion: string;
}

export default function NaturalLanguageInsights() {
  // useStoredTrades causes a re-render whenever trades are added/deleted
  // so analyzeTradePatterns() picks up fresh data from localStorage
  useStoredTrades();

  const analyzeTradePatterns = (): TradePattern[] => {
    const patterns: TradePattern[] = [];
    
    const trades = loadTradesFromLocalStorage();

    if (trades.length < 5) {
      return [{
        type: "warning",
        title: "Need More Data",
        description: "You need at least 5 trades for meaningful pattern analysis.",
        impact: "low",
        suggestion: "Keep logging your trades to unlock personalized insights!",
      }];
    }

    // Analyze cycle phase performance
    const cyclePhasePerformance = analyzeCyclePhasePerformance(trades);
    if (cyclePhasePerformance) patterns.push(cyclePhasePerformance);

    // Analyze day of week patterns
    const dayPattern = analyzeDayOfWeekPattern(trades);
    if (dayPattern) patterns.push(dayPattern);

    // Analyze win/loss streaks
    const streakPattern = analyzeStreakPattern(trades);
    if (streakPattern) patterns.push(streakPattern);

    // Analyze strategy performance
    const strategyPattern = analyzeStrategyPerformance(trades);
    if (strategyPattern) patterns.push(strategyPattern);

    // Analyze emotional state correlation
    const emotionalPattern = analyzeEmotionalCorrelation(trades);
    if (emotionalPattern) patterns.push(emotionalPattern);

    return patterns;
  };

  const analyzeCyclePhasePerformance = (trades: any[]): TradePattern | null => {
    const phaseStats: Record<string, { wins: number; total: number; rSum: number }> = {};
    
    trades.forEach(trade => {
      const phase = trade.cyclePhase || 'unknown';
      if (!phaseStats[phase]) phaseStats[phase] = { wins: 0, total: 0, rSum: 0 };
      phaseStats[phase].total++;
      if (trade.result === 'win') phaseStats[phase].wins++;
      phaseStats[phase].rSum += Number(trade.rMultiple) || 0;
    });

    let bestPhase = '';
    let bestWinRate = 0;
    let worstPhase = '';
    let worstWinRate = 100;

    Object.entries(phaseStats).forEach(([phase, stats]) => {
      if (stats.total < 3) return; // Need at least 3 trades
      const winRate = (stats.wins / stats.total) * 100;
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestPhase = phase;
      }
      if (winRate < worstWinRate) {
        worstWinRate = winRate;
        worstPhase = phase;
      }
    });

    if (!bestPhase) return null;

    const difference = bestWinRate - worstWinRate;
    if (difference > 20) {
      return {
        type: "positive",
        title: `You trade ${Math.round(difference)}% better during ${bestPhase} phase`,
        description: `Your win rate during ${bestPhase} is ${Math.round(bestWinRate)}%, compared to ${Math.round(worstWinRate)}% during ${worstPhase}.`,
        impact: "high",
        suggestion: `Consider taking more trades during ${bestPhase} and reducing position sizes during ${worstPhase}.`,
      };
    }

    return null;
  };

  const analyzeDayOfWeekPattern = (trades: any[]): TradePattern | null => {
    const dayStats: Record<string, { wins: number; total: number }> = {};
    
    trades.forEach(trade => {
      try {
        const date = new Date(trade.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        if (!dayStats[dayName]) dayStats[dayName] = { wins: 0, total: 0 };
        dayStats[dayName].total++;
        if (trade.result === 'win') dayStats[dayName].wins++;
      } catch (_e) { /* invalid date – skip */ }
    });

    let worstDay = '';
    let worstWinRate = 100;

    Object.entries(dayStats).forEach(([day, stats]) => {
      if (stats.total < 3) return;
      const winRate = (stats.wins / stats.total) * 100;
      if (winRate < worstWinRate && winRate < 40) {
        worstWinRate = winRate;
        worstDay = day;
      }
    });

    if (worstDay) {
      return {
        type: "warning",
        title: `Your losses cluster on ${worstDay}s`,
        description: `Win rate on ${worstDay}s is only ${Math.round(worstWinRate)}%, significantly below your average.`,
        impact: "medium",
        suggestion: `Avoid trading on ${worstDay}s or reduce position sizes until the pattern changes.`,
      };
    }

    return null;
  };

  const analyzeStreakPattern = (trades: any[]): TradePattern | null => {
    const currentStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTrades.forEach(trade => {
      if (trade.result === 'win') {
        tempWinStreak++;
        tempLossStreak = 0;
        if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
      } else if (trade.result === 'loss') {
        tempLossStreak++;
        tempWinStreak = 0;
        if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
      }
    });

    if (longestLossStreak >= 5) {
      return {
        type: "negative",
        title: `You've had losing streaks of ${longestLossStreak} trades`,
        description: "Long losing streaks often indicate emotional trading or market conditions not suited to your strategy.",
        impact: "high",
        suggestion: "Implement a 'circuit breaker': after 3 consecutive losses, take a mandatory break and review your strategy.",
      };
    }

    if (longestWinStreak >= 5) {
      return {
        type: "positive",
        title: `Impressive! You've maintained ${longestWinStreak}-trade winning streaks`,
        description: "This shows strong consistency when conditions align with your strategy.",
        impact: "medium",
        suggestion: "Document what market conditions and your mental state were during these streaks to replicate success.",
      };
    }

    return null;
  };

  const analyzeStrategyPerformance = (trades: any[]): TradePattern | null => {
    const strategyStats: Record<string, { wins: number; total: number; rSum: number }> = {};
    
    trades.forEach(trade => {
      const strategy = trade.strategy || 'No Strategy';
      if (!strategyStats[strategy]) strategyStats[strategy] = { wins: 0, total: 0, rSum: 0 };
      strategyStats[strategy].total++;
      if (trade.result === 'win') strategyStats[strategy].wins++;
      strategyStats[strategy].rSum += Number(trade.rMultiple) || 0;
    });

    let bestStrategy = '';
    let bestAvgR = -999;

    Object.entries(strategyStats).forEach(([strategy, stats]) => {
      if (stats.total < 3) return;
      const avgR = stats.rSum / stats.total;
      if (avgR > bestAvgR) {
        bestAvgR = avgR;
        bestStrategy = strategy;
      }
    });

    if (bestStrategy && bestAvgR > 0.5) {
      const winRate = (strategyStats[bestStrategy].wins / strategyStats[bestStrategy].total) * 100;
      return {
        type: "positive",
        title: `"${bestStrategy}" is your most profitable strategy`,
        description: `Average R: ${bestAvgR.toFixed(2)}, Win Rate: ${Math.round(winRate)}% (${strategyStats[bestStrategy].total} trades)`,
        impact: "high",
        suggestion: `Focus on "${bestStrategy}" setups and document what makes them work for you.`,
      };
    }

    return null;
  };

  const analyzeEmotionalCorrelation = (trades: any[]): TradePattern | null => {
    const emotionalTrades = trades.filter(t => t.emotionBefore !== undefined);
    if (emotionalTrades.length < 5) return null;

    let highEmotionWins = 0;
    let highEmotionTotal = 0;
    let lowEmotionWins = 0;
    let lowEmotionTotal = 0;

    emotionalTrades.forEach(trade => {
      const emotion = Number(trade.emotionBefore) || 5;
      if (emotion >= 7) {
        highEmotionTotal++;
        if (trade.result === 'win') highEmotionWins++;
      } else if (emotion <= 3) {
        lowEmotionTotal++;
        if (trade.result === 'win') lowEmotionWins++;
      }
    });

    if (lowEmotionTotal >= 3 && highEmotionTotal >= 3) {
      const lowEmotionWR = (lowEmotionWins / lowEmotionTotal) * 100;
      const highEmotionWR = (highEmotionWins / highEmotionTotal) * 100;

      if (lowEmotionWR < 40 && highEmotionWR > 60) {
        return {
          type: "warning",
          title: "You trade poorly when anxious or stressed",
          description: `Win rate when emotional state is low (≤3): ${Math.round(lowEmotionWR)}%`,
          impact: "high",
          suggestion: "Avoid trading when you're feeling anxious, tired, or stressed. Wait for mental clarity.",
        };
      }
    }

    return null;
  };

  const patterns = analyzeTradePatterns();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-primary/10 text-primary border-primary/20";
      case "low": return "bg-muted text-muted-foreground border-muted";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "positive": return <TrendingUp className="h-5 w-5 text-accent-foreground" />;
      case "negative": return <TrendingDown className="h-5 w-5 text-destructive" />;
      case "warning": return <AlertCircle className="h-5 w-5 text-primary" />;
      default: return <Sparkles className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="font-serif text-2xl font-bold text-foreground">AI-Powered Insights</h2>
      </div>

      {patterns.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No patterns detected yet. Keep logging trades to unlock personalized insights!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {patterns.map((pattern, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-2 ${
                pattern.type === 'positive' ? 'border-accent/30 bg-accent/5' :
                pattern.type === 'negative' ? 'border-destructive/30 bg-destructive/5' :
                'border-primary/30 bg-primary/5'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTypeIcon(pattern.type)}</div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{pattern.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {pattern.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={getImpactColor(pattern.impact)}>
                      {pattern.impact.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Alert className="border-primary/20 bg-primary/5">
                    <Target className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Suggestion:</strong> {pattern.suggestion}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
