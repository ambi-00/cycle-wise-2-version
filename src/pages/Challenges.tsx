import { motion } from "framer-motion";
import { Trophy, Award, Medal, Shield, Calendar, RefreshCw, Zap, Star } from "lucide-react";
import { ChallengePrivacySettings } from "@/components/ChallengePrivacySettings";
import ChallengesTour from "@/components/ChallengesTour";
import { useEffect, useState } from "react";
import { loadLeaderboard, loadMyChallengPositions, updateChallengeScores, checkAndAwardBadges, getXPLeaderboard, RANKS } from "@/lib/supabaseHelpers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const leaderboardConfigs = [
  {
    type: "profit" as const,
    title: "Profit Leaders",
    icon: Trophy,
    gradient: "from-amber-400/20 to-yellow-300/20",
    formatScore: (score: number) => `$${score.toFixed(0)}`,
  },
  {
    type: "discipline" as const,
    title: "Strategy Discipline",
    icon: Award,
    gradient: "from-secondary to-accent/30",
    formatScore: (score: number) => `${score.toFixed(0)}/100`,
  },
  {
    type: "risk" as const,
    title: "Risk Masters",
    icon: Shield,
    gradient: "from-accent to-secondary/30",
    formatScore: (score: number) => `$${score.toFixed(0)} DD`,
  },
  {
    type: "cycle" as const,
    title: "Cycle-Aligned",
    icon: Calendar,
    gradient: "from-primary/20 to-secondary",
    formatScore: (score: number) => `${score > 0 ? '+' : ''}${score.toFixed(1)}R`,
  },
];

const badgeDefinitions = [
  { name: "Miss Discipline", icon: "🎯", description: "100% rule adherence for 30 days" },
  { name: "Risk Queen", icon: "👑", description: "Max 3% drawdown for a month" },
  { name: "Cycle Master", icon: "🌙", description: "Best cycle-aligned performance" },
  { name: "Consistency Queen", icon: "💎", description: "Profitable 20+ days in a row" },
  { name: "Comeback Girl", icon: "🔥", description: "Recovered from 10%+ drawdown" },
];

