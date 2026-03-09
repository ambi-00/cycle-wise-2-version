import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
import { useStoredTrades } from '@/lib/tradeLoaders';

interface Props {
  size: 'small' | 'medium' | 'large';
}

export function DrawdownMeterWidget({ size }: Props) {
  const storedTrades = useStoredTrades();
  const data = useMemo(() => {
    const trades = storedTrades
      .filter(t => t.status === 'closed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let peak = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let cumulative = 0;
    
    trades.forEach(t => {
      cumulative += t.pnl || 0;
      if (cumulative > peak) {
        peak = cumulative;
      }
      currentDrawdown = peak - cumulative;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    });
    
    const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
    
    // Risk assessment
    let riskLevel = 'Low';
    let riskColor = 'text-accent-foreground';
    if (maxDrawdownPercent > 30) {
      riskLevel = 'High';
      riskColor = 'text-destructive';
    } else if (maxDrawdownPercent > 20) {
      riskLevel = 'Moderate';
      riskColor = 'text-yellow-600';
    } else if (maxDrawdownPercent > 10) {
      riskLevel = 'Fair';
      riskColor = 'text-yellow-600';
    }
    
    return { maxDrawdown, maxDrawdownPercent, riskLevel, riskColor, peak, currentDrawdown };
  }, [storedTrades]);
  if (size === 'small') {
    // Just max drawdown percentage
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-col items-center justify-center min-h-[120px]"
      >
        <TrendingDown className={`w-6 h-6 mb-2 ${data.riskColor}`} />
        <div className="text-xs text-muted-foreground mb-1">Max Drawdown</div>
        <div className={`text-3xl font-bold ${data.riskColor}`}>{data.maxDrawdownPercent.toFixed(1)}%</div>
      </motion.div>
    );
  }

  if (size === 'medium') {
    // Drawdown with risk level
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Drawdown Metrics</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Max Drawdown</span>
              <span className={`font-bold ${data.riskColor}`}>{data.maxDrawdownPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(data.maxDrawdownPercent, 100)}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${
                  data.riskColor === 'text-accent-foreground' ? 'bg-accent-foreground' :
                  data.riskColor === 'text-yellow-600' ? 'bg-yellow-600' :
                  'bg-destructive'
                }`}
              />
            </div>
          </div>

          <div className={`rounded-lg p-3 ${
            data.riskColor === 'text-accent-foreground' ? 'bg-accent/10' :
            data.riskColor === 'text-yellow-600' ? 'bg-yellow-100/30 dark:bg-yellow-900/20' :
            'bg-destructive/10'
          }`}>
            <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
            <div className={`text-lg font-bold ${data.riskColor}`}>{data.riskLevel}</div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Large: Detailed drawdown analysis
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-6 shadow-soft border border-border"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Drawdown Analysis</h3>
        <p className="text-xs text-muted-foreground mt-1">Peak-to-trough decline from peak equity</p>
      </div>

      <div className={`rounded-xl p-6 mb-6 ${
        data.riskLevel === 'Low' ? 'bg-accent/10' :
        data.riskLevel === 'Fair' || data.riskLevel === 'Moderate' ? 'bg-yellow-100/30 dark:bg-yellow-900/20' :
        'bg-destructive/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Maximum Drawdown</div>
            <div className={`text-4xl font-bold ${data.riskColor}`}>
              {data.maxDrawdownPercent.toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold px-4 py-2 rounded-lg ${
              data.riskColor === 'text-accent-foreground' ? 'bg-accent-foreground/20 text-accent-foreground' :
              data.riskColor === 'text-yellow-600' ? 'bg-yellow-600/20 text-yellow-600' :
              'bg-destructive/20 text-destructive'
            }`}>
              {data.riskLevel}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Peak Equity</span>
            <span className="font-bold text-accent-foreground">${data.peak.toFixed(2)}</span>
          </div>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Absolute Drawdown</span>
            <span className="font-bold text-destructive">${data.maxDrawdown.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4 bg-muted/30 rounded-lg p-3">
        <div className="text-xs text-muted-foreground">
          {data.maxDrawdownPercent > 30 ? '⚠️ High drawdown - Review risk management' :
           data.maxDrawdownPercent > 20 ? '⚠️ Moderate drawdown - Consider position sizing' :
           '✓ Healthy drawdown level'}
        </div>
      </div>
    </motion.div>
  );
}
