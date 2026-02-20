import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

interface WeeklySummaryWidgetProps {
  size: WidgetSize;
}

export function WeeklySummaryWidget({ size }: WeeklySummaryWidgetProps) {
  const storedTrades = loadTradesFromLocalStorage();

  const weeklySummary = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const weekTrades = storedTrades.filter(t => {
      const tradeDate = new Date(t.date || t.iso || new Date());
      return tradeDate >= weekStart;
    });

    const stats = {
      totalTrades: weekTrades.length,
      wins: weekTrades.filter(t => t.result === 'win').length,
      losses: weekTrades.filter(t => t.result === 'loss').length,
      totalPnL: weekTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0),
      winRate: weekTrades.length > 0 ? Math.round((weekTrades.filter(t => t.result === 'win').length / weekTrades.length) * 100) : 0,
    };

    return stats;
  }, [storedTrades]);

  if (size === 'small') {
    return (
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
      >
        {storedTrades.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 shadow-card border border-border/50 text-center">
            <div className="text-2xl mb-2">📅</div>
            <p className="text-xs text-muted-foreground">No trades this week</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-4 text-sm">📅 This Week</h3>
            <div className="text-2xl font-bold text-primary">{weeklySummary.totalTrades}</div>
            <p className="text-xs text-muted-foreground">Trades</p>
          </div>
        )}
      </motion.div>
    );
  }

  if (size === 'medium') {
    return (
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
      >
        {storedTrades.length === 0 ? (
          <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50 text-center">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-foreground mb-2">Weekly Summary</h3>
            <p className="text-sm text-muted-foreground mb-3">No trades logged yet</p>
            <p className="text-xs text-muted-foreground">Data needed: Completed trades with entry/exit times</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">📅 Weekly Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
                <div className="text-xl font-bold text-foreground">{weeklySummary.totalTrades}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                <div className="text-xl font-bold text-green-500">{weeklySummary.winRate}%</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">W/L</div>
                <div className="text-lg font-bold text-foreground">{weeklySummary.wins}/{weeklySummary.losses}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">P&L</div>
                <div className={`text-lg font-bold ${weeklySummary.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${weeklySummary.totalPnL.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Large - Horizontal Layout
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      {storedTrades.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📅</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Weekly Summary</h3>
              <p className="text-sm text-muted-foreground mb-2">Start logging trades to see your weekly performance</p>
              <p className="text-xs text-muted-foreground">Tracks: Total trades, Wins/Losses, Win Rate %, P&L</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-6">📅 Weekly Summary</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
              <div className="text-sm text-muted-foreground mb-2">Total Trades</div>
              <div className="text-3xl font-bold text-blue-500">{weeklySummary.totalTrades}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-transparent rounded-lg border border-green-500/20">
              <div className="text-sm text-muted-foreground mb-2">Wins</div>
              <div className="text-3xl font-bold text-green-500">{weeklySummary.wins}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500/10 to-transparent rounded-lg border border-red-500/20">
              <div className="text-sm text-muted-foreground mb-2">Losses</div>
              <div className="text-3xl font-bold text-red-500">{weeklySummary.losses}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg border border-purple-500/20">
              <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
              <div className="text-3xl font-bold text-purple-500">{weeklySummary.winRate}%</div>
            </div>
            <div className={`p-4 bg-gradient-to-br ${weeklySummary.totalPnL >= 0 ? 'from-emerald-500/10' : 'from-orange-500/10'} to-transparent rounded-lg border ${weeklySummary.totalPnL >= 0 ? 'border-emerald-500/20' : 'border-orange-500/20'}`}>
              <div className="text-sm text-muted-foreground mb-2">P&L</div>
              <div className={`text-3xl font-bold ${weeklySummary.totalPnL >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                ${weeklySummary.totalPnL.toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
