import { motion } from "framer-motion";
import { Trophy, Award, Medal, Shield, Calendar, RefreshCw, Zap, Star,
  Sparkles, BarChart2, TrendingUp, CalendarDays, LineChart, Flame,
  CheckCircle2, Target, ClipboardList, Wind, CalendarCheck, Lock, ChevronDown } from "lucide-react";
import { ChallengePrivacySettings } from "@/components/ChallengePrivacySettings";
import ChallengesTour from "@/components/ChallengesTour";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadLeaderboard, loadMyChallengPositions, updateChallengeScores, checkAndAwardBadges, getXPLeaderboard, RANKS } from "@/lib/supabaseHelpers";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ALL_ACHIEVEMENTS, CATEGORY_META, TIER_META,
  loadUnlockedAchievements,
  type Achievement, type AchievementCategory, type AchievementTier,
} from "@/lib/achievements";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

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

// ─── Demo data ───────────────────────────────────────────────────────────────

const DEMO_USER_ID = 'demo-you';

const DEMO_LEADERBOARDS = [
  // profit
  [
    { id: '1', user_id: 'u1', rank: 1, score: 3847, total_trades: 64, profiles: { name: 'Luna_T', avatar_url: '🌙' } },
    { id: '2', user_id: DEMO_USER_ID, rank: 2, score: 2614, total_trades: 48, profiles: { name: 'You', avatar_url: '✨' } },
    { id: '3', user_id: 'u3', rank: 3, score: 1980, total_trades: 37, profiles: { name: 'Maya_FX', avatar_url: '🦋' } },
    { id: '4', user_id: 'u4', rank: 4, score: 1243, total_trades: 29, profiles: { name: 'Sarah_W', avatar_url: '🌸' } },
    { id: '5', user_id: 'u5', rank: 5, score: 876,  total_trades: 22, profiles: { name: 'Kim_Pro', avatar_url: '💎' } },
  ],
  // discipline
  [
    { id: '6', user_id: 'u4', rank: 1, score: 94, total_trades: 29, profiles: { name: 'Sarah_W', avatar_url: '🌸' } },
    { id: '7', user_id: 'u3', rank: 2, score: 88, total_trades: 37, profiles: { name: 'Maya_FX', avatar_url: '🦋' } },
    { id: '8', user_id: DEMO_USER_ID, rank: 3, score: 83, total_trades: 48, profiles: { name: 'You', avatar_url: '✨' } },
    { id: '9', user_id: 'u1', rank: 4, score: 71, total_trades: 64, profiles: { name: 'Luna_T', avatar_url: '🌙' } },
    { id: '10', user_id: 'u5', rank: 5, score: 64, total_trades: 22, profiles: { name: 'Kim_Pro', avatar_url: '💎' } },
  ],
  // risk (lower = better drawdown)
  [
    { id: '11', user_id: 'u5', rank: 1, score: 180, total_trades: 22, profiles: { name: 'Kim_Pro', avatar_url: '💎' } },
    { id: '12', user_id: DEMO_USER_ID, rank: 2, score: 240, total_trades: 48, profiles: { name: 'You', avatar_url: '✨' } },
    { id: '13', user_id: 'u3', rank: 3, score: 410, total_trades: 37, profiles: { name: 'Maya_FX', avatar_url: '🦋' } },
    { id: '14', user_id: 'u1', rank: 4, score: 680, total_trades: 64, profiles: { name: 'Luna_T', avatar_url: '🌙' } },
    { id: '15', user_id: 'u4', rank: 5, score: 920, total_trades: 29, profiles: { name: 'Sarah_W', avatar_url: '🌸' } },
  ],
  // cycle
  [
    { id: '16', user_id: DEMO_USER_ID, rank: 1, score: 2.8, total_trades: 48, profiles: { name: 'You', avatar_url: '✨' } },
    { id: '17', user_id: 'u1', rank: 2, score: 2.1, total_trades: 64, profiles: { name: 'Luna_T', avatar_url: '🌙' } },
    { id: '18', user_id: 'u4', rank: 3, score: 1.4, total_trades: 29, profiles: { name: 'Sarah_W', avatar_url: '🌸' } },
    { id: '19', user_id: 'u5', rank: 4, score: 0.6, total_trades: 22, profiles: { name: 'Kim_Pro', avatar_url: '💎' } },
    { id: '20', user_id: 'u3', rank: 5, score: -0.3, total_trades: 37, profiles: { name: 'Maya_FX', avatar_url: '🦋' } },
  ],
];

