import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

interface WinRateMeterWidgetProps {
  size: WidgetSize;
}

export function WinRateMeterWidget({ size }: WinRateMeterWidgetProps) {
  const storedTrades = loadTradesFromLocalStorage();

  const { winRate, totalTrades, wins, losses } = useMemo(() => {
    let total = 0;
    let wins = 0;
    for (const t of storedTrades) {
      total += 1;
      if (t.result === 'win') wins += 1;
    }
    return {
      totalTrades: total,
      wins,
      losses: total - wins,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    };
  }, [storedTrades]);

  const getWinRateColor = (rate: number) => {
    if (rate >= 60) return 'text-green-500 bg-green-500/10';
    if (rate >= 50) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 60) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (size === 'small') {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
      >
        {storedTrades.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 shadow-card border border-border/50 text-center">
            <div className="text-3xl font-bold mb-1 text-muted-foreground">0%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: winRate >= 60 ? '#22c55e' : winRate >= 50 ? '#eab308' : '#ef4444' }}>
              {winRate}%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      {storedTrades.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Win Rate Meter</h3>
              <p className="text-sm text-muted-foreground mb-2">Track your winning trade percentage</p>
              <p className="text-xs text-muted-foreground">Data needed: Trade results (Win/Loss)</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">📊 Win Rate Meter</h3>
          <div className={`rounded-xl p-4 mb-4 ${getWinRateColor(winRate)}`}>
            <div className="text-4xl font-bold mb-1">{winRate}%</div>
            <div className="text-sm opacity-75">{wins} wins / {losses} losses</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Trades: {totalTrades}</span>
              <span className="font-medium">{winRate >= 60 ? '🔥 Excellent' : winRate >= 50 ? '✓ Good' : '⚠ Needs Work'}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(winRate)}`}
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
