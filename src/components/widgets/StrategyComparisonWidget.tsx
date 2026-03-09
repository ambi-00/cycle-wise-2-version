import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useStoredTrades } from '@/lib/tradeLoaders';

interface Props {
  size: 'small' | 'medium' | 'large';
}

export function StrategyComparisonWidget({ size }: Props) {
  const storedTrades = useStoredTrades();
  const data = useMemo(() => {
    const trades = storedTrades.filter(t => t.status === 'closed');
    
    const strategyMap = new Map<string, {
      trades: number;
      wins: number;
      losses: number;
      pnl: number;
      avgR: number;
    }>();
    
    trades.forEach(t => {
      const strategy = t.strategy || 'Quick Trade';
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, { trades: 0, wins: 0, losses: 0, pnl: 0, avgR: 0 });
      }
      const stat = strategyMap.get(strategy)!;
      stat.trades++;
      if (t.result === 'win') stat.wins++;
      if (t.result === 'loss') stat.losses++;
      stat.pnl += t.pnl || 0;
      stat.avgR += t.rMultiple || 0;
    });
    
    const strategies = Array.from(strategyMap.entries())
      .map(([name, stat]) => ({
        name,
        trades: stat.trades,
        winRate: stat.trades > 0 ? (stat.wins / stat.trades) * 100 : 0,
        pnl: stat.pnl,
        avgR: stat.trades > 0 ? stat.avgR / stat.trades : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);
    
    return { strategies };
  }, [storedTrades]);

  if (size === 'small') {
    // Best strategy only
    const bestStrategy = data.strategies[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-col items-center justify-center min-h-[120px]"
      >
        <BarChart3 className="w-6 h-6 mb-2 text-accent-foreground" />
        <div className="text-xs text-muted-foreground mb-1">Best Strategy</div>
        <div className="text-lg font-bold text-foreground text-center truncate max-w-[80px]">
          {bestStrategy?.name || 'None'}
        </div>
        <div className="text-xs text-accent-foreground font-semibold mt-1">
          ${bestStrategy?.pnl.toFixed(0) || 0}
        </div>
      </motion.div>
    );
  }

  if (size === 'medium') {
    // Top 3 strategies
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Top Strategies</h3>
        </div>

        <div className="space-y-2">
          {data.strategies.slice(0, 3).map((strat, idx) => (
            <div key={strat.name} className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">{idx + 1}. {strat.name}</span>
                <span className={`text-sm font-bold ${strat.pnl >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                  ${strat.pnl.toFixed(0)}
                </span>
              </div>
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                <span>{strat.trades} trades</span>
                <span>•</span>
                <span>{strat.winRate.toFixed(0)}% WR</span>
                <span>•</span>
                <span>{strat.avgR.toFixed(2)}R avg</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Large: All strategies with details
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-6 shadow-soft border border-border"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Strategy Performance</h3>
        <p className="text-xs text-muted-foreground mt-1">Compare all trading strategies</p>
      </div>

      <div className="space-y-3">
        {data.strategies.map((strat, idx) => (
          <div key={strat.name} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-foreground">#{idx + 1} {strat.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{strat.trades} trades</div>
              </div>
              <div className={`text-2xl font-bold ${strat.pnl >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                ${strat.pnl.toFixed(0)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="text-muted-foreground">Win Rate</div>
                <div className="font-bold text-foreground mt-1">{strat.winRate.toFixed(0)}%</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="text-muted-foreground">Avg R</div>
                <div className="font-bold text-foreground mt-1">{strat.avgR.toFixed(2)}R</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="text-muted-foreground">P&L/Trade</div>
                <div className="font-bold text-foreground mt-1">${(strat.pnl / strat.trades).toFixed(0)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