const DEMO_XP_LEADERBOARDS = {
  weekly: [
    { id: 'u1', name: 'Luna_T', avatar_url: '🌙', weekly_xp: 840, monthly_xp: 2410, total_xp: 8210, current_rank: 'gold' },
    { id: DEMO_USER_ID, name: 'You', avatar_url: '✨', weekly_xp: 720, monthly_xp: 3240, total_xp: 9840, current_rank: 'gold' },
    { id: 'u3', name: 'Maya_FX', avatar_url: '🦋', weekly_xp: 590, monthly_xp: 1980, total_xp: 6540, current_rank: 'silver' },
    { id: 'u4', name: 'Sarah_W', avatar_url: '🌸', weekly_xp: 450, monthly_xp: 2860, total_xp: 12480, current_rank: 'platinum' },
    { id: 'u5', name: 'Kim_Pro', avatar_url: '💎', weekly_xp: 310, monthly_xp: 1640, total_xp: 5120, current_rank: 'silver' },
  ],
  monthly: [
    { id: DEMO_USER_ID, name: 'You', avatar_url: '✨', weekly_xp: 720, monthly_xp: 3240, total_xp: 9840, current_rank: 'gold' },
    { id: 'u4', name: 'Sarah_W', avatar_url: '🌸', weekly_xp: 450, monthly_xp: 2860, total_xp: 12480, current_rank: 'platinum' },
    { id: 'u1', name: 'Luna_T', avatar_url: '🌙', weekly_xp: 840, monthly_xp: 2410, total_xp: 8210, current_rank: 'gold' },
    { id: 'u3', name: 'Maya_FX', avatar_url: '🦋', weekly_xp: 590, monthly_xp: 1980, total_xp: 6540, current_rank: 'silver' },
    { id: 'u5', name: 'Kim_Pro', avatar_url: '💎', weekly_xp: 310, monthly_xp: 1640, total_xp: 5120, current_rank: 'silver' },
  ],
  alltime: [
    { id: 'u4', name: 'Sarah_W', avatar_url: '🌸', weekly_xp: 450, monthly_xp: 2860, total_xp: 12480, current_rank: 'platinum' },
    { id: DEMO_USER_ID, name: 'You', avatar_url: '✨', weekly_xp: 720, monthly_xp: 3240, total_xp: 9840, current_rank: 'gold' },
    { id: 'u1', name: 'Luna_T', avatar_url: '🌙', weekly_xp: 840, monthly_xp: 2410, total_xp: 8210, current_rank: 'gold' },
    { id: 'u3', name: 'Maya_FX', avatar_url: '🦋', weekly_xp: 590, monthly_xp: 1980, total_xp: 6540, current_rank: 'silver' },
    { id: 'u5', name: 'Kim_Pro', avatar_url: '💎', weekly_xp: 310, monthly_xp: 1640, total_xp: 5120, current_rank: 'silver' },
  ],
};

const DEMO_EARNED_BADGES = ['Miss Discipline', 'Risk Queen', 'Cycle Master'];

const DEMO_UNLOCKED_IDS = [
  'first_trade','first_note','first_screenshot','first_reflection','first_checklist',
  'first_strategy','first_day_profit','first_week_profit','first_month_profit',
  'first_win_streak','first_perfect_trade','first_rrr2',
  'trades_5','trades_10','trades_25','trades_50','trades_100',
  'best_day_100','best_day_250','best_day_500','best_day_1000',
  'best_week_100','best_week_250','best_week_500',
  'best_month_100','best_month_250',
  'total_pnl_100','total_pnl_250','total_pnl_500','total_pnl_1000','total_pnl_1500',
  'win_streak_2','win_streak_3','win_streak_5','win_streak_7',
  'green_days_2','green_days_3','green_days_5',
  'perfect_total_1','perfect_total_5','perfect_total_10','perfect_streak_3',
  'rule_streak_5','rule_streak_10','rule_streak_20',
  'rule_total_5','rule_total_10','rule_total_25',
  'zen_streak_5','zen_streak_10',
  'multi_strategy','strategy_loyal_20',
  'months_active_1','months_active_3',
];
const DEMO_DATES: Record<string, string> = {};
DEMO_UNLOCKED_IDS.forEach((id, i) => {
  const d = new Date('2026-03-15');
  d.setDate(d.getDate() - i * 2);
  DEMO_DATES[id] = d.toISOString().slice(0, 10);
});
const DEMO_ACHIEVEMENT_STORED = { unlocked: [...new Set(DEMO_UNLOCKED_IDS)], unlockedDates: DEMO_DATES };

// ─────────────────────────────────────────────────────────────────────────────

