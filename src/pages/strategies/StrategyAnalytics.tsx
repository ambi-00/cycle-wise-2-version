import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data - replace with real data from Supabase
const mockTrades = [
  {
    id: "1",
    pair: "EURUSD",
    direction: "Long",
    outcome: "Win",
    rValue: 2.5,
    entryPrice: 1.0850,
    exitPrice: 1.0950,
    date: "2026-01-28",
    time: "08:30",
    dayOfWeek: "Tuesday",
    mistakes: [],
    confirmations: ["Market structure shift", "FVG mitigation", "Kill zone timing"],
  },
  {
    id: "2",
    pair: "GBPUSD",
    direction: "Short",
    outcome: "Loss",
    rValue: -1.0,
    entryPrice: 1.2650,
    exitPrice: 1.2680,
    date: "2026-01-29",
    time: "14:15",
    dayOfWeek: "Wednesday",
    mistakes: ["Entered too early", "Ignored higher timeframe"],
    confirmations: ["FVG mitigation"],
  },
  {
    id: "3",
    pair: "EURUSD",
    direction: "Long",
    outcome: "Win",
    rValue: 3.2,
    entryPrice: 1.0800,
    exitPrice: 1.0920,
    date: "2026-01-30",
    time: "09:00",
    dayOfWeek: "Thursday",
    mistakes: [],
    confirmations: ["Market structure shift", "FVG mitigation", "Kill zone timing", "Volume confirmation"],
  },
  {
    id: "4",
    pair: "USDJPY",
    direction: "Short",
    outcome: "Break Even",
    rValue: 0,
    entryPrice: 149.50,
    exitPrice: 149.50,
    date: "2026-01-31",
    time: "11:30",
    dayOfWeek: "Friday",
    mistakes: ["Moved stop loss too early"],
    confirmations: ["Market structure shift", "Kill zone timing"],
  },
  {
    id: "5",
    pair: "EURUSD",
    direction: "Short",
    outcome: "Win",
    rValue: 1.8,
    entryPrice: 1.0920,
    exitPrice: 1.0865,
    date: "2026-02-01",
    time: "08:45",
    dayOfWeek: "Saturday",
    mistakes: [],
    confirmations: ["Market structure shift", "FVG mitigation", "Higher timeframe bias"],
  },
];

const mockStrategy = {
  id: "1",
  name: "ICT Silver Bullet",
  totalTrades: 5,
  winRate: 60,
  avgR: 1.3,
};

