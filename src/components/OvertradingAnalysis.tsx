import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, AlertTriangle, Target, BarChart3 } from "lucide-react";

interface Trade {
  id: string;
  date: string;
  result: 'win' | 'loss' | 'breakeven';
  closed_rrr?: number;
  r_multiple?: number;
  rMultiple?: number;
  created_at?: string | number;
}

interface Props {
  trades: Trade[];
}

export default function OvertradingAnalysis({ trades }: Props) {
  // Filter valid trades with date
  const tradesWithData = trades.filter(t => t.date && t.result);

  // Need at least 10 trades for meaningful analysis
  if (tradesWithData.length < 10) {
    return (
      <Card className="rounded-2xl shadow-soft border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Overtrading Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Not enough data yet. We need at least 10 trades to detect overtrading patterns.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Keep logging trades to unlock this analysis!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group trades by date
  const tradesByDate: Record<string, Trade[]> = {};
  tradesWithData.forEach(trade => {
    if (!tradesByDate[trade.date]) {
      tradesByDate[trade.date] = [];
    }
    tradesByDate[trade.date].push(trade);
  });

  // Sort trades by date (newest first) for each day
  Object.keys(tradesByDate).forEach(date => {
    tradesByDate[date].sort((a, b) => {
      const timeA = typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at || 0).getTime();
      const timeB = typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });
  });

  // Analyze performance degradation by trade number
  const performanceByTradeNumber: Record<number, { wins: number; total: number; rSum: number }> = {};

  Object.values(tradesByDate).forEach(dayTrades => {
    dayTrades.forEach((trade, index) => {
      const tradeNum = index + 1;
      if (!performanceByTradeNumber[tradeNum]) {
        performanceByTradeNumber[tradeNum] = { wins: 0, total: 0, rSum: 0 };
      }
      performanceByTradeNumber[tradeNum].total += 1;
      if (trade.result === 'win') performanceByTradeNumber[tradeNum].wins += 1;
      
      const rValue = trade.closed_rrr ?? trade.r_multiple ?? trade.rMultiple ?? 0;
      performanceByTradeNumber[tradeNum].rSum += Number(rValue);
    });
  });

  // Calculate stats per trade number
  const tradeNumberStats = Object.entries(performanceByTradeNumber).map(([num, stats]) => ({
    tradeNumber: Number(num),
    winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
    avgR: stats.total > 0 ? stats.rSum / stats.total : 0,
    count: stats.total
  })).sort((a, b) => a.tradeNumber - b.tradeNumber);

  // Find optimal trade count (peak performance)
  const viableStats = tradeNumberStats.filter(s => s.count >= 3); // Need at least 3 samples
  const firstTradeWinRate = viableStats[0]?.winRate || 0;
  const firstTradeAvgR = viableStats[0]?.avgR || 0;

  let optimalTradeCount = 1;
  let performanceDegradationDetected = false;
  let degradationStartsAt = 0;

  for (let i = 1; i < viableStats.length; i++) {
    const current = viableStats[i];
    const previous = viableStats[i - 1];
    
    // Check if performance drops significantly
    const winRateDrop = previous.winRate - current.winRate;
    const avgRDrop = previous.avgR - current.avgR;
    
    if (winRateDrop > 15 || avgRDrop > 0.5) {
      performanceDegradationDetected = true;
      degradationStartsAt = current.tradeNumber;
      optimalTradeCount = previous.tradeNumber;
      break;
    }
    
    // If performance stays good, this is still optimal
    if (current.winRate >= firstTradeWinRate * 0.85) {
      optimalTradeCount = current.tradeNumber;
    }
  }

  // Calculate average trades per day
  const daysWithTrades = Object.keys(tradesByDate).length;
  const avgTradesPerDay = tradesWithData.length / daysWithTrades;

  // Find days with overtrading (>optimal count)
  const overtradingDays = Object.entries(tradesByDate)
    .filter(([_, dayTrades]) => dayTrades.length > optimalTradeCount)
    .map(([date, dayTrades]) => {
      const wins = dayTrades.filter(t => t.result === 'win').length;
      const winRate = (wins / dayTrades.length) * 100;
      return { date, count: dayTrades.length, winRate };
    });

  const avgWinRateOnOvertradingDays = overtradingDays.length > 0
    ? overtradingDays.reduce((sum, day) => sum + day.winRate, 0) / overtradingDays.length
    : 0;

  const normalDays = Object.entries(tradesByDate)
    .filter(([_, dayTrades]) => dayTrades.length <= optimalTradeCount)
    .map(([date, dayTrades]) => {
      const wins = dayTrades.filter(t => t.result === 'win').length;
      const winRate = (wins / dayTrades.length) * 100;
      return { date, count: dayTrades.length, winRate };
    });

  const avgWinRateOnNormalDays = normalDays.length > 0
    ? normalDays.reduce((sum, day) => sum + day.winRate, 0) / normalDays.length
    : 0;

  const performanceImpact = avgWinRateOnNormalDays - avgWinRateOnOvertradingDays;

  // Determine severity
  const severity = performanceDegradationDetected && performanceImpact > 15 ? 'critical' : 
                   performanceDegradationDetected && performanceImpact > 8 ? 'warning' : 'good';

  return (
    <Card className="rounded-2xl shadow-soft border">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Overtrading Detection
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Analyzing {tradesWithData.length} trades across {daysWithTrades} trading days
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Main Alert Card */}
        <div className={`p-6 rounded-xl bg-gradient-to-br border-2 ${
          severity === 'critical' 
            ? 'from-red-500/20 to-red-600/10 border-red-500/30' 
            : severity === 'warning'
            ? 'from-orange-500/20 to-orange-600/10 border-orange-500/30'
            : 'from-green-500/20 to-green-600/10 border-green-500/30'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {severity === 'critical' && '🛑 Overtrading Detected'}
                {severity === 'warning' && '⚠️ Performance Decline'}
                {severity === 'good' && '✅ Healthy Trade Volume'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {performanceDegradationDetected
                  ? `Your performance drops significantly after trade #${degradationStartsAt}`
                  : 'Your trading volume appears healthy'}
              </p>
            </div>
            <TrendingDown className={`h-6 w-6 ${severity === 'critical' ? 'text-red-500' : severity === 'warning' ? 'text-orange-500' : 'text-green-500'}`} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{optimalTradeCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Optimal Daily Trades</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent-foreground">{avgTradesPerDay.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">Your Avg/Day</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${performanceImpact > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {performanceImpact > 0 ? '-' : '+'}{Math.abs(performanceImpact).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Impact on Win Rate</p>
            </div>
          </div>
          {performanceDegradationDetected && (
            <div className="mt-4 p-3 rounded-lg bg-card/50">
              <p className="text-sm">
                {severity === 'critical' && `⚠️ Your win rate drops from ${firstTradeWinRate.toFixed(0)}% (first trades) to ${viableStats.find(s => s.tradeNumber === degradationStartsAt)?.winRate.toFixed(0)}% after ${optimalTradeCount} trades. Stop earlier!`}
                {severity === 'warning' && `On days with >${optimalTradeCount} trades, your win rate is ${avgWinRateOnOvertradingDays.toFixed(0)}% vs ${avgWinRateOnNormalDays.toFixed(0)}% on normal days.`}
              </p>
            </div>
          )}
        </div>

        {/* Performance by Trade Number */}
        <div>
          <h4 className="font-semibold mb-4">Performance by Trade Number</h4>
          <div className="space-y-2">
            {tradeNumberStats.filter(s => s.count >= 2).map((stat) => {
              const isOptimal = stat.tradeNumber <= optimalTradeCount;
              const isDegraded = stat.tradeNumber >= degradationStartsAt && degradationStartsAt > 0;
              
              return (
                <div 
                  key={stat.tradeNumber} 
                  className={`p-4 rounded-lg ${
                    isDegraded ? 'bg-red-500/10 border border-red-500/30' :
                    isOptimal ? 'bg-green-500/10 border border-green-500/30' : 
                    'bg-muted/30 border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={isOptimal ? 'default' : 'secondary'}>
                        Trade #{stat.tradeNumber}
                      </Badge>
                      {isDegraded && <span className="text-xs text-red-500 font-semibold">⚠️ Degraded</span>}
                      {isOptimal && !isDegraded && <span className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ Optimal</span>}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${stat.avgR > 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                        {stat.avgR > 0 ? '+' : ''}{stat.avgR.toFixed(2)}R
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.winRate.toFixed(0)}% Win Rate</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3 w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isDegraded ? 'bg-red-500' : isOptimal ? 'bg-green-500' : 'bg-accent'}`}
                      style={{ width: `${stat.winRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {stat.count} trades
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-muted/30 border">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Normal Days (≤{optimalTradeCount} trades)
            </h4>
            <p className="text-2xl font-bold mb-2">{avgWinRateOnNormalDays.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              Win rate on days with healthy trade volume ({normalDays.length} days)
            </p>
          </div>
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <span className="text-destructive">⚠️</span>
              Overtrading Days ({'>'}{ optimalTradeCount} trades)
            </h4>
            <p className="text-2xl font-bold mb-2">{avgWinRateOnOvertradingDays.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              Win rate on days with too many trades ({overtradingDays.length} days)
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/10 border">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>💡</span>
            Recommendations
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {performanceDegradationDetected ? (
              <>
                <li className="text-orange-600 dark:text-orange-400 font-semibold">
                  ⚠️ <strong>Stop after {optimalTradeCount} trade{optimalTradeCount > 1 ? 's' : ''} per day.</strong> Your performance drops {performanceImpact.toFixed(0)}% after that point.
                </li>
                <li>• Your first {optimalTradeCount} trade{optimalTradeCount > 1 ? 's' : ''} have a {firstTradeWinRate.toFixed(0)}% win rate - that's your sweet spot</li>
                <li>• After trade #{degradationStartsAt}, win rate drops to {viableStats.find(s => s.tradeNumber === degradationStartsAt)?.winRate.toFixed(0)}% - concentration loss is visible</li>
                <li>• Consider taking a mandatory break after {optimalTradeCount} trades</li>
                {overtradingDays.length > 0 && (
                  <li className="font-semibold">• You've overtrade on {overtradingDays.length} days. Those days had {performanceImpact.toFixed(0)}% worse performance.</li>
                )}
              </>
            ) : (
              <>
                <li>• Your current trading volume is healthy</li>
                <li>• You maintain consistent performance across all trades</li>
                <li>• Continue monitoring for any changes in this pattern</li>
                <li>• Optimal range: {optimalTradeCount}-{optimalTradeCount + 1} trades per day</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
