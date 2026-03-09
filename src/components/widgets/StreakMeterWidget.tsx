import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingDown } from 'lucide-react';
import { useStoredTrades } from '@/lib/tradeLoaders';

interface Props {
  size: 'small' | 'medium' | 'large';
}

export function StreakMeterWidget({ size }: Props) {
  const storedTrades = useStoredTrades();
  const data = useMemo(() => {
    const trades = storedTrades
      .filter(t => t.status === 'closed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentWinStreak = 0;
    let longestWinStreak = 0;
    let currentLossStreak = 0;
    let longestLossStreak = 0;
    
    trades.forEach(t => {
      if (t.result === 'win') {
        currentWinStreak++;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
        currentLossStreak = 0;
      } else if (t.result === 'loss') {
        currentLossStreak++;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
        currentWinStreak = 0;
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    });
    
    return {
      currentWinStreak,
      longestWinStreak,
      currentLossStreak,
      longestLossStreak,
      lastTrade: trades[trades.length - 1]?.result || 'none',
    };
  }, [storedTrades]);

  if (size === 'small') {
    // Just current win streak
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-col items-center justify-center min-h-[120px]"
      >
        <Flame className={`w-6 h-6 mb-2 ${data.currentWinStreak > 0 ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
        <div className="text-xs text-muted-foreground mb-1">Win Streak</div>
        <div className="text-3xl font-bold text-accent-foreground">{data.currentWinStreak}</div>
      </motion.div>
    );
  }

  if (size === 'medium') {
    // Current streaks
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-4 shadow-soft border border-border"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Current Streaks</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-accent/10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent-foreground" />
                <span className="text-xs text-muted-foreground">Win Streak</span>
              </div>
              <span className="text-2xl font-bold text-accent-foreground">{data.currentWinStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Best: {data.longestWinStreak}
            </div>
          </div>

          <div className="bg-destructive/10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Loss Streak</span>
              </div>
              <span className="text-2xl font-bold text-destructive">{data.currentLossStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Longest: {data.longestLossStreak}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Large: Detailed streak analysis
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-6 shadow-soft border border-border"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Streak Analysis</h3>
        <p className="text-xs text-muted-foreground mt-1">Winning and losing streaks</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Win Streak Card */}
        <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-accent-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">CURRENT WIN</span>
          </div>
          <div className="mb-3">
            <div className="text-3xl font-bold text-accent-foreground">{data.currentWinStreak}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            Personal best: <span className="font-bold text-accent-foreground">{data.longestWinStreak}</span>
          </div>
        </div>

        {/* Loss Streak Card */}
        <div className="bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <span className="text-xs font-semibold text-muted-foreground">CURRENT LOSS</span>
          </div>
          <div className="mb-3">
            <div className="text-3xl font-bold text-destructive">{data.currentLossStreak}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            Longest: <span className="font-bold text-destructive">{data.longestLossStreak}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Trade Result</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            data.lastTrade === 'win' ? 'bg-accent/20 text-accent-foreground' :
            data.lastTrade === 'loss' ? 'bg-destructive/20 text-destructive' :
            'bg-muted text-muted-foreground'
          }`}>
            {data.lastTrade === 'win' ? '✓ Win' : data.lastTrade === 'loss' ? '✕ Loss' : '— Breakeven'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
