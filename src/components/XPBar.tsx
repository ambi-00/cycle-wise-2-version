import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { getGamificationStats, RANKS } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";

export function XPBar() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getGamificationStats(user.id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load gamification stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) return null;

  const currentXP = stats.total_xp || 0;
  const currentRank = stats.current_rank || 'bronze';
  const rankData = RANKS[currentRank as keyof typeof RANKS];

  // Find next rank
  const rankKeys = Object.keys(RANKS) as Array<keyof typeof RANKS>;
  const currentRankIndex = rankKeys.indexOf(currentRank as keyof typeof RANKS);
  const nextRankKey = rankKeys[currentRankIndex + 1];
  const nextRank = nextRankKey ? RANKS[nextRankKey] : null;

  const xpForNextRank = nextRank ? nextRank.min : rankData.min;
  const xpInCurrentRank = currentXP - rankData.min;
  const xpNeededForNext = nextRank ? xpForNextRank - rankData.min : 0;
  const progress = nextRank ? (xpInCurrentRank / xpNeededForNext) * 100 : 100;

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{rankData.icon}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{rankData.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-accent-foreground" />
              {currentXP.toLocaleString()} XP
            </p>
          </div>
        </div>
        {nextRank && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next: {nextRank.name}</p>
            <p className="text-xs font-medium text-foreground">
              {(xpForNextRank - currentXP).toLocaleString()} XP
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400"
        />
      </div>

      {nextRank ? (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {Math.round(progress)}% to {nextRank.name}
        </p>
      ) : (
        <p className="text-xs text-primary mt-1 text-center font-medium">
          🏆 Max Rank Achieved!
        </p>
      )}
    </div>
  );
}
