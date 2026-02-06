import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import RRROptimizationAnalysis from '@/components/RRROptimizationAnalysis';
import { Lightbulb, Plus, TrendingUp, Lock, Moon, Sprout, Zap, AlertTriangle, BarChart3 } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';

interface Trade {
  id: string;
  date: string;
  instrument: string;
  direction: 'long' | 'short';
  result: 'win' | 'loss' | 'breakeven' | '';
  pnl: number | null;
  rMultiple: number | null;
  status: 'open' | 'closed';
  cyclePhase?: string;
  strategy?: string;
}

interface DayData {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  percentage: number;
}

interface NewsItem {
  time: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  title: string;
}

export default function Statistics() {
  const navigate = useNavigate();
  const { hasFeature } = useSubscription();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newsEvents, setNewsEvents] = useState<NewsItem[]>([
    { time: '08:30', currency: 'USD', impact: 'high', title: 'Non-Farm Payrolls' },
    { time: '10:00', currency: 'EUR', impact: 'medium', title: 'CPI m/m' },
    { time: '14:00', currency: 'GBP', impact: 'low', title: 'Manufacturing PMI' },
    { time: '15:30', currency: 'USD', impact: 'high', title: 'Fed Chair Speech' },
  ]);

  useEffect(() => {
    loadAllTrades();
  }, []);

  const loadAllTrades = () => {
    const trades: Trade[] = [];
    
    // Use the same method as TradeJournal to iterate localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (key.startsWith("cw_journal_")) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw);
          if (data.trades && Array.isArray(data.trades)) {
            data.trades.forEach((t: any) => {
              trades.push({
                ...t,
                status: t.status || (t.result && t.result !== '' ? 'closed' : 'open')
              });
            });
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
    
    setAllTrades(trades);
  };

  const calendarData = useMemo(() => {
    const dataByDate: { [key: string]: DayData } = {};
    
    allTrades.forEach((trade) => {
      if (trade.status === 'closed' && trade.date) {
        if (!dataByDate[trade.date]) {
          dataByDate[trade.date] = {
            date: trade.date,
            pnl: 0,
            trades: 0,
            wins: 0,
            losses: 0,
            percentage: 0,
          };
        }
        
        dataByDate[trade.date].trades += 1;
        if (trade.pnl !== null) {
          dataByDate[trade.date].pnl += trade.pnl;
        }
        if (trade.result === 'win') dataByDate[trade.date].wins += 1;
        if (trade.result === 'loss') dataByDate[trade.date].losses += 1;
      }
    });

    // Calculate win rate percentage
    Object.values(dataByDate).forEach((day) => {
      const total = day.wins + day.losses;
      day.percentage = total > 0 ? (day.wins / total) * 100 : 0;
    });

    return dataByDate;
  }, [allTrades]);

  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthTrades = allTrades.filter((t) => {
      if (!t.date || t.status !== 'closed') return false;
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalPnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = monthTrades.filter((t) => t.result === 'win').length;
    const losses = monthTrades.filter((t) => t.result === 'loss').length;
    const total = wins + losses;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

    return {
      totalTrades: monthTrades.length,
      totalPnl,
      wins,
      losses,
      winRate,
      percentage: totalPnl >= 0 ? '+' : '',
    };
  }, [allTrades, currentMonth]);

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i).toISOString().slice(0, 10),
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
      });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i).toISOString().slice(0, 10),
        dayNumber: i,
        isCurrentMonth: true,
      });
    }
    
    // Next month's days
    const remainingDays = 42 - days.length; // 6 rows x 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i).toISOString().slice(0, 10),
        dayNumber: i,
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const formatMonthYear = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const yearlyPerformance = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((monthName, monthIndex) => {
      const monthTrades = allTrades.filter((t) => {
        if (!t.date || t.status !== 'closed') return false;
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && d.getMonth() === monthIndex;
      });

      const pnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const trades = monthTrades.length;

      return { month: monthName, pnl, trades };
    });

    const ytdPnl = monthlyData.reduce((sum, m) => sum + m.pnl, 0);
    const ytdTrades = monthlyData.reduce((sum, m) => sum + m.trades, 0);

    return { months: monthlyData, ytdPnl, ytdTrades };
  }, [allTrades, currentYear]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allTrades.forEach((t) => {
      if (t.date) {
        const year = new Date(t.date).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allTrades]);

  // Chart data calculations
  const equityCurveData = useMemo(() => {
    const sortedTrades = [...allTrades]
      .filter(t => t.status === 'closed' && t.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let cumulative = 0;
    return sortedTrades.map(trade => {
      cumulative += trade.pnl || 0;
      return {
        date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: Number(cumulative.toFixed(2))
      };
    });
  }, [allTrades]);

  const winRateOverTimeData = useMemo(() => {
    const sortedTrades = [...allTrades]
      .filter(t => t.status === 'closed' && t.date && (t.result === 'win' || t.result === 'loss'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const data: { trade: number; winRate: number }[] = [];
    let wins = 0;
    let total = 0;
    
    sortedTrades.forEach((trade, index) => {
      total++;
      if (trade.result === 'win') wins++;
      if ((index + 1) % 5 === 0 || index === sortedTrades.length - 1) {
        data.push({
          trade: index + 1,
          winRate: Number(((wins / total) * 100).toFixed(1))
        });
      }
    });
    
    return data;
  }, [allTrades]);

  const dailyPnlData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    allTrades
      .filter(t => t.status === 'closed' && t.date)
      .forEach(trade => {
        const date = trade.date.split('T')[0];
        dailyMap.set(date, (dailyMap.get(date) || 0) + (trade.pnl || 0));
      });
    
    return Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, pnl]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: Number(pnl.toFixed(2))
      }));
  }, [allTrades]);

  const instrumentPerformanceData = useMemo(() => {
    const instrumentMap = new Map<string, { pnl: number; trades: number; wins: number }>();
    allTrades
      .filter(t => t.status === 'closed')
      .forEach(trade => {
        const inst = trade.instrument || 'Unknown';
        const current = instrumentMap.get(inst) || { pnl: 0, trades: 0, wins: 0 };
        instrumentMap.set(inst, {
          pnl: current.pnl + (trade.pnl || 0),
          trades: current.trades + 1,
          wins: current.wins + (trade.result === 'win' ? 1 : 0)
        });
      });
    
    return Array.from(instrumentMap.entries())
      .map(([name, stats]) => ({
        name,
        pnl: Number(stats.pnl.toFixed(2)),
        trades: stats.trades,
        winRate: Number(((stats.wins / stats.trades) * 100).toFixed(1))
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [allTrades]);

  const winLossDistribution = useMemo(() => {
    const wins = allTrades.filter(t => t.status === 'closed' && t.result === 'win').length;
    const losses = allTrades.filter(t => t.status === 'closed' && t.result === 'loss').length;
    const breakeven = allTrades.filter(t => t.status === 'closed' && t.result === 'breakeven').length;
    
    return [
      { name: 'Wins', value: wins, color: 'hsl(var(--chart-1))' },
      { name: 'Losses', value: losses, color: 'hsl(var(--chart-2))' },
      { name: 'Breakeven', value: breakeven, color: 'hsl(var(--chart-3))' }
    ].filter(item => item.value > 0);
  }, [allTrades]);

  const days = getDaysInMonth();
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Empty state when no trades at all
  if (allTrades.length === 0) {
    return (
      <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-2">Trade Statistics</h1>
            <p className="text-sm text-muted-foreground">Analyze your trading performance and upcoming market events</p>
          </div>

          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6 relative">
              <Card className="rounded-2xl shadow-soft border">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-xl font-serif font-semibold">No data yet</CardTitle>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-fit rounded-full bg-primary/10 p-6 mb-6">
                    <TrendingUp className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Start logging your trades to see calendar analytics and performance patterns.
                  </p>
                  <Button onClick={() => navigate('/new-trade')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Log Your First Trade
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-6">
              <Card className="rounded-2xl shadow-soft border">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-xl font-serif font-semibold">No data yet</CardTitle>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-fit rounded-full bg-primary/10 p-6 mb-6">
                    <TrendingUp className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Start logging your trades to see equity curves, win rate development, and trading metrics.
                  </p>
                  <Button onClick={() => navigate('/new-trade')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Log Your First Trade
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <Card className="rounded-2xl shadow-soft border">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-xl font-serif font-semibold">No data yet</CardTitle>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-fit rounded-full bg-primary/10 p-6 mb-6">
                    <TrendingUp className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Start logging your trades to see RRR analysis and cycle phase performance insights.
                  </p>
                  <Button onClick={() => navigate('/new-trade')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Log Your First Trade
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="mx-auto max-w-7xl p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-2">Trade Statistics</h1>
          <p className="text-sm text-muted-foreground">Analyze your trading performance and upcoming market events</p>
        </div>

        {/* Monthly Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-2xl shadow-soft border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{monthStats.totalTrades}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthStats.wins}W / {monthStats.losses}L
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{monthStats.winRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthStats.wins} wins / {monthStats.wins + monthStats.losses} total
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthStats.totalPnl >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                {monthStats.percentage}{monthStats.totalPnl.toFixed(2)} $
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthStats.percentage}{((monthStats.totalPnl / 10000) * 100).toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthStats.totalPnl >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                {monthStats.totalTrades > 0 ? (monthStats.totalPnl / monthStats.totalTrades).toFixed(2) : '0.00'} $
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per trade average</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid max-w-md grid-cols-3">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>
          </div>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6 relative">
            {!hasFeature('full_statistics') && (
              <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                <Card className="max-w-md w-full">
                  <CardContent className="p-8 text-center">
                    <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-xl mb-2">Premium Feature</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Upgrade to Premium for detailed calendar analytics and performance insights.
                    </p>
                    <Button onClick={() => navigate('/pricing')} size="lg" className="w-full">
                      Upgrade to Premium - €9.99/mo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            <div className={!hasFeature('full_statistics') ? 'blur-sm pointer-events-none' : ''}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="rounded-2xl shadow-soft border lg:col-span-2">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-serif font-semibold">{formatMonthYear()}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => changeMonth(-1)}
                    className="rounded-full h-8 w-8 p-0"
                  >
                    ←
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => changeMonth(1)}
                    className="rounded-full h-8 w-8 p-0"
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                <div className="text-center text-sm font-medium text-muted-foreground py-2">
                  Total
                </div>
              </div>

              {/* Calendar grid */}
              <div className="space-y-2">
                {weeks.map((week, weekIdx) => {
                  // Calculate weekly P&L
                  const weeklyPnl = week.reduce((sum, day) => {
                    const dayData = calendarData[day.date];
                    return sum + (dayData?.pnl || 0);
                  }, 0);
                  const weekHasData = week.some(day => calendarData[day.date]?.trades > 0);
                  const weekIsPositive = weeklyPnl >= 0;

                  return (
                    <div key={weekIdx} className="grid grid-cols-8 gap-2">
                      {week.map((day) => {
                          const dayData = calendarData[day.date];
                          const hasData = dayData && dayData.trades > 0;
                          const isPositive = dayData && dayData.pnl >= 0;
                          const isSelected = selectedDate === day.date;

                          return (
                            <div
                              key={day.date}
                              onClick={() => navigate(`/journal?date=${day.date}`)}
                              className={`
                                relative min-h-[80px] p-2 rounded-lg border cursor-pointer transition-all
                                ${!day.isCurrentMonth ? 'opacity-40 bg-muted/5' : 'bg-card'}
                                ${hasData && isPositive ? 'border-accent/40 bg-accent/50' : ''}
                                ${hasData && !isPositive ? 'border-destructive/40 bg-destructive/5' : ''}
                                ${isSelected ? 'ring-2 ring-primary' : ''}
                                hover:shadow-md hover:scale-105
                              `}
                            >
                              <div className="text-sm font-medium text-foreground mb-1">
                                {day.dayNumber}
                              </div>
                              {hasData && (
                                <div className="space-y-1">
                                  <div className={`text-xs font-bold ${isPositive ? 'text-accent-foreground' : 'text-destructive'}`}>
                                    {isPositive ? '+' : ''}{dayData.pnl.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {dayData.percentage.toFixed(0)}%
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      {/* Weekly P&L */}
                      <div className={`min-h-[80px] p-2 rounded-lg border flex flex-col items-center justify-center ${
                        weekHasData
                          ? weekIsPositive 
                            ? 'border-accent/40 bg-accent/50' 
                            : 'border-destructive/40 bg-destructive/5'
                          : 'border-border/30 bg-muted/5'
                      }`}>
                        {weekHasData ? (
                          <>
                            <div className={`text-xs font-bold ${weekIsPositive ? 'text-accent-foreground' : 'text-destructive'}`}>
                              {weekIsPositive ? '+' : ''}{weeklyPnl.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">P&L</div>
                          </>
                        ) : (
                          <div className="text-xl text-muted-foreground/30">-</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Empty third column for future use */}
          <div className="space-y-4">
            {/* Performance Metrics */}
            <Card className="rounded-2xl shadow-soft border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif font-semibold">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const monthTrades = allTrades.filter(t => {
                    if (t.status !== 'closed' || !t.date) return false;
                    const d = new Date(t.date);
                    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                  });
                  
                  // Calculate win/loss streaks
                  let currentStreak = 0;
                  let longestWinStreak = 0;
                  let longestLossStreak = 0;
                  let tempWinStreak = 0;
                  let tempLossStreak = 0;
                  
                  monthTrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(t => {
                    if (t.result === 'win') {
                      tempWinStreak++;
                      tempLossStreak = 0;
                      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
                    } else if (t.result === 'loss') {
                      tempLossStreak++;
                      tempWinStreak = 0;
                      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
                    }
                  });
                  
                  // Profit Factor
                  const totalWins = monthTrades.filter(t => t.result === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0);
                  const totalLosses = Math.abs(monthTrades.filter(t => t.result === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0));
                  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
                  
                  // Average RRR
                  const rrrTrades = monthTrades.filter(t => t.rMultiple !== null && t.rMultiple !== undefined);
                  const avgRrr = rrrTrades.length > 0 ? rrrTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / rrrTrades.length : 0;
                  
                  return (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Longest Win Streak</span>
                        <span className="text-sm font-bold text-accent-foreground">{longestWinStreak}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Longest Loss Streak</span>
                        <span className="text-sm font-bold text-destructive">{longestLossStreak}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Profit Factor</span>
                        <span className={`text-sm font-bold ${profitFactor >= 2 ? 'text-accent-foreground' : profitFactor >= 1 ? 'text-accent-foreground' : 'text-destructive'}`}>
                          {profitFactor >= 999 ? '∞' : profitFactor.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Avg RRR</span>
                        <span className="text-sm font-bold text-foreground">
                          {avgRrr > 0 ? `1:${avgRrr.toFixed(2)}` : '-'}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Best/Worst Days */}
            <Card className="rounded-2xl shadow-soft border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif font-semibold">Best & Worst Days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const monthDays = Object.values(calendarData).filter(day => {
                    const d = new Date(day.date);
                    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                  });
                  
                  const bestDays = [...monthDays].sort((a, b) => b.pnl - a.pnl).slice(0, 3);
                  const worstDays = [...monthDays].sort((a, b) => a.pnl - b.pnl).slice(0, 3);
                  
                  return (
                    <>
                      <div>
                        <div className="text-xs font-semibold text-accent-foreground mb-2">Top 3 Best</div>
                        {bestDays.length > 0 ? bestDays.map((day, i) => (
                          <div key={day.date} className="flex justify-between items-center py-1.5 text-xs">
                            <span className="text-muted-foreground">
                              {new Date(day.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="font-bold text-accent-foreground">+{day.pnl.toFixed(2)}</span>
                          </div>
                        )) : <div className="text-xs text-muted-foreground py-2">No data yet</div>}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-destructive mb-2">Top 3 Worst</div>
                        {worstDays.length > 0 ? worstDays.filter(d => d.pnl < 0).map((day, i) => (
                          <div key={day.date} className="flex justify-between items-center py-1.5 text-xs">
                            <span className="text-muted-foreground">
                              {new Date(day.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="font-bold text-destructive">{day.pnl.toFixed(2)}</span>
                          </div>
                        )) : <div className="text-xs text-muted-foreground py-2">No losses yet!</div>}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Cycle Phase Analysis - Always accessible for free users */}
            <div className="relative">
              <Card className="rounded-2xl shadow-soft border bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-serif font-semibold flex items-center gap-2">
                    Cycle Phase Analysis
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const monthTrades = allTrades.filter(t => {
                    if (t.status !== 'closed' || !t.date) return false;
                    const d = new Date(t.date);
                    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                  });
                  
                  const phases = ['menstruation', 'follicular', 'ovulation', 'luteal'];
                  const phaseNames = {
                    menstruation: 'Menstruation',
                    follicular: 'Follicular',
                    ovulation: 'Ovulation',
                    luteal: 'Luteal'
                  };
                  
                  const phaseStats = phases.map(phase => {
                    const phaseTrades = monthTrades.filter(t => t.cyclePhase === phase);
                    const wins = phaseTrades.filter(t => t.result === 'win').length;
                    const total = phaseTrades.filter(t => t.result === 'win' || t.result === 'loss').length;
                    const winRate = total > 0 ? (wins / total) * 100 : 0;
                    const avgPnl = phaseTrades.length > 0 
                      ? phaseTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / phaseTrades.length 
                      : 0;
                    
                    return { phase, trades: phaseTrades.length, winRate, avgPnl };
                  });
                  
                  return phaseStats.length > 0 ? (
                    <div className="space-y-2">
                      {phaseStats.map(stat => (
                        <div key={stat.phase} className="bg-card/50 rounded-lg p-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{phaseNames[stat.phase as keyof typeof phaseNames]}</span>
                            <span className="text-xs text-muted-foreground">{stat.trades} trades</span>
                          </div>
                          {stat.trades > 0 && (
                            <>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Win Rate:</span>
                                <span className={`font-bold ${stat.winRate >= 60 ? 'text-accent-foreground' : 'text-foreground'}`}>
                                  {stat.winRate.toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Avg P&L:</span>
                                <span className={`font-bold ${stat.avgPnl >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                                  {stat.avgPnl >= 0 ? '+' : ''}{stat.avgPnl.toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Track your cycle to see phase-specific insights!
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            </div>

            {/* Trading Patterns */}
            <Card className="rounded-2xl shadow-soft border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif font-semibold">Trading Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const monthTrades = allTrades.filter(t => {
                    if (t.status !== 'closed' || !t.date) return false;
                    const d = new Date(t.date);
                    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                  });
                  
                  // Best weekday
                  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const dayStats = weekdays.map((day, idx) => {
                    const dayTrades = monthTrades.filter(t => new Date(t.date).getDay() === idx);
                    const wins = dayTrades.filter(t => t.result === 'win').length;
                    const total = dayTrades.filter(t => t.result === 'win' || t.result === 'loss').length;
                    return { day, winRate: total > 0 ? (wins / total) * 100 : 0, trades: dayTrades.length };
                  }).filter(d => d.trades > 0).sort((a, b) => b.winRate - a.winRate);
                  
                  // Best instrument
                  const instrumentMap = new Map<string, { wins: number; total: number; pnl: number }>();
                  monthTrades.forEach(t => {
                    const inst = t.instrument || 'Unknown';
                    if (!instrumentMap.has(inst)) {
                      instrumentMap.set(inst, { wins: 0, total: 0, pnl: 0 });
                    }
                    const stats = instrumentMap.get(inst)!;
                    if (t.result === 'win') stats.wins++;
                    if (t.result === 'win' || t.result === 'loss') stats.total++;
                    stats.pnl += t.pnl || 0;
                  });
                  
                  const bestInstrument = Array.from(instrumentMap.entries())
                    .map(([inst, stats]) => ({ 
                      instrument: inst, 
                      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
                      pnl: stats.pnl,
                      trades: stats.total
                    }))
                    .sort((a, b) => b.pnl - a.pnl)[0];
                  
                  // Best strategy
                  const strategyMap = new Map<string, { wins: number; total: number; pnl: number }>();
                  monthTrades.forEach(t => {
                    const strat = t.strategy || 'Quick Trade';
                    if (!strategyMap.has(strat)) {
                      strategyMap.set(strat, { wins: 0, total: 0, pnl: 0 });
                    }
                    const stats = strategyMap.get(strat)!;
                    if (t.result === 'win') stats.wins++;
                    if (t.result === 'win' || t.result === 'loss') stats.total++;
                    stats.pnl += t.pnl || 0;
                  });
                  
                  const bestStrategy = Array.from(strategyMap.entries())
                    .map(([strat, stats]) => ({ 
                      strategy: strat, 
                      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
                      trades: stats.total
                    }))
                    .sort((a, b) => b.winRate - a.winRate)[0];
                  
                  return (
                    <>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Best Weekday</div>
                        {dayStats.length > 0 ? (
                          <div className="bg-accent/50 border border-accent/40 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-foreground">{dayStats[0].day}</span>
                              <span className="text-sm font-bold text-accent-foreground">
                                {dayStats[0].winRate.toFixed(0)}% WR
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {dayStats[0].trades} trades
                            </div>
                          </div>
                        ) : <div className="text-xs text-muted-foreground">No data yet</div>}
                      </div>
                      
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Best Instrument</div>
                        {bestInstrument ? (
                          <div className="bg-accent/50 border border-accent/40 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-foreground">{bestInstrument.instrument}</span>
                              <span className="text-sm font-bold text-accent-foreground">
                                +{bestInstrument.pnl.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {bestInstrument.winRate.toFixed(0)}% WR • {bestInstrument.trades} trades
                            </div>
                          </div>
                        ) : <div className="text-xs text-muted-foreground">No data yet</div>}
                      </div>
                      
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Best Strategy</div>
                        {bestStrategy ? (
                          <div className="bg-accent/50 border border-accent/40 rounded-lg p-3">
                            <div className="text-sm font-bold text-foreground mb-1">{bestStrategy.strategy}</div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">{bestStrategy.trades} trades</span>
                              <span className="font-bold text-accent-foreground">
                                {bestStrategy.winRate.toFixed(0)}% WR
                              </span>
                            </div>
                          </div>
                        ) : <div className="text-xs text-muted-foreground">No data yet</div>}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Drawdown & Recovery */}
            <Card className="rounded-2xl shadow-soft border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif font-semibold">Drawdown Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const monthTrades = allTrades.filter(t => {
                    if (t.status !== 'closed' || !t.date) return false;
                    const d = new Date(t.date);
                    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  
                  let runningPnl = 0;
                  let peak = 0;
                  let maxDrawdown = 0;
                  let currentDrawdown = 0;
                  
                  monthTrades.forEach(t => {
                    runningPnl += t.pnl || 0;
                    if (runningPnl > peak) peak = runningPnl;
                    currentDrawdown = peak - runningPnl;
                    if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
                  });
                  
                  const isInDrawdown = currentDrawdown > 0;
                  
                  return (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Max Drawdown</span>
                        <span className="text-sm font-bold text-destructive">
                          {maxDrawdown > 0 ? `-${maxDrawdown.toFixed(2)}` : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Current Drawdown</span>
                        <span className={`text-sm font-bold ${isInDrawdown ? 'text-destructive' : 'text-accent-foreground'}`}>
                          {isInDrawdown ? `-${currentDrawdown.toFixed(2)}` : 'Recovered!'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Peak P&L</span>
                        <span className="text-sm font-bold text-accent-foreground">
                          +{peak.toFixed(2)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDate && calendarData[selectedDate] && (
          <Card className="rounded-2xl shadow-soft border mt-6">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl font-serif font-semibold">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
                  <div className="text-2xl font-bold text-foreground">
                    {calendarData[selectedDate].trades}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-foreground">
                    {calendarData[selectedDate].percentage.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">P&L</div>
                  <div
                    className={`text-2xl font-bold ${
                      calendarData[selectedDate].pnl >= 0 ? 'text-accent-foreground' : 'text-destructive'
                    }`}
                  >
                    {calendarData[selectedDate].pnl >= 0 ? '+' : ''}
                    {calendarData[selectedDate].pnl.toFixed(2)} $
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">W/L</div>
                  <div className="text-2xl font-bold text-foreground">
                    {calendarData[selectedDate].wins}/{calendarData[selectedDate].losses}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Yearly Performance */}
            </div>
        <Card className="rounded-2xl shadow-soft border mt-6">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-serif font-semibold">Yearly Performance</CardTitle>
              <div className="flex gap-2">
                {availableYears.map((year) => (
                  <Button
                    key={year}
                    variant={year === currentYear ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentYear(year)}
                    className="rounded-full px-3"
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2 items-start">
              {/* Year label */}
              <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 px-4 py-3 flex items-center justify-center min-w-[70px] shadow-md">
                <div className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  {currentYear}
                </div>
              </div>

              <div className="flex-1 flex gap-1.5">
                {/* Month boxes */}
                {yearlyPerformance.months.map((month, index) => (
                  <div key={month.month} className="flex-1 min-w-0 flex flex-col">
                    <div
                      onClick={() => {
                        setCurrentMonth(new Date(currentYear, index, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`rounded-md border p-3 flex flex-col items-center justify-center min-h-[90px] cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                        month.trades === 0
                          ? 'bg-muted/5 border-border/30'
                          : month.pnl >= 0
                          ? 'bg-accent/5 border-accent/40 hover:bg-accent/10'
                          : 'bg-destructive/5 border-destructive/40 hover:bg-destructive/10'
                      }`}
                    >
                      <div className="text-[10px] font-medium text-muted-foreground mb-2">
                        {month.month}
                      </div>
                      {month.trades > 0 ? (
                        <>
                          <div
                            className={`text-sm font-bold ${
                              month.pnl >= 0 ? 'text-accent-foreground' : 'text-destructive'
                            }`}
                          >
                            {month.pnl >= 0 ? '+' : ''}{month.pnl.toFixed(0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {month.trades}
                          </div>
                        </>
                      ) : (
                        <div className="text-xl text-muted-foreground/30">-</div>
                      )}
                    </div>
                  </div>
                ))}

                {/* YTD box */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div
                    className={`rounded-md border-2 p-3 flex flex-col items-center justify-center min-h-[90px] shadow-md ${
                      yearlyPerformance.ytdPnl >= 0
                        ? 'bg-accent/15 border-accent'
                        : 'bg-destructive/15 border-destructive'
                    }`}
                  >
                    <div className="text-[10px] font-semibold text-foreground mb-2">
                      YTD
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        yearlyPerformance.ytdPnl >= 0 ? 'text-accent-foreground' : 'text-destructive'
                      }`}
                    >
                      {yearlyPerformance.ytdPnl >= 0 ? '+' : ''}{yearlyPerformance.ytdPnl.toFixed(0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {yearlyPerformance.ytdTrades}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            {/* Equity Curve */}
            <Card className="rounded-2xl shadow-soft border">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-serif font-semibold">Equity Curve</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {equityCurveData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={equityCurveData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-12">No trade data available</div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Win Rate Development */}
              <Card className="rounded-2xl shadow-soft border">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-lg font-serif font-semibold">Win Rate Development</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {winRateOverTimeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={winRateOverTimeData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis 
                          dataKey="trade" 
                          label={{ value: 'Trade #', position: 'insideBottom', offset: -5 }}
                          className="text-xs text-muted-foreground"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          label={{ value: 'Win Rate %', angle: -90, position: 'insideLeft' }}
                          className="text-xs text-muted-foreground"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="winRate" 
                          stroke="hsl(var(--chart-1))" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">No data</div>
                  )}
                </CardContent>
              </Card>

              {/* Win/Loss Distribution */}
              <Card className="rounded-2xl shadow-soft border">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-lg font-serif font-semibold">Win/Loss Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {winLossDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={winLossDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {winLossDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">No data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily P&L */}
            <Card className="rounded-2xl shadow-soft border">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-serif font-semibold">Daily P&L (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {dailyPnlData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyPnlData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="pnl" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-12">No trade data available</div>
                )}
              </CardContent>
            </Card>

            {/* Instrument Performance */}
            <Card className="rounded-2xl shadow-soft border">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-serif font-semibold">Instrument Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {instrumentPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={instrumentPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis 
                        dataKey="name" 
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="pnl" 
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-12">No trade data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {/* RRR Optimization Analysis */}
            <div className="relative">
              {!hasFeature('full_statistics') && (
                <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                  <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                      <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold text-xl mb-2">Premium Feature</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Upgrade to Premium for detailed RRR optimization analysis and performance insights.
                      </p>
                      <Button onClick={() => navigate('/#pricing')} size="lg" className="w-full">
                        Upgrade to Premium - €9.99/mo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className={!hasFeature('full_statistics') ? 'blur-sm pointer-events-none' : ''}>
                <RRROptimizationAnalysis trades={allTrades} />
              </div>
            </div>

            {/* Cycle Phase Performance */}
            <div className="relative">
              {!hasFeature('full_statistics') && (
                <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                  <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                      <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold text-xl mb-2">Premium Feature</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Upgrade to Premium for cycle phase performance analysis.
                      </p>
                      <Button onClick={() => navigate('/#pricing')} size="lg" className="w-full">
                        Upgrade to Premium - €9.99/mo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              <Card className={`rounded-2xl shadow-soft border ${!hasFeature('full_statistics') ? 'blur-sm pointer-events-none' : ''}`}>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-xl font-serif font-semibold">Cycle Phase Performance</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analyze how your trading performance varies across different cycle phases
                  </p>
                </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {[
                    { phase: 'Menstrual', icon: 'moon', color: 'from-gray-500/20 to-gray-600/20', borderColor: 'border-gray-500' },
                    { phase: 'Follicular', icon: 'sprout', color: 'from-green-500/20 to-emerald-500/20', borderColor: 'border-green-500' },
                    { phase: 'Ovulatory', icon: 'zap', color: 'from-yellow-500/20 to-orange-500/20', borderColor: 'border-yellow-500' },
                    { phase: 'Luteal', icon: 'moon', color: 'from-purple-500/20 to-indigo-500/20', borderColor: 'border-purple-500' }
                  ].map(({ phase, icon, color, borderColor }) => {
                    const phaseTrades = allTrades.filter(t => t.cyclePhase === phase && t.status === 'closed');
                    const wins = phaseTrades.filter(t => t.result === 'win').length;
                    const losses = phaseTrades.filter(t => t.result === 'loss').length;
                    const winRate = phaseTrades.length > 0 ? ((wins / phaseTrades.length) * 100).toFixed(1) : '0';
                    const avgPnl = phaseTrades.length > 0 
                      ? (phaseTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / phaseTrades.length).toFixed(2)
                      : '0';
                    
                    return (
                      <div key={phase} className={`p-4 rounded-xl bg-gradient-to-br ${color} border-2 ${borderColor}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                          {icon === 'moon' && <Moon className="h-6 w-6" />}
                          {icon === 'sprout' && <Sprout className="h-6 w-6" />}
                          {icon === 'zap' && <Zap className="h-6 w-6" />}
                            <h3 className="font-semibold text-lg">{phase}</h3>
                          </div>
                          <Badge variant="outline">{phaseTrades.length} trades</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Win Rate</p>
                            <p className="text-lg font-bold text-accent-foreground">{winRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg P&L</p>
                            <p className={`text-lg font-bold ${parseFloat(avgPnl) >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                              {parseFloat(avgPnl) >= 0 ? '+' : ''}{avgPnl}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">W/L</p>
                            <p className="text-lg font-bold">{wins}/{losses}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Trading Patterns by Cycle */}
            <div className="relative">
              {!hasFeature('full_statistics') && (
                <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                  <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                      <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold text-xl mb-2">Premium Feature</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Upgrade to Premium for detailed trading patterns analysis.
                      </p>
                      <Button onClick={() => navigate('/#pricing')} size="lg" className="w-full">
                        Upgrade to Premium - €9.99/mo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className={`grid gap-6 md:grid-cols-2 ${!hasFeature('full_statistics') ? 'blur-sm pointer-events-none' : ''}`}>
              <Card className="rounded-2xl shadow-soft border">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-lg font-serif font-semibold">Best Trading Days by Phase</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'].map(phase => {
                      const phaseTrades = allTrades.filter(t => t.cyclePhase === phase && t.status === 'closed');
                      const tradesByDay = phaseTrades.reduce((acc, t) => {
                        const day = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
                        acc[day] = (acc[day] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const bestDay = Object.entries(tradesByDay).sort((a, b) => b[1] - a[1])[0];
                      
                      return (
                        <div key={phase} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{phase}</span>
                          <span className="text-sm text-muted-foreground">
                            {bestDay ? `${bestDay[0]} (${bestDay[1]} trades)` : 'No data'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-soft border">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-lg font-serif font-semibold">Risk-Taking Behavior</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'].map(phase => {
                      const phaseTrades = allTrades.filter(t => t.cyclePhase === phase && t.status === 'closed');
                      const avgRisk = phaseTrades.length > 0
                        ? (phaseTrades.reduce((sum, t) => sum + Math.abs(t.rMultiple || 0), 0) / phaseTrades.length).toFixed(2)
                        : '0';
                      
                      return (
                        <div key={phase} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{phase}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${Math.min(parseFloat(avgRisk) * 20, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">{avgRisk}R</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>

            {/* Strategy Performance by Cycle */}
            <div className="relative">
              {!hasFeature('full_statistics') && (
                <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                  <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                      <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold text-xl mb-2">Premium Feature</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Upgrade to Premium for strategy performance by cycle phase analysis.
                      </p>
                      <Button onClick={() => navigate('/#pricing')} size="lg" className="w-full">
                        Upgrade to Premium - €9.99/mo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              <Card className={`rounded-2xl shadow-soft border ${!hasFeature('full_statistics') ? 'blur-sm pointer-events-none' : ''}`}>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-xl font-serif font-semibold">Strategy Performance by Cycle Phase</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Which strategies work best during each phase?
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'].map(phase => {
                      const phaseTrades = allTrades.filter(t => t.cyclePhase === phase && t.status === 'closed' && t.strategy);
                      const strategyStats = phaseTrades.reduce((acc, t) => {
                        const strategy = t.strategy || 'Unknown';
                        if (!acc[strategy]) {
                          acc[strategy] = { wins: 0, total: 0 };
                        }
                        acc[strategy].total++;
                        if (t.result === 'win') acc[strategy].wins++;
                        return acc;
                      }, {} as Record<string, { wins: number; total: number }>);

                      const bestStrategy = Object.entries(strategyStats)
                        .map(([name, stats]) => ({
                          name,
                          winRate: ((stats.wins / stats.total) * 100).toFixed(0),
                          trades: stats.total
                        }))
                        .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0];

                      return (
                        <div key={phase} className="p-4 rounded-xl bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{phase}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {bestStrategy 
                                  ? `${bestStrategy.name} performs best (${bestStrategy.winRate}% WR, ${bestStrategy.trades} trades)`
                                  : 'No strategy data available'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="rounded-2xl shadow-soft border bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(() => {
                    const phaseStats = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'].map(phase => {
                      const trades = allTrades.filter(t => t.cyclePhase === phase && t.status === 'closed');
                      const wins = trades.filter(t => t.result === 'win').length;
                      const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
                      return { phase, winRate, trades: trades.length };
                    }).sort((a, b) => b.winRate - a.winRate);

                    const bestPhase = phaseStats[0];
                    const worstPhase = phaseStats[phaseStats.length - 1];

                    return (
                      <>
                        {bestPhase && bestPhase.trades > 5 && (
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/20 border border-accent/40">
                            <Zap className="h-6 w-6 text-accent-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold">Optimize Your Peak Phase</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Your {bestPhase.phase} phase shows the highest win rate ({bestPhase.winRate.toFixed(1)}%). 
                                Consider taking larger positions or more setups during this phase.
                              </p>
                            </div>
                          </div>
                        )}

                        {worstPhase && worstPhase.trades > 5 && worstPhase.winRate < 50 && (
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/20 border border-destructive/40">
                            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold">Protect During Low Phase</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Your {worstPhase.phase} phase shows lower performance ({worstPhase.winRate.toFixed(1)}% WR). 
                                Consider reducing position sizes or taking a break during this time.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                          <Lightbulb className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Track & Adapt</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Continue logging your cycle phase with each trade to build more personalized insights over time.
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
