import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { useStoredTrades } from "@/lib/tradeLoaders";

interface TradingPerformanceComparisonWidgetProps {
  size: WidgetSize;
}

export function TradingPerformanceComparisonWidget({ size }: TradingPerformanceComparisonWidgetProps) {
  const storedTrades = useStoredTrades();

  const comparison = useMemo(() => {
    const today = new Date();
    
    // This week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekTrades = storedTrades.filter(t => {
      const tradeDate = new Date(t.date || t.iso || new Date());
      return tradeDate >= weekStart;
    });
    
    // This month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTrades = storedTrades.filter(t => {
      const tradeDate = new Date(t.date || t.iso || new Date());
      return tradeDate >= monthStart;
    });
    
    // All time
    const totalTrades = storedTrades;

    const stats = (trades: any[]) => ({
      count: trades.length,
      wins: trades.filter(t => t.result === 'win').length,
      winRate: trades.length > 0 ? Math.round((trades.filter(t => t.result === 'win').length / trades.length) * 100) : 0,
      pnl: trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0),
      avgR: trades.length > 0 ? +(trades.reduce((sum, t) => sum + (typeof t.rMultiple === 'number' ? t.rMultiple : Number(t.rMultiple) || 0), 0) / trades.length).toFixed(2) : 0,
    });

    return {
      week: stats(weekTrades),
      month: stats(monthTrades),
      allTime: stats(totalTrades),
    };
  }, [storedTrades]);

  if (size === 'small') {
    return (
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
      >
        {storedTrades.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 shadow-card border border-border/50 text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xs text-muted-foreground">No trades this month</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-3 text-sm">📊 This Month</h3>
            <div className="text-2xl font-bold text-primary">{comparison.month.count}</div>
            <p className="text-xs text-muted-foreground">Trades • {comparison.month.winRate}% WR</p>
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
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-foreground mb-2">Performance Over Time</h3>
            <p className="text-sm text-muted-foreground mb-3">No trades logged yet</p>
            <p className="text-xs text-muted-foreground">Data needed: Completed trades with entry/exit dates</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">📊 Performance Over Time</h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">This Week</div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">{comparison.week.count} trades</span>
                  <span className="text-green-500 text-sm font-semibold">{comparison.week.winRate}%</span>
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">This Month</div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">{comparison.month.count} trades</span>
                  <span className="text-green-500 text-sm font-semibold">{comparison.month.winRate}%</span>
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">All Time</div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">{comparison.allTime.count} trades</span>
                  <span className="text-green-500 text-sm font-semibold">{comparison.allTime.winRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Large - Horizontal Comparison
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      {storedTrades.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Performance Comparison</h3>
              <p className="text-sm text-muted-foreground mb-2">Track your trading performance across different timeframes</p>
              <p className="text-xs text-muted-foreground">Compares: Weekly vs Monthly vs All-Time performance metrics</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-6">📊 Performance Comparison</h3>
          <div className="grid grid-cols-3 gap-6">
            {/* This Week */}
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm text-muted-foreground mb-3 font-semibold">THIS WEEK</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Trades</div>
                  <div className="text-2xl font-bold text-blue-500">{comparison.week.count}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="text-xl font-bold text-foreground">{comparison.week.winRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">P&L</div>
                  <div className={`text-lg font-bold ${comparison.week.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${comparison.week.pnl.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-sm text-muted-foreground mb-3 font-semibold">THIS MONTH</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Trades</div>
                  <div className="text-2xl font-bold text-purple-500">{comparison.month.count}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="text-xl font-bold text-foreground">{comparison.month.winRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">P&L</div>
                  <div className={`text-lg font-bold ${comparison.month.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${comparison.month.pnl.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* All Time */}
            <div className="border-l-4 border-emerald-500 pl-4">
              <div className="text-sm text-muted-foreground mb-3 font-semibold">ALL TIME</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Trades</div>
                  <div className="text-2xl font-bold text-emerald-500">{comparison.allTime.count}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="text-xl font-bold text-foreground">{comparison.allTime.winRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Avg R</div>
                  <div className="text-lg font-bold text-foreground">{comparison.allTime.avgR}R</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
