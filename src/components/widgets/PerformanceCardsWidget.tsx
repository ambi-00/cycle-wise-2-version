import { motion } from "framer-motion";
import { PerformanceCard } from "@/components/PerformanceCard";
import { WidgetSize, getColSpan } from "@/lib/dashboardWidgets";
import { WidgetContainer, WidgetTitle, WidgetContent, WidgetEmptyState } from "./WidgetContainer";
import { useMemo } from "react";
import { useStoredTrades } from "@/lib/tradeLoaders";

interface PerformanceCardsWidgetProps {
  size: WidgetSize;
}

export function PerformanceCardsWidget({ size }: PerformanceCardsWidgetProps) {
  const storedTrades = useStoredTrades();

  const { totalTrades, totalWins, totalPnl, avgR } = useMemo(() => {
    let total = 0;
    let wins = 0;
    let pnl = 0;
    let rSum = 0;

    for (const t of storedTrades) {
      total += 1;
      if (t.result === 'win') wins += 1;
      const r = typeof t.rMultiple === 'number' && t.rMultiple != null ? t.rMultiple : Number(t.rMultiple) || 0;
      const p = Number(t.pnl) || 0;
      rSum += r;
      pnl += p;
    }

    return {
      totalTrades: total,
      totalWins: wins,
      totalPnl: Math.round(pnl),
      avgR: total > 0 ? +(rSum / total).toFixed(2) : 0,
    };
  }, [storedTrades]);

  // Render based on size
  if (size === 'small') {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className={`${getColSpan(size)}`}
      >
        <PerformanceCard title="Monthly P&L" value={totalPnl} change={12.5} type="currency" />
      </motion.div>
    );
  }

  if (size === 'medium') {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className={`${getColSpan(size)}`}
      >
        {totalTrades === 0 ? (
          <WidgetContainer size={size}>
            <WidgetEmptyState
              icon="📊"
              title="Performance Overview"
              description="No trades logged yet"
              dataNeeded="Trade results and P&L values"
            />
          </WidgetContainer>
        ) : (
          <div className="grid gap-4 grid-cols-2">
            <PerformanceCard title="Monthly P&L" value={totalPnl} change={12.5} type="currency" />
            <PerformanceCard title="Win Rate" value={totalTrades ? Math.round((totalWins / totalTrades) * 100) : 0} change={5} type="percentage" icon="percent" />
          </div>
        )}
      </motion.div>
    );
  }

  // Large (default)
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpan(size)}`}
    >
      {totalTrades === 0 ? (
        <WidgetContainer size={size}>
          <WidgetEmptyState
            icon="📊"
            title="Performance Overview"
            description="No trades logged yet"
            dataNeeded="Trade results, P&L values, and R-multiple"
          />
        </WidgetContainer>
      ) : (
        <WidgetContainer size={size}>
          <WidgetTitle size={size}>📊 Performance Overview</WidgetTitle>
          <WidgetContent size={size}>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <PerformanceCard title="Monthly P&L" value={totalPnl} change={12.5} type="currency" />
              <PerformanceCard title="Win Rate" value={totalTrades ? Math.round((totalWins / totalTrades) * 100) : 0} change={5} type="percentage" icon="percent" />
              <PerformanceCard title="Avg R" value={avgR} change={8} type="ratio" icon="target" />
              <PerformanceCard title="Trades" value={totalTrades} type="count" />
            </div>
          </WidgetContent>
        </WidgetContainer>
      )}
    </motion.div>
  );
}
