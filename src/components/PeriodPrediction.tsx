import { motion } from "framer-motion";
import { Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { calculatePersonalizedCycleStats } from "@/lib/demoDataLoaders";
import { useEffect, useState } from "react";

export function PeriodPrediction() {
  const [stats, setStats] = useState<ReturnType<typeof calculatePersonalizedCycleStats>>(null);

  useEffect(() => {
    const loadStats = () => {
      const cycleStats = calculatePersonalizedCycleStats();
      setStats(cycleStats);
    };
    
    loadStats();
    
    // Listen for storage changes (when user logs period days)
    const onStorage = () => loadStats();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cycle-menstruation/20">
            <Calendar className="h-5 w-5 text-cycle-menstruation" />
          </div>
          <h3 className="font-semibold text-foreground">Period Prediction</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Start logging your period days in the Daily Journal to see personalized predictions.
        </p>
      </motion.div>
    );
  }

  const { daysUntilNextPeriod, confidence, avgCycleLength, avgPeriodLength, totalCycles, nextPeriodPrediction } = stats;

  const getConfidenceColor = () => {
    if (confidence === 'high') return 'text-foreground';
    if (confidence === 'medium') return 'text-muted-foreground';
    return 'text-muted-foreground/70';
  };

  const getConfidenceLabel = () => {
    if (confidence === 'high') return 'High confidence';
    if (confidence === 'medium') return 'Medium confidence';
    return 'Low confidence (log more cycles)';
  };

  const getPredictionMessage = () => {
    if (daysUntilNextPeriod === null) return null;
    
    if (daysUntilNextPeriod < 0) {
      return {
        icon: AlertCircle,
        message: `Your period is ${Math.abs(daysUntilNextPeriod)} days overdue`,
        color: 'text-foreground',
        bgColor: 'bg-cycle-menstruation/30', // Darker red (like logged period)
        borderColor: 'border-cycle-menstruation',
      };
    } else if (daysUntilNextPeriod === 0) {
      return {
        icon: Calendar,
        message: 'Your period is predicted to start today',
        color: 'text-foreground',
        bgColor: 'bg-cycle-menstruation/30', // Darker red
        borderColor: 'border-cycle-menstruation',
      };
    } else if (daysUntilNextPeriod <= 3) {
      return {
        icon: Calendar,
        message: `Period predicted in ${daysUntilNextPeriod} ${daysUntilNextPeriod === 1 ? 'day' : 'days'}`,
        color: 'text-foreground',
        bgColor: 'bg-cycle-menstruation/10', // Lighter red (prediction)
        borderColor: 'border-cycle-menstruation/30',
      };
    } else if (daysUntilNextPeriod <= 7) {
      return {
        icon: Calendar,
        message: `Period predicted in ${daysUntilNextPeriod} days`,
        color: 'text-foreground',
        bgColor: 'bg-cycle-menstruation/10', // Lighter red (prediction)
        borderColor: 'border-cycle-menstruation/30',
      };
    } else {
      return {
        icon: TrendingUp,
        message: `Next period expected in ${daysUntilNextPeriod} days`,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        borderColor: 'border-transparent',
      };
    }
  };

  const prediction = getPredictionMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cycle-menstruation/20">
            <Calendar className="h-5 w-5 text-cycle-menstruation" />
          </div>
          <h3 className="font-semibold text-foreground">Period Prediction</h3>
        </div>
        <span className={`text-xs font-medium ${getConfidenceColor()}`}>
          {getConfidenceLabel()}
        </span>
      </div>

      {prediction && (
        <div className={`rounded-xl ${prediction.bgColor} ${prediction.borderColor} border-2 p-4 mb-4`}>
          <div className="flex items-start gap-3">
            <prediction.icon className={`h-5 w-5 mt-0.5 ${prediction.color}`} />
            <div>
              <p className={`text-sm font-semibold ${prediction.color}`}>
                {prediction.message}
              </p>
              {nextPeriodPrediction && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: {new Date(nextPeriodPrediction).toLocaleDateString('de-DE', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Avg Cycle</p>
          <p className="text-lg font-bold text-foreground">{avgCycleLength} days</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Avg Period</p>
          <p className="text-lg font-bold text-foreground">{avgPeriodLength} days</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Tracked</p>
          <p className="text-lg font-bold text-foreground">{totalCycles} cycles</p>
        </div>
      </div>

      {confidence === 'low' && (
        <div className="mt-4 text-xs text-muted-foreground">
          💡 Log at least 2-3 complete cycles for more accurate predictions
        </div>
      )}
    </motion.div>
  );
}
