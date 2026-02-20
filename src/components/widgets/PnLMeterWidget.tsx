import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { loadTradesFromLocalStorage } from '@/lib/tradeLoaders';
import { 
  getWidgetHeightClass,
  getWidgetFlexClass,
  getWidgetLabelClass,
  getWidgetValueClass,
  getWidgetDescriptionClass,
  WIDGET_SIZES,
} from '@/lib/widgetSizing';

interface Props {
  size: 'small' | 'medium' | 'large';
}

export function PnLMeterWidget({ size }: Props) {
  const data = useMemo(() => {
    const trades = loadTradesFromLocalStorage().filter(t => t.status === 'closed');
    
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = trades.filter(t => t.result === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0);
    const losses = trades.filter(t => t.result === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    // Daily PnL
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    // Weekly (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().split('T')[0];
    const weekTrades = trades.filter(t => t.date && t.date >= weekStart);
    const weekPnL = weekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    // Monthly
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTrades = trades.filter(t => t.date && t.date.startsWith(currentMonth));
    const monthPnL = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    return { totalPnL, wins, losses, todayPnL, weekPnL, monthPnL, trades: trades.length };
  }, []);

  const formatCurrency = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}$${num.toFixed(0)}`;
  };

  const getColor = (value: number) => {
    return value >= 0 ? 'text-accent-foreground' : 'text-destructive';
  };

  if (size === 'small') {
    // Just total P&L in a card - Apple style
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl shadow-card border border-border flex flex-col items-center justify-center p-3 h-full"
      >
        <div className={getWidgetLabelClass(size)}>Total P&L</div>
        <motion.div 
          className={`${getWidgetValueClass(size)} ${getColor(data.totalPnL)} my-1.5`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          {formatCurrency(data.totalPnL)}
        </motion.div>
        <div className={getWidgetDescriptionClass(size)}>
          {data.trades} trades
        </div>
      </motion.div>
    );
  }

  if (size === 'medium') {
    // Today, Week, Month comparison - Apple style
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl shadow-card border border-border p-4 h-full flex flex-col"
      >
        <div className="mb-3">
          <h3 className={getWidgetLabelClass(size)}>P&L Overview</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className={getWidgetDescriptionClass(size)}>Today</span>
            <span className={`font-bold text-lg ${getColor(data.todayPnL)}`}>
              {formatCurrency(data.todayPnL)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={getWidgetDescriptionClass(size)}>This Week</span>
            <span className={`font-bold text-lg ${getColor(data.weekPnL)}`}>
              {formatCurrency(data.weekPnL)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={getWidgetDescriptionClass(size)}>This Month</span>
            <span className={`font-bold text-lg ${getColor(data.monthPnL)}`}>
              {formatCurrency(data.monthPnL)}
            </span>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className={`text-lg font-bold ${getColor(data.totalPnL)}`}>
              {formatCurrency(data.totalPnL)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Large: Detailed breakdown with Apple-style grid
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl shadow-card border border-border p-5 h-full flex flex-col"
    >
      <div className="mb-4">
        <h3 className={getWidgetLabelClass(size)}>Profit & Loss Analysis</h3>
        <p className={`${getWidgetDescriptionClass(size)} mt-0.5`}>Across all timeframes</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
        <div className="bg-accent/10 rounded-lg p-3 flex flex-col justify-center">
          <div className={getWidgetDescriptionClass(size)}>Today</div>
          <div className={`${getWidgetValueClass(size)} leading-tight ${getColor(data.todayPnL)}`}>
            {formatCurrency(data.todayPnL)}
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 flex flex-col justify-center">
          <div className={getWidgetDescriptionClass(size)}>This Week</div>
          <div className={`${getWidgetValueClass(size)} leading-tight ${getColor(data.weekPnL)}`}>
            {formatCurrency(data.weekPnL)}
          </div>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between p-2.5 bg-accent/10 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-foreground" />
            <span className={getWidgetDescriptionClass(size)}>Winning Trades</span>
          </div>
          <span className="font-bold text-accent-foreground text-lg">{formatCurrency(data.wins)}</span>
        </div>
        <div className="flex items-center justify-between p-2.5 bg-destructive/10 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className={getWidgetDescriptionClass(size)}>Losing Trades</span>
          </div>
          <span className="font-bold text-destructive text-lg">{formatCurrency(data.losses)}</span>
        </div>
      </div>

      <div className="border-t border-border pt-3 mt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Total P&L (Month)</span>
          <span className={`text-2xl font-bold ${getColor(data.monthPnL)}`}>
            {formatCurrency(data.monthPnL)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
