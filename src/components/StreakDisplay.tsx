import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { getGamificationStats, getWinLossStreak } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";

export function StreakDisplay() {
  const [stats, setStats] = useState<any>({ login_streak: 0, trading_streak: 0 });
  const [winLossStreak, setWinLossStreak] = useState<any>({ winStreak: 0, lossStreak: 0, currentType: 'none' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [statsData, streakData] = await Promise.all([
        getGamificationStats(user.id),
        getWinLossStreak(user.id)
      ]);
      
      setStats(statsData || { login_streak: 0, trading_streak: 0 });
      setWinLossStreak(streakData || { winStreak: 0, lossStreak: 0, currentType: 'none' });
    } catch (error) {
      console.error('Failed to load streak data:', error);
    } finally {
      setLoading(false);
    }
  }

  const loginStreak = stats?.login_streak || 0;
  const tradingStreak = stats?.trading_streak || 0;

  return (
    <div className="flex gap-3 flex-wrap">
      {/* Login Streak */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-soft border border-border"
      >
        <Flame className={`h-5 w-5 ${loginStreak >= 7 ? 'text-primary' : 'text-muted-foreground'}`} />
        <div>
          <p className="text-xs text-muted-foreground">Login Streak</p>
          <p className="text-sm font-bold text-foreground">{loginStreak} days</p>
        </div>
      </motion.div>

      {/* Trading Streak */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-soft border border-border"
      >
        <Calendar className={`h-5 w-5 ${tradingStreak >= 5 ? 'text-primary' : 'text-muted-foreground'}`} />
        <div>
          <p className="text-xs text-muted-foreground">Trading Streak</p>
          <p className="text-sm font-bold text-foreground">{tradingStreak} days</p>
        </div>
      </motion.div>

      {/* Win Streak */}
      {winLossStreak.currentType === 'win' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-soft border border-border"
        >
          <TrendingUp className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">Win Streak</p>
            <p className="text-sm font-bold text-foreground">{winLossStreak.winStreak} wins</p>
          </div>
        </motion.div>
      )}

      {/* Loss Streak */}
      {winLossStreak.currentType === 'loss' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-soft border border-border"
        >
          <TrendingDown className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">Loss Streak</p>
            <p className="text-sm font-bold text-foreground">{winLossStreak.lossStreak} losses</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
