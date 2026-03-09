import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { getWidgetHeightClass } from "@/lib/widgetSizing";
import { useMemo } from "react";
import { useStoredTrades } from "@/lib/tradeLoaders";

const AIInsightCard = lazy(() => import("@/components/AIInsightCard").then((m) => ({ default: m.AIInsightCard })));

interface AIInsightWidgetProps {
  size: WidgetSize;
}

export function AIInsightWidget({ size }: AIInsightWidgetProps) {
  const storedTrades = useStoredTrades();

  const { strategySummary } = useMemo(() => {
    const map: Record<string, { count: number; wins: number; totalR: number; pnl: number }> = {};
    for (const t of storedTrades) {
      const name = t.strategy || 'Unknown';
      if (!map[name]) map[name] = { count: 0, wins: 0, totalR: 0, pnl: 0 };
      map[name].count += 1;
      if (t.result === 'win') map[name].wins += 1;
    }
    const summary = Object.keys(map).map((k) => ({ name: k, ...map[k] })).sort((a, b) => b.count - a.count);
    return { strategySummary: summary };
  }, [storedTrades]);

  const insight =
    strategySummary && strategySummary.length > 0
      ? strategySummary
          .slice(0, 3)
          .map((s: any) => `${s.name}: ${Math.round((s.wins / s.count) * 100) || 0}% (${s.count})`)
          .join(" • ")
      : "Your win rate increases by 42% when you trade during your Follicular phase with volume confirmation. Consider adding this to your checklist.";

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
          <div className="flex gap-4">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">AI Insights</h3>
              <p className="text-sm text-muted-foreground">Get personalized trading insights powered by AI analysis</p>
            </div>
          </div>
        </div>
      ) : (
        <Suspense fallback={<div className="rounded-2xl bg-card p-5 shadow-card h-24" />}>
          <AIInsightCard
            insight={insight}
            category="pattern"
            actionLabel="View Full Analysis"
          />
        </Suspense>
      )}
    </motion.div>
  );
}
