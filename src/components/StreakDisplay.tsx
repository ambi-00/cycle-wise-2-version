import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar } from "lucide-react";
import { getGamificationStats } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";

export function StreakDisplay() {
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
      console.error('Failed to load streak data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) return null;

  const loginStreak = stats.login_streak || 0;
  const tradingStreak = stats.trading_streak || 0;

  return (
    <div className="flex gap-3">
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
    </div>
  );
}
