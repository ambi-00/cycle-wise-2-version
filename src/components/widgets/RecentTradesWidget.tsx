import { motion } from "framer-motion";
import { lazy, Suspense, useState } from "react";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { getWidgetHeightClass, getWidgetDescriptionClass, getWidgetValueClass } from "@/lib/widgetSizing";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

const RecentTradesTable = lazy(() => import("@/components/RecentTradesTable").then((m) => ({ default: m.RecentTradesTable })));

const mockTrades = [
  { id: "1", date: "Jan 24", instrument: "EUR/USD", direction: "long" as const, result: "win" as const, rMultiple: 2.1, strategy: "ICT", cyclePhase: "Follicular" },
  { id: "2", date: "Jan 23", instrument: "GBP/JPY", direction: "short" as const, result: "loss" as const, rMultiple: -1, strategy: "SMC", cyclePhase: "Follicular" },
  { id: "3", date: "Jan 22", instrument: "NAS100", direction: "long" as const, result: "win" as const, rMultiple: 1.5, strategy: "ICT", cyclePhase: "Ovulation" },
];

interface RecentTradesWidgetProps {
  size: WidgetSize;
}

export function RecentTradesWidget({ size }: RecentTradesWidgetProps) {
  const [storedTrades, setStoredTrades] = useState<any[]>(() => loadTradesFromLocalStorage());

  const mapTrade = (t: any) => ({
    id: t.id || String(t.createdAt || Date.now()),
    date: t.date || t.iso || "Unknown",
    instrument: t.instrument || "Unknown",
    direction: (t.direction === "short" ? "short" : "long") as "long" | "short",
    result: (t.result === "win" || t.result === "loss" || t.result === "breakeven" ? t.result : "breakeven") as
      | "win"
      | "loss"
      | "breakeven",
    rMultiple: typeof t.rMultiple === "number" && t.rMultiple != null ? t.rMultiple : Number(t.rMultiple) || 0,
    strategy: t.strategy || "",
    cyclePhase: t.cyclePhase || t.phase || "",
  });

  const displayed = (storedTrades || []).map(mapTrade);
  const trades = displayed.length > 0 ? displayed : mockTrades;

  // For small size, show just top 3 with limited info
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
          <div className={`${getWidgetHeightClass(size)} rounded-2xl bg-card p-4 shadow-card border border-border/50 flex flex-col justify-center text-center`}>
            <div className="text-2xl mb-2">📝</div>
            <p className="text-xs text-muted-foreground">No trades yet</p>
          </div>
        ) : (
          <div className={`${getWidgetHeightClass(size)} rounded-2xl bg-card p-4 shadow-card border border-border flex flex-col`}>
            <h3 className="font-semibold text-foreground mb-3">Recent Trades</h3>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {trades.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={t.result === 'win' ? 'text-green-500' : t.result === 'loss' ? 'text-red-500' : 'text-gray-500'}>
                      {t.result === 'win' ? '✓' : t.result === 'loss' ? '✗' : '−'}
                    </span>
                    <span className="text-muted-foreground truncate">{t.instrument}</span>
                  </div>
                  <span className="font-medium ml-2">{t.rMultiple > 0 ? '+' : ''}{t.rMultiple.toFixed(1)}R</span>
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
        <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50 text-center">
          <div className="text-3xl mb-3">📝</div>
          <h3 className="font-semibold text-foreground mb-2">Recent Trades</h3>
          <p className="text-sm text-muted-foreground mb-3">No trades logged yet</p>
          <p className="text-xs text-muted-foreground">Log trades to track and analyze your trading activity</p>
        </div>
      ) : (
        <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card" />}>
          <RecentTradesTable
            trades={trades}
            onDelete={(tradeId) => setStoredTrades(prev => prev.filter(t => (t.id || String(t.createdAt || Date.now())) !== tradeId))}
          />
        </Suspense>
      )}
    </motion.div>
  );
}