export default function Challenges() {
  const { toast } = useToast();
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [myPositions, setMyPositions] = useState<any[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [xpLeaderboards, setXPLeaderboards] = useState<{
    weekly: any[];
    monthly: any[];
    alltime: any[];
  }>({
    weekly: [],
    monthly: [],
    alltime: [],
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  async function getCurrentUser() {
    try {
      const [leaderboardData, xpWeekly, xpMonthly, xpAlltime, positions, badges] = await Promise.all([
        Promise.all(leaderboardConfigs.map(config => loadLeaderboard(config.type, 10))),
        getXPLeaderboard('weekly', 10),
        getXPLeaderboard('monthly', 10),
        getXPLeaderboard('alltime', 10),
        loadMyChallengPositions(),
        checkAndAwardBadges(),
      ]);

      setLeaderboards(leaderboardData);
      setXPLeaderboards({
        weekly: xpWeekly,
        monthly: xpMonthly,
        alltime: xpAlltime,
      });
      setMyPositions(positions);
      setEarnedBadges(badges);
    } catch (error) {
      console.error('Failed to load challenge data:', error);
      toast({
        title: "Loading Error",
        description: "Challenges could not be loaded.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateScores() {
    try {
      setUpdating(true);
      await updateChallengeScores();
      await getCurrentUser();
      toast({
        title: "Scores Updated!",
        description: "Your challenge scores have been recalculated.",
      });
    } catch (error) {
      console.error('Failed to update scores:', error);
      toast({
        title: "Error",
        description: "Scores could not be updated.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  }

  // Calculate time until end of week
  const getTimeRemaining = () => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59);

    const diff = endOfWeek.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, mins };
  };

  const timeRemaining = getTimeRemaining();
  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <ChallengesTour />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl p-4 lg:p-8"
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between challenges-header">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">Weekly Challenges</h1>
            <p className="mt-1 text-muted-foreground">Compete, improve, and earn badges with the community</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpdateScores}
              disabled={updating}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Updating...' : 'Update Scores'}
            </Button>
            <div className="challenge-privacy-button">
              <ChallengePrivacySettings />
            </div>
          </div>
        </div>

        {/* Challenge Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary to-accent/30 p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Week Challenge</p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-foreground">Time Remaining</h2>
            </div>
            <div className="flex gap-4">
              {[
                { value: timeRemaining.days, label: "Days" },
                { value: timeRemaining.hours, label: "Hours" },
                { value: timeRemaining.mins, label: "Mins" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="rounded-xl bg-card px-4 py-3 shadow-soft">
                    <span className="text-2xl font-bold text-foreground">{item.value}</span>
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading challenges...</p>
          </div>
        ) : (
          <>
            {/* Badges Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 rounded-2xl bg-card p-6 shadow-card"
            >
              <h3 className="font-serif text-lg font-semibold text-foreground mb-6">Your Badges</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {badgeDefinitions.map((badge, index) => {
                  const earned = earnedBadges.includes(badge.name);
                  
                  return (
                    <motion.div
                      key={badge.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className={`rounded-xl p-4 text-center transition-all ${
                        earned 
                          ? "bg-gradient-to-br from-secondary/50 to-accent/30" 
                          : "bg-muted/30 opacity-50"
                      }`}
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <h4 className="mt-2 text-sm font-semibold text-foreground">{badge.name}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{badge.description}</p>
                      {earned && (
                        <span className="mt-2 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          Earned
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Tabbed Leaderboards */}
            <Tabs defaultValue="performance" className="mb-8 leaderboard-tabs">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="xp" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  XP Rankings
                </TabsTrigger>
              </TabsList>

              {/* Performance Leaderboards */}
              <TabsContent value="performance">
                <div className="grid gap-6 lg:grid-cols-2">
                  {leaderboardConfigs.map((config, boardIndex) => {
                    const boardData = leaderboards[boardIndex] || [];
                    
                    return (
                      <motion.div
                        key={config.type}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: boardIndex * 0.1 }}
                        className="rounded-2xl bg-card p-6 shadow-card"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`rounded-xl bg-gradient-to-br ${config.gradient} p-2.5`}>
                            <config.icon className="h-5 w-5 text-foreground" />
                          </div>
                          <h3 className="font-semibold text-foreground">{config.title}</h3>
                        </div>

                        <div className="space-y-3">
                          {boardData.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No participants yet. Be the first!
                            </p>
                          ) : (
                            boardData.map((entry: any, index: number) => {
                              const isCurrentUser = entry.user_id === currentUser?.id;
                              const profile = entry.profiles;
                              const displayName = profile?.name || 'Anonym';
                              
                              return (
                                <motion.div
                                  key={entry.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: boardIndex * 0.1 + index * 0.05 }}
                                  className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                                    isCurrentUser ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                                  }`}
                                >
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                    entry.rank === 1 ? "bg-amber-400/20 text-amber-700" :
                                    entry.rank === 2 ? "bg-slate-300/30 text-slate-600" :
                                    entry.rank === 3 ? "bg-orange-300/20 text-orange-700" :
                                    "bg-muted text-muted-foreground"
                                  }`}>
                                    {entry.rank}
                                  </div>
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-lg">
                                    {profile?.avatar_url || (isCurrentUser ? '✨' : '👤')}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                                      {isCurrentUser ? 'You' : displayName}
                                    </p>
                                    {entry.total_trades && (
                                      <span className="text-xs text-muted-foreground">{entry.total_trades} trades</span>
                                    )}
                                  </div>
                                  <span className="text-sm font-semibold text-foreground">
                                    {config.formatScore(entry.score)}
                                  </span>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* XP Rankings */}
              <TabsContent value="xp">
                <div className="grid gap-6 lg:grid-cols-3">
                  {[
                    { key: 'weekly', title: 'This Week', icon: Calendar, gradient: 'from-blue-400/20 to-cyan-300/20' },
                    { key: 'monthly', title: 'This Month', icon: Star, gradient: 'from-purple-400/20 to-pink-300/20' },
                    { key: 'alltime', title: 'All-Time', icon: Trophy, gradient: 'from-amber-400/20 to-yellow-300/20' },
                  ].map((period, periodIndex) => {
                    const boardData = xpLeaderboards[period.key as keyof typeof xpLeaderboards] || [];
                    
                    return (
                      <motion.div
                        key={period.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: periodIndex * 0.1 }}
                        className="rounded-2xl bg-card p-6 shadow-card"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`rounded-xl bg-gradient-to-br ${period.gradient} p-2.5`}>
                            <period.icon className="h-5 w-5 text-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{period.title}</h3>
                            <p className="text-xs text-muted-foreground">XP Leaders</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {boardData.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No data yet
                            </p>
                          ) : (
                            boardData.map((entry: any, index: number) => {
                              const isCurrentUser = entry.id === currentUser?.id;
                              const displayName = entry.name || 'Anonym';
                              const rankData = RANKS[entry.current_rank as keyof typeof RANKS] || RANKS.bronze;
                              const xpAmount = period.key === 'weekly' 
                                ? entry.weekly_xp 
                                : period.key === 'monthly' 
                                  ? entry.monthly_xp 
                                  : entry.total_xp;
                              
                              return (
                                <motion.div
                                  key={entry.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: periodIndex * 0.1 + index * 0.05 }}
                                  className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                                    isCurrentUser ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                                  }`}
                                >
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                    index === 0 ? "bg-amber-400/20 text-amber-700" :
                                    index === 1 ? "bg-slate-300/30 text-slate-600" :
                                    index === 2 ? "bg-orange-300/20 text-orange-700" :
                                    "bg-muted text-muted-foreground"
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-lg">
                                    {entry.avatar_url || (isCurrentUser ? '✨' : '👤')}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                                      {isCurrentUser ? 'You' : displayName}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {rankData.icon} {rankData.name}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                                      <Zap className="h-3 w-3 text-amber-500" />
                                      {xpAmount?.toLocaleString() || 0}
                                    </p>
                                    <span className="text-xs text-muted-foreground">XP</span>
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>
    </main>
  );
}