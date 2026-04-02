import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { getGamificationStats, RANKS } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

export function XPBar() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats() {
    try {
      const user = (await supabase.auth.getSession()).data.session?.user ?? null;
      if (!user) {
        // Create fallback stats from localStorage trades
        createFallbackStats();
        return;
      }

      const data = await getGamificationStats(user.id);
      if (data) {
        setStats(data);
      } else {
        // Fallback if no DB data
        createFallbackStats();
      }
    } catch (error) {
      console.error('Failed to load gamification stats:', error);
      createFallbackStats();
    } finally {
      setLoading(false);
    }
  }

  function createFallbackStats() {
    // Calculate XP from local trades: 1 XP per trade + 5 XP for wins
    const trades = loadTradesFromLocalStorage();
    let totalXP = trades.length; // 1 XP per trade
    let wins = 0;
    for (const t of trades) {
      if (t.result === 'win') {
        wins += 1;
        totalXP += 5; // 5 bonus XP for wins
      }
    }

    // Determine rank based on total XP
    let rank = 'bronze';
    if (totalXP >= 1000) rank = 'diamond';
    else if (totalXP >= 500) rank = 'platinum';
    else if (totalXP >= 200) rank = 'gold';
    else if (totalXP >= 50) rank = 'silver';

    setStats({
      total_xp: totalXP,
      current_rank: rank,
      login_streak: 0,
      trading_streak: 0,
    });
  }

  if (loading || !stats) {
    return (
      <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
        <div className="h-6 bg-muted rounded animate-pulse" />
      </div>
    );
  }

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
              <span className="tabular-nums">{currentXP.toLocaleString()}</span> XP
            </p>
          </div>
        </div>
        {nextRank && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next: {nextRank.name}</p>
            <p className="text-xs font-medium text-foreground tabular-nums">
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
