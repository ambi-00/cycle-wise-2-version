import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { loadTradesFromLocalStorage } from '@/lib/tradeLoaders';

interface Props {
  size: 'small' | 'medium' | 'large';
}

export function InstrumentHeatmapWidget({ size }: Props) {
  const data = useMemo(() => {
    const trades = loadTradesFromLocalStorage().filter(t => t.status === 'closed');
    
    const instMap = new Map<string, { pnl: number; trades: number; wins: number; losses: number }>();
    
    trades.forEach(t => {
      const inst = t.instrument || 'Unknown';
      if (!instMap.has(inst)) {
        instMap.set(inst, { pnl: 0, trades: 0, wins: 0, losses: 0 });
      }
      const stat = instMap.get(inst)!;
      stat.pnl += t.pnl || 0;
      stat.trades++;
      if (t.result === 'win') stat.wins++;
      if (t.result === 'loss') stat.losses++;
    });
    
    const instruments = Array.from(instMap.entries())
      .map(([name, stat]) => ({
        name,
        pnl: stat.pnl,
        trades: stat.trades,
        winRate: (stat.wins / stat.trades) * 100,
        wins: stat.wins,
        losses: stat.losses,
      }))
      .sort((a, b) => b.pnl - a.pnl);
    
    return { instruments };
  }, []);

  if (size === 'small') {
    // Just best instrument
    const best = data.instruments[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-col items-center justify-center min-h-[120px]"
      >
        <BarChart3 className="w-6 h-6 mb-2 text-accent-foreground" />
        <div className="text-xs text-muted-foreground mb-1">Best Instrument</div>
        <div className="text-lg font-bold text-foreground">{best?.name || 'N/A'}</div>
        <div className="text-xs text-accent-foreground font-semibold mt-1">
          ${best?.pnl.toFixed(0) || 0}
        </div>
      </motion.div>
    );
  }

  if (size === 'medium') {
    // Top 5 instruments
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Top Instruments</h3>
        </div>

        <div className="space-y-2">
          {data.instruments.slice(0, 5).map((inst, idx) => (
            <div key={inst.name} className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">{inst.name}</span>
                <span className={`text-sm font-bold ${inst.pnl >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                  ${inst.pnl.toFixed(0)}
                </span>
              </div>
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                <span>{inst.trades} trades</span>
                <span>•</span>
                <span>{inst.winRate.toFixed(0)}% WR</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Large: All instruments with heatmap
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-6 shadow-soft border border-border"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Instrument Performance</h3>
        <p className="text-xs text-muted-foreground mt-1">Which instruments are most profitable?</p>
      </div>

      <div className="space-y-3">
        {data.instruments.map((inst) => {
          const heatIntensity = Math.min(Math.abs(inst.pnl) / 100, 1);
          const bgColor = inst.pnl >= 0 
            ? `rgba(34, 197, 94, ${0.1 + heatIntensity * 0.2})`
            : `rgba(239, 68, 68, ${0.1 + heatIntensity * 0.2})`;
          
          return (
            <div
              key={inst.name}
              className="border border-border rounded-lg p-4"
              style={{ backgroundColor: bgColor }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-foreground text-base">{inst.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{inst.trades} trades total</div>
                </div>
                <div className={`text-2xl font-bold ${inst.pnl >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                  ${inst.pnl.toFixed(0)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">Win Rate</div>
                  <div className="font-bold text-foreground mt-1">{inst.winRate.toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Wins</div>
                  <div className="font-bold text-accent-foreground mt-1">{inst.wins}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Losses</div>
                  <div className="font-bold text-destructive mt-1">{inst.losses}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">P&L/Trade</div>
                  <div className="font-bold text-foreground mt-1">${(inst.pnl / inst.trades).toFixed(0)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
