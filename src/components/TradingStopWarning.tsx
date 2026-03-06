import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Coffee, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Trade {
  id: string;
  date: string;
  result: 'win' | 'loss' | 'breakeven';
  created_at?: string | number;
}

interface Props {
  todayTrades: Trade[];
  onDismiss?: () => void;
}

type WarningType = 'STOP' | 'PAUSE' | null;

interface Warning {
  type: WarningType;
  message: string;
  severity: 'critical' | 'warning';
  recommendation: string;
}

export default function TradingStopWarning({ todayTrades, onDismiss }: Props) {
  const [warning, setWarning] = useState<Warning | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed warning today
    const today = new Date().toISOString().slice(0, 10);
    const dismissedKey = `cw_trading_warning_dismissed_${today}`;
    const wasDismissed = localStorage.getItem(dismissedKey) === 'true';
    
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Analyze today's trades for warning signals
    const detectedWarning = checkForStopSignal(todayTrades);
    setWarning(detectedWarning);
  }, [todayTrades]);

  const checkForStopSignal = (trades: Trade[]): Warning | null => {
    if (trades.length === 0) return null;

    // Sort by time (oldest first)
    const sorted = [...trades].sort((a, b) => {
      const timeA = typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at || 0).getTime();
      const timeB = typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });

    // Check 1: Two consecutive losses (CRITICAL - STOP)
    if (sorted.length >= 2) {
      const lastTwo = sorted.slice(-2);
      if (lastTwo[0].result === 'loss' && lastTwo[1].result === 'loss') {
        return {
          type: 'STOP',
          message: '🛑 Two losses in a row detected!',
          severity: 'critical',
          recommendation: 'Historical data shows continuing after 2 consecutive losses leads to more losses. Stop trading for today.'
        };
      }
    }

    // Check 2: Three consecutive losses (CRITICAL - STOP)
    if (sorted.length >= 3) {
      const lastThree = sorted.slice(-3);
      if (lastThree.every(t => t.result === 'loss')) {
        return {
          type: 'STOP',
          message: '🛑 Three losses in a row - STOP NOW!',
          severity: 'critical',
          recommendation: 'Three consecutive losses indicate something is wrong. Stop immediately and review your strategy tomorrow.'
        };
      }
    }

    // Check 3: 3+ trades today (WARNING - PAUSE)
    // This will be enhanced with historical performance data later
    if (sorted.length >= 3) {
      const wins = sorted.filter(t => t.result === 'win').length;
      const winRate = (wins / sorted.length) * 100;
      
      // If win rate is dropping below 50% after 3+ trades
      if (winRate < 50) {
        return {
          type: 'PAUSE',
          message: '⚠️ Performance declining after multiple trades',
          severity: 'warning',
          recommendation: `You've taken ${sorted.length} trades today with ${winRate.toFixed(0)}% win rate. Consider taking a break to maintain focus.`
        };
      }
    }

    // Check 4: Too many trades (4+) regardless of performance
    if (sorted.length >= 4) {
      return {
        type: 'PAUSE',
        message: '⚠️ High trade volume today',
        severity: 'warning',
        recommendation: `You've taken ${sorted.length} trades today. Most traders perform worse after 3-4 trades. Take a break to avoid overtrading.`
      };
    }

    return null;
  };

  const handleDismiss = (action: 'done' | 'break' | 'continue') => {
    const today = new Date().toISOString().slice(0, 10);
    const dismissedKey = `cw_trading_warning_dismissed_${today}`;
    
    // Log user's decision
    const logKey = `cw_trading_warning_log_${today}`;
    const log = {
      timestamp: new Date().toISOString(),
      warningType: warning?.type,
      action: action,
      tradeCount: todayTrades.length
    };
    localStorage.setItem(logKey, JSON.stringify(log));
    
    // Mark as dismissed for today
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
    
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!warning || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`mb-6 p-5 rounded-2xl shadow-lg border-2 ${
          warning.severity === 'critical'
            ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500'
            : 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl ${
              warning.severity === 'critical' ? 'bg-red-500/20' : 'bg-orange-500/20'
            }`}>
              {warning.type === 'STOP' ? (
                <StopCircle className={`h-6 w-6 ${
                  warning.severity === 'critical' ? 'text-red-500' : 'text-orange-500'
                }`} />
              ) : (
                <AlertTriangle className={`h-6 w-6 ${
                  warning.severity === 'critical' ? 'text-red-500' : 'text-orange-500'
                }`} />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-1 ${
                warning.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                {warning.message}
              </h3>
              <p className="text-sm text-foreground mb-4">
                {warning.recommendation}
              </p>
              <div className="flex gap-3 flex-wrap">
                {warning.type === 'STOP' ? (
                  <>
                    <Button
                      onClick={() => handleDismiss('done')}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      ✓ I'm Done for Today
                    </Button>
                    <Button
                      onClick={() => handleDismiss('break')}
                      variant="outline"
                      size="sm"
                    >
                      <Coffee className="h-4 w-4 mr-2" />
                      Take 30min Break
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleDismiss('break')}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <Coffee className="h-4 w-4 mr-2" />
                      Take a Break
                    </Button>
                    <Button
                      onClick={() => handleDismiss('continue')}
                      variant="outline"
                      size="sm"
                    >
                      Continue Trading
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDismiss('continue')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
