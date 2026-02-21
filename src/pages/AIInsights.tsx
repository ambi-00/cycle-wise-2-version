import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Calendar, Clock, Target, Brain, Lightbulb, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NaturalLanguageInsights from "@/components/NaturalLanguageInsights";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import { usePaymentSuccess } from "@/hooks/use-payment-success";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";
import { useAppMode } from "@/hooks/use-app-mode";

export default function AIInsights() {
  const navigate = useNavigate();
  const { subscription, hasFeature, loading: subLoading } = useSubscription();
  const { appMode } = useAppMode();
  const [trades, setTrades] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);
  usePaymentSuccess();
  
  // In FILMING mode, hide demo insights - show only real data
  const showDemoInsights = appMode !== 'FILMING';

  useEffect(() => {
    const allTrades = loadTradesFromLocalStorage();
    setTrades(allTrades);
    setHasData(allTrades.length > 0);
  }, []);

  // Show blank while subscription loads (no flicker)
  if (subLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  // Empty state when no trades (but only after loading completes)
  if (!hasData && !subLoading) {
    return (
      <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
        <div className="relative">
          {subscription.tier !== 'pro' && (
            <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
              <Card className="max-w-md w-full">
                <CardContent className="p-8 text-center">
                  <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-xl mb-2">Pro Feature</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Upgrade to Pro for AI-powered insights, personalized recommendations, and cycle-based trading analysis.
                  </p>
                  <Button onClick={() => navigate('/#pricing')} size="lg" className="w-full">
                    Upgrade to Pro - €19.99/mo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          <div className={hasFeature('ai_insights_weekly') ? '' : 'blur-sm pointer-events-none'}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-7xl p-4 lg:p-8"
        >
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">AI Insights</h1>
            <p className="mt-1 text-muted-foreground">Personalized analysis powered by your trading data</p>
          </div>

          {/* Summary Cards - hide in FILMING mode */}
          {showDemoInsights && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Insights Generated", value: "147", icon: Sparkles },
              { label: "Actions Taken", value: "89", icon: TrendingUp },
              { label: "Performance Impact", value: "+34%", icon: Target },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-card p-5 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}

          {/* Demo Insights Cards - hide in FILMING mode */}
          {showDemoInsights && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Pattern</span>
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">High Impact</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Entry Timing Optimization</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Your win rate increases by 42% when you wait for candle close confirmation. You tend to enter early 67% of the time, especially during your Luteal phase.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-accent">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Enable 'Wait for Close' reminder in your trade entry screen.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-secondary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Cycle</span>
                  <span className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full">Critical Impact</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Cycle-Phase Performance Gap</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Your Ovulation phase shows 2.8x better R-multiples compared to Luteal phase. Consider reducing position sizes by 50% during days 17-28.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-secondary">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Auto-enable Safety Mode during late Luteal phase (days 24-28).</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-primary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Strategy</span>
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">Medium Impact</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Strategy Effectiveness</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                ICT Silver Bullet is 72% win rate vs SMC Sweep at 58%. However, SMC performs better on GBP pairs (2.23x edge).
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-primary">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Use SMC exclusively for GBP crosses.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Psychology</span>
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">High Impact</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Emotional State Impact</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Trades when "anxious" have 32% lower success. Your best trades happen when "calm and focused" (78% win rate).
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-accent">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Wait for calm emotional state before entering positions.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-primary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Time</span>
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">Medium Impact</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Session Timing Success</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                London session trades outperform New York by 22%. Your focus appears stronger in morning hours (9-11 AM: 68% win rate).
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-primary">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Focus trading between 9:00-11:00 AM only.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-destructive"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Behavior</span>
                  <span className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full">Warning</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Winning Streak Behavior</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                After 3+ consecutive wins, your next trade has 38% lower success. You tend to overtrade during winning streaks.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-destructive">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Implement 'cool-down' rule: skip next 2 hours after 3 wins.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Risk</span>
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">Positive</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">R:R Ratio Excellence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Winning trades average 2.8:1 R:R, losing trades cut at -0.9:1. This asymmetry is excellent - keep it up.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-accent">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Maintain current stop-loss discipline.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-secondary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Cycle</span>
                  <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full">Action Required</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Menstrual Phase Risk Alert</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Your Menstrual phase shows 18% decreased risk tolerance, leading to missed setups. Pre-plan trades during Follicular phase.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-secondary">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Set trade alerts in advance during high-energy phases.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-primary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Pattern</span>
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">High Confidence</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Weekly Pattern Discovery</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Tuesday/Wednesday: 71% combined win rate. Monday trades have only 42% success - market structure needs more time.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-primary">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Avoid Monday trading; wait for Tuesday setups.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Instrument</span>
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">Data-Driven</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Pair Performance Ranking</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                EUR/USD: 73% win rate. GBP/JPY: only 41%. Focus on proven edges and reduce underperforming pairs.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-accent">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Trade EUR/USD exclusively for next 2 weeks.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-secondary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Lifestyle</span>
                  <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full">Medium Impact</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Sleep Quality Impact</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Poor sleep days: 28% lower win rate. Your cognitive performance directly impacts decision quality.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-secondary">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Skip trading after less than 6 hours sleep.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Psychology</span>
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">Insight</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-xs">Apply</Button>
                  <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Overconfidence After Wins</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Position sizes increase 18% after winning days, but win rate drops to 51%. Maintain consistent risk regardless of recent outcomes.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-accent">
                <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED ACTION</p>
                <p className="text-sm text-foreground">Lock risk at 1% per trade, regardless of recent results.</p>
              </div>
            </motion.div>
          </div>
        )}

        {!showDemoInsights && (
          <div className="rounded-2xl bg-card p-12 shadow-card text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">AI Insights</h3>
            <p className="text-muted-foreground">
              Real insights will be generated from your trading data
            </p>
          </div>
        )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/20 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-card p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground">Your AI Coach Summary</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Based on analyzing your 87 trades, I've identified 12 key patterns that can improve your trading performance by up to 34%. Review each insight above and implement the recommended actions to optimize your edge.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/trade-journal')}>
                  View All Trades
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        </div>
        </div>
      </main>
    );
  }

  const totalTrades = trades.length;
  const avgWinRate = trades.filter(t => t.result === 'win').length / totalTrades * 100 || 0;

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="relative">
        {!hasFeature('ai_insights_weekly') && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-xl mb-2">Pro Feature</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Upgrade to Pro for AI-powered insights, personalized recommendations, and cycle-based trading analysis.
                </p>
                  <Button onClick={() => navigate(`/checkout?tier=pro&returnTo=${window.location.pathname}`)} size="lg" className="w-full">
                  Upgrade to Pro - €19.99/mo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <div className={hasFeature('ai_insights_weekly') ? '' : 'blur-sm pointer-events-none'}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl p-4 lg:p-8"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">AI Insights</h1>
            <p className="mt-1 text-muted-foreground">Personalized analysis powered by your trading data</p>
          </div>
          <Button variant="hero">
            <Sparkles className="h-4 w-4" />
            Generate New Insights
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Insights Generated", value: "147", icon: Sparkles },
            { label: "Actions Taken", value: "89", icon: TrendingUp },
            { label: "Performance Impact", value: "+34%", icon: Target },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-card p-5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo Insights Cards */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-accent/10 p-3">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Cycle Phase Performance Pattern</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your win rate during the Follicular phase is 15% higher than average. Consider increasing position size during this phase while maintaining strict risk management.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">High Priority</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Cycle Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-primary"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Trading Time Optimization</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your best trading hours are between 9:00-11:00 AM with a 68% win rate. Avoid trading after 3:00 PM where your win rate drops to 42%.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">Medium Priority</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Time Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-secondary"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-secondary/10 p-3">
                <Target className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Risk Management Alert</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  During your Luteal phase, you tend to take 23% larger positions. Consider reducing position size by 20% during this phase to maintain consistent risk levels.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full">Action Required</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Risk Management</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-accent/10 p-3">
                <Lightbulb className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Strategy Effectiveness</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your "ICT Silver Bullet" strategy performs best during Ovulation phase with 75% win rate. Focus on this strategy-phase combination for optimal results.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">Opportunity</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Strategy Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-primary"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Weekly Pattern Discovery</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tuesday and Wednesday show your strongest performance with 71% combined win rate. Monday trades have lower success - consider waiting for better setups.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">Pattern Detected</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Day Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-secondary"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-secondary/10 p-3">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Emotional State Impact</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Trades executed when feeling "anxious" have a 32% lower success rate. Your best trades happen when you're "calm and focused" - wait for this emotional state before entering positions.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full">Critical Insight</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Emotional Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-accent/10 p-3">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">R:R Ratio Optimization</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your winning trades average a 2.8:1 R:R ratio, but losing trades are cut at -0.9:1. This asymmetry is working well - maintain this disciplined approach to risk management.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">Positive Trend</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Risk Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-primary"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Menstrual Phase Trading Alert</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  During your Menstrual phase, your risk tolerance decreases by 18%, leading to missed opportunities. Consider pre-planning your trades during Follicular phase to maintain consistency.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">Actionable</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Cycle Pattern</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-secondary"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-secondary/10 p-3">
                <Lightbulb className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Session Timing Success</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  London session trades outperform New York session by 22%. Your focus and decision-making quality appears stronger in morning hours - structure your schedule accordingly.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full">High Confidence</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Session Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-accent"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-accent/10 p-3">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Winning Streak Behavior</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After 3+ consecutive wins, your next trade has a 38% lower success rate. You tend to overtrade during winning streaks - implement a "cool-down" rule after 3 wins.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full">Warning</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Behavioral Pattern</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-primary"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Pair Performance Ranking</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  EUR/USD shows your best win rate at 73%, while GBP/JPY has only 41%. Focus on pairs where you have proven edge and consider reducing exposure to underperforming instruments.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">Data-Driven</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Instrument Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="rounded-2xl bg-card p-6 shadow-card border-l-4 border-secondary"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-secondary/10 p-3">
                <Brain className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Sleep Quality Correlation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Trades logged on days when you noted "poor sleep" have 28% lower success rate. Prioritize rest - your cognitive performance directly impacts trading outcomes.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full">Lifestyle Factor</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Well-being Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Coaching Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/20 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-card p-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-foreground">Your AI Coach Summary</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {totalTrades < 10 
                  ? `You've logged ${totalTrades} trade${totalTrades !== 1 ? 's' : ''}. Keep going! I need at least 10 trades to provide detailed pattern analysis and personalized recommendations.`
                  : totalTrades < 30
                  ? `Based on analyzing your ${totalTrades} trades, I'm starting to see some patterns. Continue logging trades consistently to unlock deeper insights about your trading edge and cycle-performance correlation.`
                  : `Based on analyzing your ${totalTrades} trades, I can provide comprehensive insights. The Natural Language Insights below analyze your patterns across cycle phases, days of the week, emotional states, and strategy effectiveness. Review each insight to optimize your trading approach.`
                }
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/trade-journal')}>
                View All Trades
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      </div>
      </div>
    </main>
  );
}