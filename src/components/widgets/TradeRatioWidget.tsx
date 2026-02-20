import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { loadTradesFromLocalStorage } from '@/lib/tradeLoaders';

interface Props {
  size: 'small' | 'medium' | 'large';
}

export function TradeRatioWidget({ size }: Props) {
  const data = useMemo(() => {
    const trades = loadTradesFromLocalStorage().filter(t => t.status === 'closed');
    
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const breakeven = trades.filter(t => t.result === 'breakeven').length;
    const total = trades.length;
    
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    
    return { wins, losses, breakeven, total, winRate };
  }, []);

  if (size === 'small') {
    // Just win rate percentage
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-col items-center justify-center min-h-[120px]"
      >
        <div className="text-xs text-muted-foreground mb-2">Win Rate</div>
        <div className={`text-3xl font-bold ${data.winRate >= 50 ? 'text-accent-foreground' : 'text-destructive'}`}>
          {data.winRate.toFixed(0)}%
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {data.wins}W / {data.losses}L
        </div>
      </motion.div>
    );
  }

  if (size === 'medium') {
    // W/L/BE breakdown
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Trade Ratio</h3>
          <p className="text-xs text-muted-foreground mt-1">{data.total} total trades</p>
        </div>

        <div className="space-y-2">
          {/* Win rate progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Win Rate</span>
              <span className="text-sm font-bold text-accent-foreground">{data.winRate.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.winRate}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-accent-foreground rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-accent/10 rounded p-2 text-center">
              <div className="text-xs text-muted-foreground">Wins</div>
              <div className="text-lg font-bold text-accent-foreground">{data.wins}</div>
            </div>
            <div className="bg-destructive/10 rounded p-2 text-center">
              <div className="text-xs text-muted-foreground">Losses</div>
              <div className="text-lg font-bold text-destructive">{data.losses}</div>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="text-xs text-muted-foreground">BE</div>
              <div className="text-lg font-bold text-muted-foreground">{data.breakeven}</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Large: Detailed visual breakdown
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-6 shadow-soft border border-border"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Trade Ratio Analysis</h3>
        <p className="text-xs text-muted-foreground mt-1">Win/Loss/Breakeven distribution</p>
      </div>

      {/* Main win rate circle */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 to-accent/5" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-accent-foreground">
              {data.winRate.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Wins</span>
            <span className="text-sm font-bold text-accent-foreground">{data.wins}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.total > 0 ? (data.wins / data.total) * 100 : 0}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-accent-foreground rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Losses</span>
            <span className="text-sm font-bold text-destructive">{data.losses}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.total > 0 ? (data.losses / data.total) * 100 : 0}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-destructive rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Breakeven</span>
            <span className="text-sm font-bold text-muted-foreground">{data.breakeven}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.total > 0 ? (data.breakeven / data.total) * 100 : 0}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-muted-foreground rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border mt-6 pt-4">
        <div className="text-center">
          <span className="text-xs text-muted-foreground">Total Trades: </span>
          <span className="text-sm font-bold text-foreground">{data.total}</span>
        </div>
      </div>
    </motion.div>
  );
}
