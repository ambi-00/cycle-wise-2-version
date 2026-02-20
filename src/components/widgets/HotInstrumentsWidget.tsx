import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

interface HotInstrumentsWidgetProps {
  size: WidgetSize;
}

export function HotInstrumentsWidget({ size }: HotInstrumentsWidgetProps) {
  const storedTrades = loadTradesFromLocalStorage();

  const { instruments } = useMemo(() => {
    const map: Record<string, { count: number; wins: number; winRate: number }> = {};
    for (const t of storedTrades) {
      const name = t.instrument || 'Unknown';
      if (!map[name]) map[name] = { count: 0, wins: 0, winRate: 0 };
      map[name].count += 1;
      if (t.result === 'win') map[name].wins += 1;
    }
    const list = Object.keys(map)
      .map((k) => ({
        name: k,
        count: map[k].count,
        wins: map[k].wins,
        winRate: map[k].count > 0 ? Math.round((map[k].wins / map[k].count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return { instruments: list };
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
            <div className="text-2xl mb-2">🔥</div>
            <p className="text-xs text-muted-foreground">No trades yet</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-3 text-sm">🔥 Hot Instruments</h3>
            {instruments.length > 0 ? (
              <div className="space-y-2">
                {instruments.slice(0, 3).map((inst) => (
                  <div key={inst.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{inst.name}</span>
                    <span className={inst.winRate >= 50 ? 'text-green-500' : 'text-red-500'}>
                      {inst.winRate}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No trades yet</p>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // Medium and Large
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
            <div className="text-4xl">🔥</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Hot Instruments</h3>
              <p className="text-sm text-muted-foreground mb-2">Discover your most profitable trading pairs</p>
              <p className="text-xs text-muted-foreground">Data needed: Instrument/symbol in your trades</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">🔥 Hot Instruments</h3>
          <div className="space-y-3">
            {instruments.slice(0, size === 'medium' ? 5 : 10).map((inst) => (
              <div key={inst.name} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{inst.name}</div>
                  <div className="text-xs text-muted-foreground">{inst.count} trades</div>
                </div>
                <div className={`font-semibold ${inst.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                  {inst.winRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