export default function StrategyAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Calculate analytics
  const wins = mockTrades.filter(t => t.outcome === "Win").length;
  const losses = mockTrades.filter(t => t.outcome === "Loss").length;
  const breakEven = mockTrades.filter(t => t.outcome === "Break Even").length;
  const winRate = ((wins / mockTrades.length) * 100).toFixed(1);
  const totalR = mockTrades.reduce((sum, t) => sum + t.rValue, 0).toFixed(2);
  const avgR = (mockTrades.reduce((sum, t) => sum + t.rValue, 0) / mockTrades.length).toFixed(2);
  const bestTrade = mockTrades.reduce((best, t) => t.rValue > best.rValue ? t : best, mockTrades[0]);
  const worstTrade = mockTrades.reduce((worst, t) => t.rValue < worst.rValue ? t : worst, mockTrades[0]);

  // Time analysis
  const tradesByDay = mockTrades.reduce((acc, t) => {
    acc[t.dayOfWeek] = (acc[t.dayOfWeek] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const winsByDay = mockTrades.filter(t => t.outcome === "Win").reduce((acc, t) => {
    acc[t.dayOfWeek] = (acc[t.dayOfWeek] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Mistake analysis
  const allMistakes = mockTrades.flatMap(t => t.mistakes);
  const mistakeCounts = allMistakes.reduce((acc, m) => {
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMistakes = Object.entries(mistakeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Confirmation analysis
  const confirmationSuccess = {} as Record<string, { total: number; wins: number }>;
  mockTrades.forEach(trade => {
    trade.confirmations.forEach(conf => {
      if (!confirmationSuccess[conf]) {
        confirmationSuccess[conf] = { total: 0, wins: 0 };
      }
      confirmationSuccess[conf].total++;
      if (trade.outcome === "Win") {
        confirmationSuccess[conf].wins++;
      }
    });
  });

  const confirmationStats = Object.entries(confirmationSuccess)
    .map(([name, stats]) => ({
      name,
      winRate: ((stats.wins / stats.total) * 100).toFixed(1),
      total: stats.total,
    }))
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl p-4 lg:p-8"
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/strategies/${id}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Strategy Analytics</h1>
              <p className="text-muted-foreground">{mockStrategy.name}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-3xl font-bold">{mockTrades.length}</p>
                </div>
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-3xl font-bold text-accent-foreground">{winRate}%</p>
                </div>
                <TrendingUp className="h-10 w-10 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg R</p>
                  <p className="text-3xl font-bold text-primary">{avgR}R</p>
                </div>
                <Target className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total R</p>
                  <p className="text-3xl font-bold text-secondary-foreground">{totalR}R</p>
                </div>
                <DollarSign className="h-10 w-10 text-secondary-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Win/Loss Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Win/Loss Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-accent-foreground" />
                    <span className="font-medium">Wins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-accent-foreground">{wins}</span>
                    <Badge variant="outline" className="text-accent-foreground">
                      {winRate}%
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="font-medium">Losses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-destructive">{losses}</span>
                    <Badge variant="outline" className="text-destructive">
                      {((losses / mockTrades.length) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-gray-400" />
                    <span className="font-medium">Break Even</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-500">{breakEven}</span>
                    <Badge variant="outline" className="text-gray-500">
                      {((breakEven / mockTrades.length) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Best Trade</span>
                    <span className="font-bold text-accent-foreground">+{bestTrade.rValue}R</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Worst Trade</span>
                    <span className="font-bold text-destructive">{worstTrade.rValue}R</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Best Trading Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(tradesByDay)
                  .sort((a, b) => b[1] - a[1])
                  .map(([day, count]) => {
                    const dayWins = winsByDay[day] || 0;
                    const dayWinRate = ((dayWins / count) * 100).toFixed(0);
                    return (
                      <div key={day} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{day}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count} trades</span>
                          <Badge variant={parseInt(dayWinRate) >= 50 ? "default" : "secondary"}>
                            {dayWinRate}% WR
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Top Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Common Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topMistakes.length > 0 ? (
                <div className="space-y-3">
                  {topMistakes.map(([mistake, count]) => (
                    <div key={mistake} className="flex items-center justify-between rounded-lg bg-destructive/10 p-3">
                      <span className="text-sm font-medium">{mistake}</span>
                      <Badge variant="destructive">{count}x</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No mistakes documented! 🎉
                </p>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent-foreground" />
                Confirmation Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {confirmationStats.map(({ name, winRate, total }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm font-medium flex-1 mr-2">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{total} trades</span>
                      <Badge 
                        variant={parseFloat(winRate) >= 60 ? "default" : "secondary"}
                      >
                        {winRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Improvement Suggestions */}
        <Card className="mt-6 bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {topMistakes.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg bg-card p-4">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Reduce Mistakes</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your most common mistake is "{topMistakes[0][0]}". Create a pre-trade checklist to avoid this.
                    </p>
                  </div>
                </div>
              )}

              {parseFloat(winRate) < 60 && (
                <div className="flex items-start gap-3 rounded-lg bg-card p-4">
                  <Target className="h-5 w-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Increase Selectivity</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Win rate is at {winRate}%. Wait for more confirmations before entering a trade.
                    </p>
                  </div>
                </div>
              )}

              {Object.entries(tradesByDay).some(([_, count]) => count === 1) && (
                <div className="flex items-start gap-3 rounded-lg bg-card p-4">
                  <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Optimal Trading Days</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Object.entries(winsByDay)
                        .sort((a, b) => b[1] - a[1])[0]?.[0]} seems to be your best day. Focus on these times.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-lg bg-card p-4">
                <CheckCircle className="h-5 w-5 text-accent-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Leverage Strengths</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confirmations with high success rate: {confirmationStats[0]?.name} ({confirmationStats[0]?.winRate}% WR). 
                    Make sure these are always present.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Trades with this Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      trade.outcome === "Win" ? "bg-accent/20" :
                      trade.outcome === "Loss" ? "bg-destructive/20" : "bg-muted"
                    }`}>
                      {trade.outcome === "Win" ? (
                        <TrendingUp className="h-5 w-5 text-accent-foreground" />
                      ) : trade.outcome === "Loss" ? (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{trade.pair}</span>
                        <Badge variant={trade.direction === "Long" ? "default" : "secondary"}>
                          {trade.direction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{trade.date}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{trade.time}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{trade.dayOfWeek}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      trade.rValue > 0 ? "text-accent-foreground" :
                      trade.rValue < 0 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {trade.rValue > 0 ? "+" : ""}{trade.rValue}R
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {trade.entryPrice} → {trade.exitPrice}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
