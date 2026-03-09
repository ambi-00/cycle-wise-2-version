import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { useStoredTrades } from "@/lib/tradeLoaders";

interface CyclePhasePerformanceWidgetProps {
  size: WidgetSize;
}

export function CyclePhasePerformanceWidget({ size }: CyclePhasePerformanceWidgetProps) {
  const storedTrades = useStoredTrades();

  const { phaseStats } = useMemo(() => {
    const phases: Record<string, { count: number; wins: number; totalR: number }> = {
      menstruation: { count: 0, wins: 0, totalR: 0 },
      follicular: { count: 0, wins: 0, totalR: 0 },
      ovulation: { count: 0, wins: 0, totalR: 0 },
      luteal: { count: 0, wins: 0, totalR: 0 },
    };

    for (const t of storedTrades) {
      const phase = (t.cyclePhase || t.phase || 'unknown').toLowerCase();
      if (phase in phases) {
        phases[phase].count += 1;
        if (t.result === 'win') phases[phase].wins += 1;
        phases[phase].totalR += typeof t.rMultiple === 'number' ? t.rMultiple : Number(t.rMultiple) || 0;
      }
    }

    return {
      phaseStats: Object.entries(phases).map(([name, stats]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        icon: name === 'menstruation' ? '🩸' : name === 'follicular' ? '📈' : name === 'ovulation' ? '🔥' : '🌙',
        ...stats,
        winRate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
      })),
    };
  }, [storedTrades]);

  const phaseIcons: Record<string, string> = {
    'Menstruation': '🩸',
    'Follicular': '📈',
    'Ovulation': '🔥',
    'Luteal': '🌙',
  };

  if (size === 'small') {
    const bestPhase = phaseStats.reduce((a, b) => a.totalR > b.totalR ? a : b, phaseStats[0]);
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
            <div className="text-2xl mb-2">🔄</div>
            <p className="text-xs text-muted-foreground">No data</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card text-center">
            <div className="text-sm text-muted-foreground mb-1">Best Phase</div>
            <div className="text-2xl font-bold mb-1">{bestPhase?.icon} {bestPhase?.name}</div>
            <div className="text-xs text-green-500">{bestPhase?.totalR.toFixed(1)}R total</div>
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
            <div className="text-4xl">🔄</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Cycle Phase Performance</h3>
              <p className="text-sm text-muted-foreground mb-2">See how your trading performs across cycle phases</p>
              <p className="text-xs text-muted-foreground">Data needed: Cycle phase in your trade logs</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">🔄 Cycle Phase Performance</h3>
          <div className="space-y-3">
            {phaseStats.map((phase) => (
              <div key={phase.name} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">
                    <span className="text-lg mr-2">{phase.icon}</span>
                    {phase.name}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{phase.winRate}%</div>
                    <div className="text-xs text-muted-foreground">{phase.count} trades</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{phase.wins}W / {phase.count - phase.wins}L</span>
                  <span className={phase.totalR > 0 ? 'text-green-500' : 'text-red-500'}>
                    {phase.totalR > 0 ? '+' : ''}{phase.totalR.toFixed(1)}R
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
