import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

interface TradeFrequencyWidgetProps {
  size: WidgetSize;
}

export function TradeFrequencyWidget({ size }: TradeFrequencyWidgetProps) {
  const storedTrades = loadTradesFromLocalStorage();

  const { frequency, avgPerDay, maxDay } = useMemo(() => {
    const dayMap: Record<number, number> = {};

    for (const t of storedTrades) {
      const tradeDate = new Date(t.date || t.iso || new Date());
      const dayOfWeek = tradeDate.getDay();
      dayMap[dayOfWeek] = (dayMap[dayOfWeek] || 0) + 1;
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const frequency = days.map((name, idx) => ({
      name,
      trades: dayMap[idx] || 0,
      percentage: storedTrades.length > 0 ? Math.round(((dayMap[idx] || 0) / storedTrades.length) * 100) : 0,
    }));

    const avgPerDay = storedTrades.length > 0 ? (storedTrades.length / 7).toFixed(1) : '0';
    const maxDay = frequency.reduce((a, b) => a.trades > b.trades ? a : b, frequency[0]);

    return { frequency, avgPerDay, maxDay };
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
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-3 text-sm">📊 Trading Days</h3>
          <div className="text-center mb-3">
            <div className="text-2xl font-bold text-primary">{maxDay.name}</div>
            <div className="text-xs text-muted-foreground">{maxDay.trades} trades</div>
          </div>
          <div className="text-xs text-muted-foreground text-center">Avg: {avgPerDay}/day</div>
        </div>
      </motion.div>
    );
  }

  const maxTrades = Math.max(...frequency.map(d => d.trades), 1);

  if (storedTrades.length === 0) {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
      >
        <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50 text-center">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-semibold text-foreground mb-2">Trading Frequency</h3>
          <p className="text-sm text-muted-foreground mb-3">No trades logged yet</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Track trading patterns across days of the week once you start logging trades</p>
            <p className="font-semibold text-foreground">Data needed: Trade date & time</p>
          </div>
        </div>
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
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="font-semibold text-foreground mb-4">📊 Trading Frequency by Day</h3>
        <div className="space-y-3">
          {frequency.map((day) => (
            <div key={day.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{day.name}</span>
                <span className="text-sm font-bold text-primary">{day.trades}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${maxTrades > 0 ? (day.trades / maxTrades) * 100 : 0}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{day.percentage}% of trades</div>
            </div>
          ))}
          <div className="border-t border-border pt-3 mt-3 text-center">
            <div className="text-xs text-muted-foreground">Average per day</div>
            <div className="text-xl font-bold text-primary">{avgPerDay}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
