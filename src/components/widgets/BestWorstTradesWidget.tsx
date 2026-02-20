import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

interface BestWorstTradesWidgetProps {
  size: WidgetSize;
}

export function BestWorstTradesWidget({ size }: BestWorstTradesWidgetProps) {
  const storedTrades = loadTradesFromLocalStorage();

  const { bestTrades, worstTrades } = useMemo(() => {
    const sorted = [...storedTrades].sort((a, b) => {
      const aR = typeof a.rMultiple === 'number' ? a.rMultiple : Number(a.rMultiple) || 0;
      const bR = typeof b.rMultiple === 'number' ? b.rMultiple : Number(b.rMultiple) || 0;
      return bR - aR;
    });
    return {
      bestTrades: sorted.slice(0, 3),
      worstTrades: sorted.slice(-3).reverse(),
    };
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
            <div className="text-2xl mb-2">🏆</div>
            <p className="text-xs text-muted-foreground">No trades yet</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-3 text-sm">🏆 Top Trades</h3>
            <div className="space-y-2">
              {bestTrades.slice(0, 2).map((t, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t.instrument}</span>
                  <span className="text-green-500 font-bold">+{(typeof t.rMultiple === 'number' ? t.rMultiple : Number(t.rMultiple) || 0).toFixed(1)}R</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
      {storedTrades.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🏆</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Best & Worst Trades</h3>
              <p className="text-sm text-muted-foreground mb-2">See your highest and lowest R-multiple trades</p>
              <p className="text-xs text-muted-foreground">Data needed: R-multiple values in trades</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">🏆 Best & Worst Trades</h3>
          
          <div className="space-y-4">
            {/* Best Trades */}
            <div>
              <h4 className="text-xs font-semibold text-green-500 mb-2">✓ BEST TRADES</h4>
              <div className="space-y-2">
                {bestTrades.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium text-foreground">{t.instrument}</div>
                      <div className="text-xs text-muted-foreground">{t.strategy}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-500">
                        +{(typeof t.rMultiple === 'number' ? t.rMultiple : Number(t.rMultiple) || 0).toFixed(2)}R
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Worst Trades */}
            <div>
              <h4 className="text-xs font-semibold text-red-500 mb-2">✗ WORST TRADES</h4>
              <div className="space-y-2">
                {worstTrades.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium text-foreground">{t.instrument}</div>
                      <div className="text-xs text-muted-foreground">{t.strategy}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-500">
                        {(typeof t.rMultiple === 'number' ? t.rMultiple : Number(t.rMultiple) || 0).toFixed(2)}R
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
