import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle, Trash2, TrendingUp, BarChart3, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";

const mockStrategies = [
  {
    id: "1",
    name: "ICT Silver Bullet",
    markets: ["Forex", "Indices"],
    timeframes: ["1H", "15M"],
    winRate: 72,
    avgR: 2.1,
    tradesCount: 45,
    confirmations: ["Market structure shift", "FVG/OB mitigation", "Kill zone timing", "Volume confirmation", "Higher timeframe bias"],
    score: 87,
  },
  {
    id: "2",
    name: "SMC Sweep & Grab",
    markets: ["Forex"],
    timeframes: ["4H", "1H"],
    winRate: 65,
    avgR: 1.8,
    tradesCount: 32,
    confirmations: ["Liquidity sweep", "Order block reaction", "Break of structure", "Displacement candle"],
    score: 74,
  },
  {
    id: "3",
    name: "Supply & Demand",
    markets: ["Crypto", "Indices"],
    timeframes: ["Daily", "4H"],
    winRate: 58,
    avgR: 1.5,
    tradesCount: 28,
    confirmations: ["Fresh zone", "Trend alignment", "Multiple rejections", "Volume spike"],
    score: 62,
  },
];

export default function Strategies() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, loading: subLoading } = useSubscription();
  const [strategies, setStrategies] = useState(mockStrategies);

  useEffect(() => {
    // Load user-created strategies from localStorage
    const userStrategies = JSON.parse(localStorage.getItem('cw_strategies') || '[]');
    // Combine mock strategies with user strategies
    setStrategies([...mockStrategies, ...userStrategies]);
  }, []);

  // Show blank while subscription loads (no flicker)
  if (subLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  const hasPremium = subscription.tier === 'premium' || subscription.tier === 'pro';
  
  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl p-4 lg:p-8"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">Strategy Builder</h1>
            <p className="mt-1 text-muted-foreground">Define, track, and optimize your trading strategies</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => hasPremium ? navigate('/strategies/new') : navigate('/checkout?tier=premium&returnTo=/strategies')}
              disabled={!hasPremium}
            >
              <Plus className="h-4 w-4" />
              New Strategy
            </Button>
          </div>
        </div>

        {/* Strategy Cards with Premium Lock */}
        <div className="relative">
          {!hasPremium && (
            <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
              <Card className="max-w-md w-full">
                <CardContent className="p-8 text-center">
                  <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-xl mb-2">Premium Feature</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Upgrade to Premium to create and track unlimited strategies with detailed confirmations and performance metrics.
                  </p>
                  <Button onClick={() => navigate('/checkout?tier=premium&returnTo=/strategies')} size="lg" className="w-full">
                    Upgrade to Premium - €9.99/mo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          <div className={`grid gap-6 lg:grid-cols-2 xl:grid-cols-3 ${!hasPremium ? 'blur-sm pointer-events-none' : ''}`}>
          {strategies.map((strategy, index) => (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/strategies/${strategy.id}`)}
              className="group cursor-pointer rounded-2xl bg-card p-6 shadow-card transition-all hover:shadow-glow hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{strategy.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {strategy.markets.map((market, idx) => (
                      <span key={`market-${strategy.id}-${idx}`} className="rounded-lg bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {market}
                      </span>
                    ))}
                    {strategy.timeframes.map((tf, idx) => (
                      <span key={`tf-${strategy.id}-${idx}`} className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {tf}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary">
                  <span className="text-lg font-bold text-primary">{strategy.score}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-muted/30 p-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{strategy.winRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Avg R</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{strategy.avgR}R</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Trades</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{strategy.tradesCount}</p>
                </div>
              </div>

              {/* Confirmations */}
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmation Checklist</p>
                <div className="mt-3 space-y-2">
                  {strategy.confirmations.slice(0, 3).map((conf, i) => (
                    <div key={`conf-${strategy.id}-${i}`} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-accent-foreground" />
                      {conf}
                    </div>
                  ))}
                  {strategy.confirmations.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{strategy.confirmations.length - 3} more confirmations</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/strategies/${strategy.id}`);
                  }}
                >
                  <BarChart3 className="h-4 w-4" />
                  View Details
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${strategy.name}"?`)) {
                      setStrategies(strategies.filter(s => s.id !== strategy.id));
                      toast({
                        title: "Strategy deleted",
                        description: `"${strategy.name}" has been removed.`,
                      });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
          </div>
        </div>

        {/* Empty State */}
        {strategies.length === 0 && hasPremium && (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-12 text-center">
            <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">No strategies yet</h3>
            <p className="mb-6 max-w-md text-muted-foreground">
              Start building your first trading strategy to track performance and stay disciplined
            </p>
            <Button onClick={() => navigate('/strategies/new')}>
              <Plus className="h-4 w-4" />
              Create Your First Strategy
            </Button>
          </div>
        )}
      </motion.div>
    </main>
  );
}
