import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";
import { calculateTradeStatistics, getTradeSignificanceMessage } from "@/lib/tradingStatistics";

interface QuickTradeEntryProps {
  onNewTrade: (trade: {
    instrument: string;
    direction: "long" | "short";
    rMultiple?: number | null;
    pnl?: number | null;
    strategy?: string;
  }) => void;
  safetyModeEnabled: boolean;
}

export function QuickTradeEntry({ onNewTrade, safetyModeEnabled }: QuickTradeEntryProps) {
  const [direction, setDirection] = useState<"long" | "short" | null>(null);
  const [showPerspective, setShowPerspective] = useState(false);
  const [tradeStats, setTradeStats] = useState<any>(null);

  useEffect(() => {
    const trades = loadTradesFromLocalStorage();
    if (trades.length >= 10) {
      const stats = calculateTradeStatistics(trades);
      setTradeStats(stats);
    }
  }, []);

  const handleShowPerspective = () => {
    setShowPerspective(true);
    setTimeout(() => setShowPerspective(false), 8000); // Hide after 8 seconds
  };

  if (safetyModeEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl bg-muted/50 p-8 text-center"
      >
        <div className="absolute inset-0 backdrop-blur-sm" />
        <div className="relative">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-3xl">🛡️</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">Safety Mode Active</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Trade entry is blocked during this phase. Focus on analysis and planning.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <h3 className="text-lg font-serif font-semibold text-foreground">Quick Trade Entry</h3>
      <p className="mt-1 text-sm text-muted-foreground">Log a new trade with your strategy</p>

      {/* Pre-Trade Reality Check */}
      {tradeStats && tradeStats.totalTrades >= 10 && !showPerspective && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleShowPerspective}
          className="mt-4 w-full text-left rounded-lg bg-primary/10 p-3 hover:bg-primary/20 transition-colors"
        >
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-primary">Pre-Trade Reality Check</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click for perspective before trading
              </p>
            </div>
          </div>
        </motion.button>
      )}

      {/* Reality Check Message */}
      {showPerspective && tradeStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-4 rounded-lg bg-green-500/10 border border-green-500/20 p-4"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-2">
                🎯 Pre-Trade Reality Check:
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {getTradeSignificanceMessage(tradeStats.totalTrades + 1, tradeStats.winRate)}
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                → This trade doesn't define you.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setDirection("long")}
          className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-all ${
            direction === "long"
              ? "bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-700"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          <TrendingUp className="h-6 w-6" />
          <span className="text-sm font-medium">Long</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setDirection("short")}
          className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-all ${
            direction === "short"
              ? "bg-red-500/20 border-2 border-red-500/50 text-red-700"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          <TrendingDown className="h-6 w-6" />
          <span className="text-sm font-medium">Short</span>
        </motion.button>
      </div>

      <Button
        onClick={() => {
          if (!direction) return;
          onNewTrade({ instrument: "Unknown", direction, rMultiple: null, pnl: null, strategy: "" });
        }}
        variant="hero"
        size="lg"
        className="mt-5 w-full"
        disabled={!direction}
      >
        <Plus className="h-5 w-5" />
        Log Trade
      </Button>
    </motion.div>
  );
}
