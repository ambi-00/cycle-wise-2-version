import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getWinLossStreak } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";

export function StreakDisplay() {
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

      const streakData = await getWinLossStreak(user.id);
      setWinLossStreak(streakData || { winStreak: 0, lossStreak: 0, currentType: 'none' });
    } catch (error) {
      console.error('Failed to load streak data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Win Streak */}
      {winLossStreak.currentType === 'win' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 shadow-soft border border-border h-full"
        >
          <TrendingUp className="h-6 w-6 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">Win Streak</p>
            <p className="text-lg font-bold text-foreground">{winLossStreak.winStreak} wins</p>
          </div>
        </motion.div>
      )}

      {/* Loss Streak */}
      {winLossStreak.currentType === 'loss' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 shadow-soft border border-border h-full"
        >
          <TrendingDown className="h-6 w-6 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">Loss Streak</p>
            <p className="text-lg font-bold text-foreground">{winLossStreak.lossStreak} losses</p>
          </div>
        </motion.div>
      )}

      {/* No streak yet */}
      {winLossStreak.currentType === 'none' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 shadow-soft border border-border h-full"
        >
          <div className="h-6 w-6 rounded-full bg-muted" />
          <div>
            <p className="text-xs text-muted-foreground">No trades yet</p>
            <p className="text-lg font-bold text-muted-foreground">-</p>
          </div>
        </motion.div>
      )}
    </>
  );
}