export default function Challenges() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'performance';
  const [isDemoMode, setIsDemoMode] = useState(false);
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

  // Demo-aware data
  const activeLeaderboards   = isDemoMode ? DEMO_LEADERBOARDS   : leaderboards;
  const activeXpLeaderboards = isDemoMode ? DEMO_XP_LEADERBOARDS : xpLeaderboards;
  const activeEarnedBadges   = isDemoMode ? DEMO_EARNED_BADGES   : earnedBadges;
  const activeDemoCurrentId  = isDemoMode ? DEMO_USER_ID         : currentUser?.id;

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

        {/* Demo mode banner */}
        {isDemoMode ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span className="text-base">🎭</span>
              <span className="text-sm font-medium">Demo-Vorschau — so sieht die Seite mit echten Daten aus.</span>
            </div>
            <button
              onClick={() => setIsDemoMode(false)}
              className="ml-4 shrink-0 rounded-lg border border-amber-500/40 px-3 py-1 text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors dark:text-amber-400"
            >
              ✕ Demo beenden
            </button>
          </motion.div>
        ) : (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setIsDemoMode(true)}
              className="rounded-lg border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              🎭 Demo-Vorschau
            </button>
          </div>
        )}

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
                  const earned = activeEarnedBadges.includes(badge.name);
                  
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
            <Tabs defaultValue={defaultTab} className="mb-8 leaderboard-tabs">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="xp" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  XP Rankings
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex items-center gap-2">
                  <Medal className="h-4 w-4" />
                  Achievements
                </TabsTrigger>
              </TabsList>

              {/* Performance Leaderboards */}
              <TabsContent value="performance">
                <div className="grid gap-6 lg:grid-cols-2">
                  {leaderboardConfigs.map((config, boardIndex) => {
                    const boardData = activeLeaderboards[boardIndex] || [];
                    
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
                              const isCurrentUser = entry.user_id === activeDemoCurrentId;
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
                    const boardData = activeXpLeaderboards[period.key as keyof typeof activeXpLeaderboards] || [];
                    
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
                              const isCurrentUser = entry.id === activeDemoCurrentId;
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

              {/* Achievements */}
              <TabsContent value="achievements">
                <AchievementsTab isDemoMode={isDemoMode} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>
    </main>
  );
}

// ─── Category icon map ──────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<AchievementCategory, React.ComponentType<{ className?: string }>> = {
  first_ever:     Sparkles,
  trade_count:    BarChart2,
  best_day:       TrendingUp,
  best_week:      CalendarDays,
  best_month:     Calendar,
  total_pnl:      LineChart,
  win_streak:     Flame,
  green_days:     CheckCircle2,
  perfect_trades: Star,
  rule_streak:    Target,
  rule_total:     ClipboardList,
  zen_streak:     Wind,
  strategy:       Trophy,
  consistency:    CalendarCheck,
};

// ─── Achievements Tab ────────────────────────────────────────────────────────

const TIER_ORDER: AchievementTier[] = ['beginner', 'intermediate', 'pro', 'elite'];

