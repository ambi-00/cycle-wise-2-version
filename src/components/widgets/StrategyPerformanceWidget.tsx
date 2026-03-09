import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { useStoredTrades } from "@/lib/tradeLoaders";

interface StrategyPerformanceWidgetProps {
  size: WidgetSize;
}

export function StrategyPerformanceWidget({ size }: StrategyPerformanceWidgetProps) {
  const storedTrades = useStoredTrades();

  const { strategySummary } = useMemo(() => {
    const map: Record<string, { count: number; wins: number; losses: number; totalR: number; pnl: number }> = {};
    for (const t of storedTrades) {
      const name = t.strategy || 'Unknown';
      if (!map[name]) map[name] = { count: 0, wins: 0, losses: 0, totalR: 0, pnl: 0 };
      map[name].count += 1;
      if (t.result === 'win') map[name].wins += 1;
      if (t.result === 'loss') map[name].losses += 1;
      map[name].totalR += typeof t.rMultiple === 'number' ? t.rMultiple : Number(t.rMultiple) || 0;
      map[name].pnl += Number(t.pnl) || 0;
    }
    const summary = Object.keys(map)
      .map((k) => ({ name: k, ...map[k], winRate: map[k].count > 0 ? Math.round((map[k].wins / map[k].count) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
    return { strategySummary: summary };
  }, [storedTrades]);

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
            <div className="text-2xl mb-2">📋</div>
            <p className="text-xs text-muted-foreground">No strategies yet</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Top Strategy</h3>
            {strategySummary.length > 0 ? (
              <div className="space-y-2">
                <div className="text-lg font-bold text-primary">{strategySummary[0].name}</div>
                <div className="text-sm text-muted-foreground">{strategySummary[0].winRate}% Win Rate</div>
                <div className="text-xs text-muted-foreground">{strategySummary[0].count} trades</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No strategies yet</p>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  if (size === 'medium') {
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
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-foreground mb-2">Strategy Performance</h3>
            <p className="text-sm text-muted-foreground mb-3">No trades logged yet</p>
            <p className="text-xs text-muted-foreground">Data needed: Strategy name in trade logs</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Strategy Performance</h3>
            <div className="space-y-3">
              {strategySummary.slice(0, 4).map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.count} trades</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${s.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                      {s.winRate}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Large
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
            <div className="text-4xl">📋</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Strategy Performance</h3>
              <p className="text-sm text-muted-foreground mb-2">Compare your trading strategies side-by-side</p>
              <p className="text-xs text-muted-foreground">Shows: Win Rate, Trades, Wins/Losses, R-multiple</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Strategy Performance</h3>
          <div className="space-y-3">
            {strategySummary.map((s) => (
              <div key={s.name} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{s.name}</div>
                  <div className={`font-semibold ${s.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                    {s.winRate}%
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{s.wins}W</span>
                  <span>{s.losses}L</span>
                  <span>{s.count} total</span>
                  <span>R: {s.totalR.toFixed(1)}</span>
                </div>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${s.winRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
