import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Eye, Calendar, BookOpen, Brain, Target } from 'lucide-react';

interface Trade {
  id: string;
  date: string;
  result: 'win' | 'loss' | 'breakeven';
  emotion_before?: number;
  emotion_after?: number;
  loss_reason?: string;
  session_quality?: string;
  session_time?: string;
  cycle_phase?: string;
  strategy?: string;
  pnl?: number;
  [key: string]: any;
}

interface DailyHealth {
  mood?: number;
  sleep?: number;
  stress?: number;
  concentration?: number;
  nutrition?: string;
}

interface MonthlyStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgEmotionBefore: number;
  avgEmotionAfter: number;
  topErrorTypes: Array<{ reason: string; count: number }>;
  bestSessionTime: string;
  worstSessionTime: string;
  avgMood: number;
  avgSleep: number;
  avgStress: number;
  emotionalTrades: number;
  revengeTraded: number;
  phasePerformance: Record<string, number>;
  strategyPerformance: Record<string, number>;
}

export default function MonthlyReflection() {
  const navigate = useNavigate();
  const [monthYear, setMonthYear] = useState(new Date());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [healthData, setHealthData] = useState<DailyHealth[]>([]);
  
  // Subjective Questions
  const [mindsetRating, setMindsetRating] = useState(5);
  const [mindsetText, setMindsetText] = useState('');
  const [strategiesAdjust, setStrategiesAdjust] = useState('');
  const [goalsNextMonth, setGoalsNextMonth] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [actionItems, setActionItems] = useState('');

  const monthStr = monthYear.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Load and analyze all trade data for the month
  useEffect(() => {
    const currentMonth = monthYear.getMonth();
    const currentYear = monthYear.getFullYear();
    const trades: Trade[] = [];
    const allHealthData: DailyHealth[] = [];

    // Load all trades from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('cw_journal_')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw);

          // Check if date matches current month
          const dateMatch = key.match(/cw_journal_(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            const [, year, month, day] = dateMatch;
            if (parseInt(year) === currentYear && parseInt(month) - 1 === currentMonth) {
              if (data.trades && Array.isArray(data.trades)) {
                trades.push(...data.trades);
              }

              // Collect health data
              if (data.mood !== undefined || data.sleep !== undefined) {
                allHealthData.push({
                  mood: data.mood,
                  sleep: data.sleep,
                  stress: data.stress,
                  concentration: data.concentration,
                  nutrition: data.nutrition,
                });
              }
            }
          }
        } catch (e) {
          console.error('Error parsing trade data:', e);
        }
      }
    }

    // Calculate statistics
    if (trades.length > 0) {
      const wins = trades.filter(t => t.result === 'win').length;
      const winRate = (wins / trades.length) * 100;
      
      const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      const avgEmotionBefore =
        trades.reduce((sum, t) => sum + (t.emotion_before || 0), 0) / trades.length;
      const avgEmotionAfter =
        trades.reduce((sum, t) => sum + (t.emotion_after || 0), 0) / trades.length;

      // Analyze loss reasons
      const lossReasons = new Map<string, number>();
      trades
        .filter(t => t.result === 'loss')
        .forEach(t => {
          const reason = t.loss_reason || 'Unknown';
          lossReasons.set(reason, (lossReasons.get(reason) || 0) + 1);
        });

      const topErrorTypes = Array.from(lossReasons.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Session time analysis
      const sessionPerformance = new Map<string, { wins: number; total: number }>();
      trades.forEach(t => {
        const session = t.session_time || 'unknown';
        const entry = sessionPerformance.get(session) || { wins: 0, total: 0 };
        entry.total++;
        if (t.result === 'win') entry.wins++;
        sessionPerformance.set(session, entry);
      });

      let bestSessionTime = 'N/A';
      let worstSessionTime = 'N/A';
      let bestWR = 0;
      let worstWR = 100;

      sessionPerformance.forEach((perf, session) => {
        const wr = (perf.wins / perf.total) * 100;
        if (wr > bestWR) {
          bestWR = wr;
          bestSessionTime = session;
        }
        if (wr < worstWR) {
          worstWR = wr;
          worstSessionTime = session;
        }
      });

      // Phase performance
      const phasePerf = new Map<string, { wins: number; total: number }>();
      trades.forEach(t => {
        const phase = t.cycle_phase || 'unknown';
        const entry = phasePerf.get(phase) || { wins: 0, total: 0 };
        entry.total++;
        if (t.result === 'win') entry.wins++;
        phasePerf.set(phase, entry);
      });

      const phasePerformance: Record<string, number> = {};
      phasePerf.forEach((perf, phase) => {
        phasePerformance[phase] = (perf.wins / perf.total) * 100;
      });

      // Strategy performance
      const stratPerf = new Map<string, { wins: number; total: number }>();
      trades.forEach(t => {
        const strategy = t.strategy || 'Quick';
        const entry = stratPerf.get(strategy) || { wins: 0, total: 0 };
        entry.total++;
        if (t.result === 'win') entry.wins++;
        stratPerf.set(strategy, entry);
      });

      const strategyPerformance: Record<string, number> = {};
      stratPerf.forEach((perf, strategy) => {
        strategyPerformance[strategy] = (perf.wins / perf.total) * 100;
      });

      // Emotional trades (emotion_before > 6 or < 4)
      const emotionalTrades = trades.filter(
        t => (t.emotion_before || 5) > 7 || (t.emotion_before || 5) < 3
      ).length;

      // Revenge trading (setup changed during trade)
      const revengeTraded = trades.filter(t => t.setup_changed_during_trade).length;

      // Health averages
      const avgMood = allHealthData.reduce((sum, h) => sum + (h.mood || 0), 0) / allHealthData.length || 0;
      const avgSleep = allHealthData.reduce((sum, h) => sum + (h.sleep || 0), 0) / allHealthData.length || 0;
      const avgStress = allHealthData.reduce((sum, h) => sum + (h.stress || 0), 0) / allHealthData.length || 0;

      setStats({
        totalTrades: trades.length,
        winRate,
        totalPnL,
        avgEmotionBefore: Math.round(avgEmotionBefore * 10) / 10,
        avgEmotionAfter: Math.round(avgEmotionAfter * 10) / 10,
        topErrorTypes,
        bestSessionTime,
        worstSessionTime,
        avgMood: Math.round(avgMood * 10) / 10,
        avgSleep: Math.round(avgSleep * 10) / 10,
        avgStress: Math.round(avgStress * 10) / 10,
        emotionalTrades,
        revengeTraded,
        phasePerformance,
        strategyPerformance,
      });
    }

    setHealthData(allHealthData);
  }, [monthYear]);

  const handleSaveReflection = () => {
    const reflection = {
      month: monthStr,
      date: new Date().toISOString(),
      stats,
      mindsetRating,
      mindsetText,
      strategiesAdjust,
      goalsNextMonth,
      lessonsLearned,
      actionItems,
    };

    // Save to localStorage
    const reflections = JSON.parse(localStorage.getItem('cw_monthly_reflections') || '[]');
    reflections.push(reflection);
    localStorage.setItem('cw_monthly_reflections', JSON.stringify(reflections));

    // Show success and navigate back
    alert(`✅ Monthly Reflection for ${monthStr} saved!`);
    navigate('/dashboard');
  };

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No trades recorded for {monthStr}</p>
      </div>
    );
  }

  const phaseChartData = Object.entries(stats.phasePerformance).map(([phase, wr]) => ({
    phase,
    winRate: Math.round(wr),
  }));

  const strategyChartData = Object.entries(stats.strategyPerformance).map(([strategy, wr]) => ({
    strategy,
    winRate: Math.round(wr),
  }));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-2"
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Monthly Reflection</h1>
        </div>
        <p className="text-lg text-muted-foreground">{monthStr}</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-3xl font-bold tabular-nums">{stats.totalTrades}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={`border-${stats.winRate >= 50 ? 'accent' : 'destructive'}/20`}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className={`text-3xl font-bold tabular-nums ${stats.winRate >= 50 ? 'text-accent-foreground' : 'text-destructive'}`}>
                  {Math.round(stats.winRate)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={`border-${stats.totalPnL >= 0 ? 'accent' : 'destructive'}/20`}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-3xl font-bold tabular-nums ${stats.totalPnL >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                  {stats.totalPnL >= 0 ? '+' : ''} ${stats.totalPnL.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg Health Score</p>
                <p className="text-3xl font-bold tabular-nums">{Math.round((stats.avgMood + stats.avgSleep) / 2)}/10</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights Cards */}
      <div className="mb-8 space-y-4">
        {/* Emotional Trading Insight */}
        {stats.emotionalTrades > 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-amber-500/30 bg-amber-50/5">
              <CardContent className="flex items-start gap-4 pt-6">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Emotional Trading Detected</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.emotionalTrades} trades were made with high emotional states (anxiety/stress). Consider taking breaks during high-emotion periods.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Revenge Trading Insight */}
        {stats.revengeTraded > 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-start gap-4 pt-6">
                <AlertCircle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Revenge Trading Pattern</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.revengeTraded} trades had setup changes (revenge trading). Focus on maintaining discipline post-loss.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Best Session Time */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="flex items-start gap-4 pt-6">
              <TrendingUp className="h-5 w-5 text-accent-foreground mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Best Trading Session</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your highest win rate was during the <Badge variant="outline" className="mt-2">{stats.bestSessionTime}</Badge> session.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cycle Phase Performance */}
        {phaseChartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Win Rate by Cycle Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={phaseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="phase" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="winRate" fill="#8b5cf6">
                      {phaseChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.winRate >= 50 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Strategy Performance */}
        {strategyChartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Win Rate by Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={strategyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="strategy" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="winRate" fill="#8b5cf6">
                      {strategyChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.winRate >= 50 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Top Error Types */}
      {stats.topErrorTypes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Most Common Loss Reasons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topErrorTypes.map((error, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm font-medium">{error.reason}</span>
                  <Badge variant="secondary" className="tabular-nums">{error.count} times</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Subjective Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Reflection Questions</h2>
        </div>

        {/* Mindset Rating */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How satisfied are you with your psychological progress?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMindsetRating(num)}
                    className={`h-10 w-10 rounded-lg font-semibold transition ${
                      mindsetRating === num
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <Textarea
                value={mindsetText}
                onChange={(e) => setMindsetText(e.target.value)}
                placeholder="Describe your psychological development this month..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Strategy Adjustment */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Do you want to adjust any of your strategies?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={strategiesAdjust}
                onChange={(e) => setStrategiesAdjust(e.target.value)}
                placeholder="List strategy changes, parameter adjustments, or new ideas..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals for Next Month */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What are your 2-3 main goals for next month?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={goalsNextMonth}
                onChange={(e) => setGoalsNextMonth(e.target.value)}
                placeholder="Set specific, measurable trading goals..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Lessons Learned */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What were your top 3 lessons this month?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="Describe key insights and what you learned..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Action Items for Next Month</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                placeholder="List specific actions you'll take to improve..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <Button onClick={handleSaveReflection} className="flex-1" size="lg">
          💾 Save Reflection
        </Button>
        <Button onClick={() => navigate('/dashboard')} variant="outline" size="lg">
          Cancel
        </Button>
      </div>
    </div>
  );
}
