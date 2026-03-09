import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp } from 'lucide-react';
import { useStoredTrades } from '@/lib/tradeLoaders';

interface Props {
  size: 'small' | 'medium' | 'large';
}

export function BestWorstDaysWidget({ size }: Props) {
  const storedTrades = useStoredTrades();
  const data = useMemo(() => {
    const trades = storedTrades.filter(t => t.status === 'closed');
    
    const dayMap = new Map<string, { pnl: number; trades: number; wins: number }>();
    
    trades.forEach(t => {
      const date = t.date;
      if (!dayMap.has(date)) {
        dayMap.set(date, { pnl: 0, trades: 0, wins: 0 });
      }
      const stat = dayMap.get(date)!;
      stat.pnl += t.pnl || 0;
      stat.trades++;
      if (t.result === 'win') stat.wins++;
    });
    
    const days = Array.from(dayMap.entries())
      .map(([date, stat]) => ({
        date,
        pnl: stat.pnl,
        trades: stat.trades,
        winRate: (stat.wins / stat.trades) * 100,
      }))
      .sort((a, b) => b.pnl - a.pnl);
    
    const bestDays = days.slice(0, 3);
    const worstDays = days.slice(-3).reverse();
    
    return { bestDays, worstDays };
  }, [storedTrades]);

  if (size === 'small') {
    // Just best day
    const best = data.bestDays[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-col items-center justify-center min-h-[120px]"
      >
        <TrendingUp className="w-6 h-6 mb-2 text-accent-foreground" />
        <div className="text-xs text-muted-foreground mb-1">Best Day</div>
        <div className="text-3xl font-bold text-accent-foreground">${best?.pnl.toFixed(0) || 0}</div>
        {best && (
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(best.date).toLocaleDateString()}
          </div>
        )}
      </motion.div>
    );
  }

  if (size === 'medium') {
    // Best and worst days
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Best vs Worst Days</h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Best Day</div>
            {data.bestDays[0] && (
              <div className="bg-accent/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {new Date(data.bestDays[0].date).toLocaleDateString()}
                  </span>
                  <span className="text-lg font-bold text-accent-foreground">
                    +${data.bestDays[0].pnl.toFixed(0)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {data.bestDays[0].trades} trades, {data.bestDays[0].winRate.toFixed(0)}% WR
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2">Worst Day</div>
            {data.worstDays[0] && (
              <div className="bg-destructive/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {new Date(data.worstDays[0].date).toLocaleDateString()}
                  </span>
                  <span className="text-lg font-bold text-destructive">
                    ${data.worstDays[0].pnl.toFixed(0)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {data.worstDays[0].trades} trades, {data.worstDays[0].winRate.toFixed(0)}% WR
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Large: Top 3 best and worst
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-6 shadow-soft border border-border"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Day Performance Analysis</h3>
        <p className="text-xs text-muted-foreground mt-1">Best and worst trading days</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-semibold text-accent-foreground mb-3">🏆 Best Days</div>
          <div className="space-y-2">
            {data.bestDays.map((day, idx) => (
              <div key={day.date} className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">#{idx + 1}</span>
                  <span className="font-bold text-accent-foreground">${day.pnl.toFixed(0)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {day.trades}T • {day.winRate.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-destructive mb-3">📉 Worst Days</div>
          <div className="space-y-2">
            {data.worstDays.map((day, idx) => (
              <div key={day.date} className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">#{idx + 1}</span>
                  <span className="font-bold text-destructive">${day.pnl.toFixed(0)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {day.trades}T • {day.winRate.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
