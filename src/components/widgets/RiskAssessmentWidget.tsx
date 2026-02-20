import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { useMemo } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

interface RiskAssessmentWidgetProps {
  size: WidgetSize;
}

export function RiskAssessmentWidget({ size }: RiskAssessmentWidgetProps) {
  const storedTrades = loadTradesFromLocalStorage();

  const { riskScore, riskLevel, avgRiskPerTrade, maxDrawdown } = useMemo(() => {
    let totalRisk = 0;
    let tradeCount = 0;
    let maxLoss = 0;

    for (const t of storedTrades) {
      tradeCount += 1;
      const r = typeof t.rMultiple === 'number' ? t.rMultiple : Number(t.rMultiple) || 0;
      if (r < 0) {
        totalRisk += Math.abs(r);
        maxLoss = Math.min(maxLoss, r);
      }
    }

    const avgRiskPerTrade = tradeCount > 0 ? (totalRisk / tradeCount).toFixed(2) : '0';
    const riskScore = Math.min(100, 50 + (Number(avgRiskPerTrade) * 10));
    const riskLevel = riskScore < 40 ? 'Low' : riskScore < 70 ? 'Medium' : 'High';

    return {
      riskScore: Math.max(0, 100 - Math.round(riskScore)),
      riskLevel,
      avgRiskPerTrade,
      maxDrawdown: maxLoss.toFixed(2),
    };
  }, [storedTrades]);

  const getRiskColor = (score: number) => {
    if (score < 40) return 'text-green-500 bg-green-500/10';
    if (score < 70) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getProgressColor = (score: number) => {
    if (score < 40) return 'bg-green-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-xs text-muted-foreground">No data</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-card text-center">
            <div className="text-3xl font-bold mb-1" style={{ 
              color: riskLevel === 'Low' ? '#22c55e' : riskLevel === 'Medium' ? '#eab308' : '#ef4444' 
            }}>
              {riskLevel}
            </div>
            <div className="text-xs text-muted-foreground">Risk Level</div>
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
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Risk Assessment</h3>
              <p className="text-sm text-muted-foreground mb-2">Monitor your risk management practices</p>
              <p className="text-xs text-muted-foreground">Data needed: Trade results and R-multiple values</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">⚠️ Risk Assessment</h3>
          
          <div className={`rounded-xl p-4 mb-4 ${getRiskColor(riskScore)}`}>
            <div className="text-3xl font-bold mb-1">{riskLevel}</div>
            <div className="text-sm opacity-75">Risk Score: {riskScore}/100</div>
          </div>

          <div className="space-y-3">
            <div className="border border-border rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Risk per Trade</span>
                <span className="font-bold text-foreground">{avgRiskPerTrade}R</span>
              </div>
              <div className="text-xs text-muted-foreground">Average loss per losing trade</div>
            </div>

            <div className="border border-border rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Max Drawdown</span>
                <span className="font-bold text-red-500">{maxDrawdown}R</span>
              </div>
              <div className="text-xs text-muted-foreground">Worst trade</div>
            </div>

            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(riskScore)}`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
