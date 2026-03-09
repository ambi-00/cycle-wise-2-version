import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { useStoredTrades } from "@/lib/tradeLoaders";

interface MonthlyStatsWidgetProps {
  size: WidgetSize;
}

export function MonthlyStatsWidget({ size }: MonthlyStatsWidgetProps) {
  const storedTrades = useStoredTrades();

  const { monthlyData, currentMonth } = useMemo(() => {
    const months: Record<string, { trades: number; wins: number; totalR: number; totalPnl: number }> = {};
    
    const now = new Date();
    const currentMonthStr = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    for (const t of storedTrades) {
      const tradeDate = new Date(t.date || t.iso || new Date());
      const monthStr = tradeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!months[monthStr]) {
        months[monthStr] = { trades: 0, wins: 0, totalR: 0, totalPnl: 0 };
      }

      months[monthStr].trades += 1;
      if (t.result === 'win') months[monthStr].wins += 1;
      months[monthStr].totalR += typeof t.rMultiple === 'number' ? t.rMultiple : Number(t.rMultiple) || 0;
      months[monthStr].totalPnl += Number(t.pnl) || 0;
    }

    const sorted = Object.entries(months)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .slice(0, 6);

    return {
      monthlyData: sorted,
      currentMonth: currentMonthStr,
    };
  }, [storedTrades]);

  if (size === 'small') {
    const latest = monthlyData[0];
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
            <div className="text-2xl mb-2">📅</div>
            <div className="text-xs text-muted-foreground">0 trades this month</div>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card text-center">
            <div className="text-xs text-muted-foreground mb-1">{latest?.[0]}</div>
            <div className="text-2xl font-bold mb-1">{latest?.[1].trades || 0}</div>
            <div className="text-xs text-muted-foreground">Trades this month</div>
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
        <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50 text-center">
          <div className="text-3xl mb-3">📅</div>
          <h3 className="font-semibold text-foreground mb-2">Monthly Stats</h3>
          <p className="text-sm text-muted-foreground mb-3">No trades logged yet</p>
          <p className="text-xs text-muted-foreground">Track your monthly performance over time</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">📅 Monthly Stats</h3>
          <div className="space-y-3">
            {monthlyData.map(([month, stats]) => (
              <div key={month} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{month}</div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{stats.trades} trades</div>
                    <div className="text-xs text-muted-foreground">{Math.round((stats.wins / stats.trades) * 100) || 0}% win</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{stats.wins}W / {stats.trades - stats.wins}L</span>
                  <span className={stats.totalR > 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                    {stats.totalR > 0 ? '+' : ''}{stats.totalR.toFixed(1)}R
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