function AchievementsTab({ isDemoMode }: { isDemoMode: boolean }) {
  const realStored = loadUnlockedAchievements();
  const stored = isDemoMode ? DEMO_ACHIEVEMENT_STORED : realStored;
  const unlockedSet = new Set(stored.unlocked);
  const [expandedTiers, setExpandedTiers] = React.useState<Set<string>>(new Set());

  const toggleTier = (key: string) =>
    setExpandedTiers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const categories = Object.keys(CATEGORY_META) as AchievementCategory[];
  const totalUnlocked = stored.unlocked.length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const pct = totalCount > 0 ? Math.round((totalUnlocked / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {!isDemoMode && realStored.unlocked.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No achievements yet — log your first trade! You can enable Demo Preview above.
        </div>
      )}

      {/* Overall stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4 rounded-2xl bg-card p-6 shadow-card"
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{totalUnlocked}</p>
          <p className="text-xs text-muted-foreground mt-1">Achieved</p>
        </div>
        <div className="text-center border-x border-border/40">
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{pct}%</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
      </motion.div>

      {/* Overall progress bar */}
      <div className="w-full bg-muted/40 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
        />
      </div>

      {/* Categories */}
      {categories.map((cat, catIdx) => {
        const meta = CATEGORY_META[cat];
        const CatIcon = CATEGORY_ICONS[cat];
        const catAchs = ALL_ACHIEVEMENTS.filter(a => a.category === cat);
        const unlockedCount = catAchs.filter(a => unlockedSet.has(a.id)).length;
        const catPct = catAchs.length > 0 ? Math.round((unlockedCount / catAchs.length) * 100) : 0;

        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.04 }}
            className="rounded-2xl bg-card p-6 shadow-card"
          >
            {/* Category header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CatIcon className="w-5 h-5 text-foreground/70" />
                <h3 className="font-serif text-base font-semibold text-foreground">{meta.label}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none text-muted-foreground/60 border border-muted-foreground/30 hover:text-muted-foreground hover:border-muted-foreground transition-colors shrink-0">
                      i
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-center text-xs">
                    {meta.description}
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs text-muted-foreground">{unlockedCount} / {catAchs.length}</span>
            </div>

            {/* Category progress bar */}
            <div className="w-full bg-muted/40 rounded-full h-1.5 mb-5 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${meta.gradient.replace('/20', '')} rounded-full transition-all duration-700`}
                style={{ width: `${catPct}%` }}
              />
            </div>

            {/* Tier rows */}
            <div className="space-y-3">
              {TIER_ORDER.map(tier => {
                const tierMeta = TIER_META[tier];
                const tierAchs = catAchs.filter(a => a.tier === tier);
                if (tierAchs.length === 0) return null;

                const tierUnlocked = tierAchs.filter(a => unlockedSet.has(a.id));
                const tierLocked   = tierAchs.filter(a => !unlockedSet.has(a.id));
                const tierPct = Math.round((tierUnlocked.length / tierAchs.length) * 100);
                const tierComplete = tierUnlocked.length === tierAchs.length;
                const tierIdx = TIER_ORDER.indexOf(tier);
                const prevTierAchs = tierIdx > 0 ? catAchs.filter(a => a.tier === TIER_ORDER[tierIdx - 1]) : [];
                const prevComplete = tierIdx === 0 || prevTierAchs.every(a => unlockedSet.has(a.id));
                const expandKey = `${cat}-${tier}`;
                const isExpanded = expandedTiers.has(expandKey);

                return (
                  <div
                    key={tier}
                    className={`rounded-xl border transition-opacity ${
                      prevComplete ? 'opacity-100' : 'opacity-40'
                    } ${tierMeta.borderColor} bg-gradient-to-r ${tierMeta.color}`}
                  >
                    {/* Tier label row — clickable to expand */}
                    <button
                      onClick={() => toggleTier(expandKey)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {!prevComplete && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                        {tierComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        <span className={`text-xs font-semibold uppercase tracking-wide ${tierMeta.badgeColor.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
                          {tierMeta.label}
                        </span>
                        {tierLocked.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {isExpanded ? 'hide all' : `show all ${tierAchs.length}`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted/40 rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full bg-current rounded-full transition-all duration-500"
                            style={{ width: `${tierPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{tierUnlocked.length}/{tierAchs.length}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Achievements grid */}
                    <div className="px-4 pb-4">
                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {/* Unlocked achievements — always visible */}
                        {tierUnlocked.map((a, i) => {
                          const AIcon = CATEGORY_ICONS[a.category];
                          return (
                            <motion.div
                              key={a.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: catIdx * 0.04 + i * 0.02 }}
                              className="rounded-lg p-3 text-center bg-background/60"
                            >
                              <div className="flex justify-center">
                                <AIcon className="w-6 h-6 text-foreground/80" />
                              </div>
                              <h4 className="mt-1 text-[11px] font-semibold text-foreground leading-tight">{a.title}</h4>
                              <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{a.description}</p>
                              <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                                {stored.unlockedDates[a.id]
                                  ? new Date(stored.unlockedDates[a.id]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                                  : 'Earned'}
                              </span>
                            </motion.div>
                          );
                        })}

                        {/* Locked achievements — next target always visible, rest only when expanded */}
                        {tierLocked.map((a, i) => {
                          const AIcon = CATEGORY_ICONS[a.category];
                          const showCard = i === 0 && prevComplete ? true : isExpanded;
                          if (!showCard) return null;
                          const isNext = i === 0 && prevComplete && !isExpanded;
                          return (
                            <div
                              key={a.id}
                              className={`rounded-lg p-3 text-center border border-border/30 ${
                                isNext
                                  ? 'bg-muted/20 opacity-60'
                                  : 'bg-muted/10 opacity-50'
                              }`}
                            >
                              <div className="flex justify-center">
                                <AIcon className="w-6 h-6 text-foreground/40" />
                              </div>
                              <h4 className="mt-1 text-[11px] font-semibold text-foreground leading-tight">{a.title}</h4>
                              <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{a.description}</p>
                              <span className="mt-1 inline-block text-[10px] text-muted-foreground">
                                {isNext ? 'Next target' : <Lock className="w-3 h-3 inline" />}
                              </span>
                            </div>
                          );
                        })}

                        {/* Collapsed count pill */}
                        {!isExpanded && tierLocked.length > (prevComplete ? 1 : 0) && (
                          <button
                            onClick={() => toggleTier(expandKey)}
                            className="rounded-lg p-3 text-center bg-muted/10 opacity-40 flex flex-col items-center justify-center gap-1 hover:opacity-60 transition-opacity"
                          >
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground">
                              +{tierLocked.length - (prevComplete ? 1 : 0)} more
                            </p>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}