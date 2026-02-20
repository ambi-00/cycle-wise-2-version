import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

interface DisciplineMeterWidgetProps {
  size: WidgetSize;
}

export function DisciplineMeterWidget({ size }: DisciplineMeterWidgetProps) {
  const storedTrades = loadTradesFromLocalStorage();

  const { disciplineScore } = useMemo(() => {
    // Calculate discipline based on: consistent strategy usage, trade journal entries, risk management
    let score = 50; // baseline
    
    // Bonus for using same strategy consistently
    const strategies = new Set(storedTrades.map(t => t.strategy));
    if (strategies.size > 0) score += Math.min(20, strategies.size * 5);
    
    // Bonus for recent activity
    const today = new Date();
    const recentTrades = storedTrades.filter(t => {
      if (!t.date && !t.iso) return false;
      const tradeDate = new Date(t.date || t.iso);
      return (today.getTime() - tradeDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
    });
    if (recentTrades.length > 0) score += 15;
    
    // Check for consistent RR
    const hasConsistentRR = storedTrades.every(t => t.rMultiple !== null && t.rMultiple !== undefined);
    if (hasConsistentRR && storedTrades.length > 5) score += 15;
    
    return { disciplineScore: Math.min(100, score) };
  }, [storedTrades]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span>💪</span> Discipline Meter
        </h3>
        <div className="flex items-center justify-between mb-3">
          <div className={`text-3xl font-bold ${getScoreColor(disciplineScore)}`}>
            {disciplineScore}
          </div>
          <div className={`text-sm font-medium ${getScoreColor(disciplineScore)}`}>
            {getScoreLabel(disciplineScore)}
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              disciplineScore >= 80
                ? 'bg-green-500'
                : disciplineScore >= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${disciplineScore}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Based on strategy consistency, activity, and risk management
        </p>
      </div>
    </motion.div>
  );
}
