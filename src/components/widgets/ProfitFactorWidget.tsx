import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, AlertCircle } from 'lucide-react';
import { loadTradesFromLocalStorage } from '@/lib/tradeLoaders';

interface Props {
  size: 'small' | 'medium' | 'large';
}

export function ProfitFactorWidget({ size }: Props) {
  const data = useMemo(() => {
    const trades = loadTradesFromLocalStorage().filter(t => t.status === 'closed');
    
    const wins = trades.filter(t => t.result === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0);
    const losses = Math.abs(trades.filter(t => t.result === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    const profitFactor = losses > 0 ? wins / losses : wins > 0 ? 999 : 0;
    
    // Expect factor rating
    let quality = 'Poor';
    let color = 'text-destructive';
    if (profitFactor >= 3) {
      quality = 'Excellent';
      color = 'text-accent-foreground';
    } else if (profitFactor >= 2) {
      quality = 'Very Good';
      color = 'text-accent-foreground';
    } else if (profitFactor >= 1.5) {
      quality = 'Good';
      color = 'text-yellow-600';
    } else if (profitFactor >= 1) {
      quality = 'Fair';
      color = 'text-yellow-600';
    }
    
    return { profitFactor, wins, losses, quality, color };
  }, []);

  if (size === 'small') {
    // Just profit factor
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-col items-center justify-center min-h-[120px]"
      >
        <Award className={`w-6 h-6 mb-2 ${data.color}`} />
        <div className="text-xs text-muted-foreground mb-1">Profit Factor</div>
        <div className={`text-3xl font-bold ${data.color}`}>
          {data.profitFactor === 999 ? '∞' : data.profitFactor.toFixed(2)}
        </div>
      </motion.div>
    );
  }

  if (size === 'medium') {
    // Factor with quality rating
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Profit Factor</h3>
          <p className="text-xs text-muted-foreground mt-1">Win/Loss ratio</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-foreground">
              {data.profitFactor === 999 ? '∞' : data.profitFactor.toFixed(2)}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${data.color} ${
              data.color === 'text-accent-foreground' ? 'bg-accent/20' :
              data.color === 'text-yellow-600' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              'bg-destructive/20'
            }`}>
              {data.quality}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-accent/10 rounded p-2 text-center">
              <div className="text-muted-foreground">Gross Wins</div>
              <div className="font-bold text-accent-foreground">${data.wins.toFixed(0)}</div>
            </div>
            <div className="bg-destructive/10 rounded p-2 text-center">
              <div className="text-muted-foreground">Gross Losses</div>
              <div className="font-bold text-destructive">${data.losses.toFixed(0)}</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Large: Detailed analysis
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-6 shadow-soft border border-border"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Profit Factor Analysis</h3>
        <p className="text-xs text-muted-foreground mt-1">Gross profit divided by gross loss</p>
      </div>

      <div className={`rounded-xl p-6 mb-6 ${
        data.quality === 'Excellent' ? 'bg-accent/10' :
        data.quality === 'Very Good' ? 'bg-accent/10' :
        data.quality === 'Good' ? 'bg-yellow-100/30 dark:bg-yellow-900/20' :
        'bg-destructive/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Profit Factor</div>
            <div className={`text-4xl font-bold ${data.color}`}>
              {data.profitFactor === 999 ? '∞' : data.profitFactor.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold ${data.color} px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20`}>
              {data.quality}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Gross Profit</span>
            </div>
            <span className="font-bold text-accent-foreground">${data.wins.toFixed(2)}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Gross Loss</span>
            </div>
            <span className="font-bold text-destructive">${data.losses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4 bg-muted/30 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            {data.profitFactor >= 2 ? 'Strong performance! Maintain current strategy.' :
             data.profitFactor >= 1 ? 'Profitable, but room for improvement.' :
             'Focus on reducing losses or improving win rate.'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
