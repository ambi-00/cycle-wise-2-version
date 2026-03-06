import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { computeStrategyStats } from "@/lib/strategyStats";
import { 
  ArrowLeft, 
  Edit, 
  TrendingUp, 
  Target, 
  BarChart3, 
  CheckCircle2,
  Clock,
  Layers,
  Shield,
  Trophy,
  AlertCircle,
  TrendingDown
} from "lucide-react";

type Strategy = {
  id: string;
  name: string;
  description?: string;
  markets: string[];
  timeframes: string[];
  setupConfirmations?: string[]; // NEW: Merged confirmations
  entryTrigger?: string; // NEW: Single entry trigger
  slType?: string; // NEW: SL type
  slDistance?: string; // NEW: SL distance/rule
  tpType?: string; // NEW: TP type
  exitOptions?: string[]; // NEW: Exit options for dropdown
  riskPerTrade?: number;
  riskRewardRatio?: number;
  winRate: number;
  avgR: number;
  tradesCount: number;
  score: number;
  profitFactor?: number;
  maxDrawdown?: number;
  createdAt?: string;
  
  // OLD fields for backwards compatibility
  confirmations?: string[];
  entryTriggers?: string[];
  slCriteria?: string[];
  exitRules?: string[];
  exitCriteria?: string[];
  generalRules?: string[];
  rules?: string[];
  stopLossType?: string;
  takeProfitType?: string;
};

const mockStrategies: Strategy[] = [
  {
    id: "1",
    name: "ICT Silver Bullet",
    description: "High-probability setups during key trading sessions using institutional order flow concepts and liquidity grabs.",
    markets: ["Forex", "Indices"],
    timeframes: ["1H", "15M"],
    winRate: 72,
    avgR: 2.1,
    tradesCount: 45,
    setupConfirmations: ["Market structure shift", "FVG/OB mitigation", "Kill zone timing", "Volume confirmation", "Higher timeframe bias"],
    entryTrigger: "Break of structure + Fair value gap entry",
    slType: "structure-based",
    slDistance: "Below last swing point / Beyond order block",
    tpType: "next-level",
    exitOptions: ["Hit TP at liquidity zone", "Partial profits at 1:2 RR", "Trail stop after 1:3 RR", "Break of structure (reversal)"],
    riskPerTrade: 1,
    riskRewardRatio: 3,
    profitFactor: 2.4,
    maxDrawdown: 8.5,
    score: 87,
  },
  {
    id: "2",
    name: "SMC Sweep & Grab",
    description: "Smart Money Concepts strategy focusing on liquidity sweeps and order block reactions for institutional-level entries.",
    markets: ["Forex"],
    timeframes: ["4H", "1H"],
    winRate: 65,
    avgR: 1.8,
    tradesCount: 32,
    setupConfirmations: ["Liquidity sweep completed", "Order block present", "Break of structure", "Displacement candle"],
    entryTrigger: "Return to order block after liquidity grab",
    slType: "order-block",
    slDistance: "Beyond order block / Below liquidity sweep",
    tpType: "next-level",
    exitOptions: ["Opposite liquidity reached", "Scale out at key levels", "Change of character (reversal)", "Time-based exit (session end)"],
    riskPerTrade: 1.5,
    riskRewardRatio: 2,
    profitFactor: 2.1,
    maxDrawdown: 12.3,
    score: 74,
  },
  {
    id: "3",
    name: "Supply & Demand",
    description: "Classical supply and demand zone trading with strict zone quality filters and confirmation requirements.",
    markets: ["Crypto", "Indices"],
    timeframes: ["Daily", "4H"],
    winRate: 58,
    avgR: 1.5,
    tradesCount: 28,
    confirmations: ["Fresh zone", "Trend alignment", "Multiple rejections", "Volume spike"],
    entryTriggers: ["Zone test", "Rejection candle", "Volume confirmation"],
    slCriteria: ["Beyond zone", "Fixed percentage"],
    exitRules: ["Opposite zone", "Profit targets"],
    generalRules: ["Only fresh zones", "Trend alignment required"],
    riskPerTrade: 2,
    stopLossType: "Zone-based",
    takeProfitType: "Target zones",
    riskRewardRatio: 2.5,
    profitFactor: 1.8,
    maxDrawdown: 15.7,
    score: 62,
  },
];

export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isMockStrategy, setIsMockStrategy] = useState(false);

  // Live stats computed from actual logged trades – always computed, even for demo strategies
  const liveStats = useMemo(
    () => (strategy ? computeStrategyStats(strategy.name) : null),
    [strategy]
  );

  // If real trades exist → use live data. If not and it's a demo → show example stats with label.
  const hasRealTrades = (liveStats?.tradesCount ?? 0) > 0;
  const isExampleStats = isMockStrategy && !hasRealTrades;

  // Helper: pick live stat when real trades exist, otherwise fall back to stored/hardcoded values
  const stat = {
    winRate:     hasRealTrades ? liveStats!.winRate     : strategy?.winRate ?? 0,
    avgR:        hasRealTrades ? liveStats!.avgR         : strategy?.avgR ?? 0,
    tradesCount: hasRealTrades ? liveStats!.tradesCount  : strategy?.tradesCount ?? 0,
    score:       hasRealTrades ? liveStats!.score        : strategy?.score ?? 0,
    profitFactor:hasRealTrades ? liveStats!.profitFactor : strategy?.profitFactor,
  };

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }

    // First check mock strategies by ID or name
    const mockStrategy = mockStrategies.find((s) => s.id === id || s.name === decodeURIComponent(id));
    if (mockStrategy) {
      setStrategy(mockStrategy);
      setIsMockStrategy(true);
      setNotFound(false);
      return;
    }

    // Then check user strategies by name
    try {
      const raw = localStorage.getItem('cw_strategies');
      if (!raw) {
        setNotFound(true);
        return;
      }
      const parsed = JSON.parse(raw);
      const list: Strategy[] = Array.isArray(parsed) ? parsed : [];
      const found = list.find((s) => s.name === decodeURIComponent(id));
      
      if (found) {
        setStrategy(found);
        setIsMockStrategy(false);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      console.error('Error loading strategy:', e);
      setNotFound(true);
    }
  }, [id]);

  if (notFound) {
    return (
      <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-destructive">Strategy Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The strategy "{id ? decodeURIComponent(id) : ''}" could not be found.
              </p>
              <Button onClick={() => navigate('/strategies')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Strategies
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!strategy) {
    return (
      <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-64 bg-muted rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="mx-auto max-w-7xl p-4 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/strategies')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Strategies
          </Button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="font-serif text-3xl font-bold text-foreground">{strategy.name}</h1>
                {isMockStrategy && (
                  <Badge variant="secondary" className="text-xs">
                    Demo Strategy
                  </Badge>
                )}
              </div>
              {strategy.description && (
                <p className="text-muted-foreground max-w-3xl mt-2">{strategy.description}</p>
              )}
            </div>

            {!isMockStrategy && (
              <Button
                onClick={() => navigate(`/strategies/edit/${encodeURIComponent(strategy.name)}`)}
                className="shrink-0"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Strategy
              </Button>
            )}
          </div>
        </motion.div>

        {/* Example stats notice */}
        {isExampleStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
          >
            <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Beispiel-Statistiken</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Diese Zahlen sind Beispielwerte. Sobald du Trades mit dieser Strategie loggst, werden sie automatisch durch deine echten Daten ersetzt.
              </p>
            </div>
          </motion.div>
        )}

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.tradesCount > 0 || isMockStrategy ? `${stat.winRate}%` : '—'}
                  </p>
                  {!isMockStrategy && stat.tradesCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{liveStats!.winCount}W / {liveStats!.lossCount}L</p>
                  )}
                </div>
                <TrendingUp className="h-10 w-10 text-green-500 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg R-Multiple</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.tradesCount > 0 || isMockStrategy ? `${stat.avgR}R` : '—'}
                  </p>
                </div>
                <Target className="h-10 w-10 text-blue-500 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
                  <p className="text-3xl font-bold text-foreground">{stat.tradesCount}</p>
                </div>
                <BarChart3 className="h-10 w-10 text-purple-500 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Strategy Score</p>
                  <p className="text-3xl font-bold text-foreground">{stat.score}</p>
                </div>
                <Trophy className="h-10 w-10 text-amber-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Stats Row */}
        {(stat.profitFactor || strategy?.maxDrawdown) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 mb-8"
          >
            {stat.profitFactor ? (
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
                      <p className="text-2xl font-bold text-foreground">{stat.profitFactor}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary opacity-70" />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {strategy.maxDrawdown && (
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Max Drawdown</p>
                      <p className="text-2xl font-bold text-foreground">{strategy.maxDrawdown}%</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-destructive opacity-70" />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Markets & Timeframes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Markets & Timeframes</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Markets</p>
                      <div className="flex flex-wrap gap-2">
                        {strategy.markets.map((market, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                            {market}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Timeframes</p>
                      <div className="flex flex-wrap gap-2">
                        {strategy.timeframes.map((tf, idx) => (
                          <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {tf}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Entry Confirmations */}
            {((strategy.setupConfirmations && strategy.setupConfirmations.length > 0) || (strategy.confirmations && strategy.confirmations.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
                      <h3 className="font-semibold text-lg">Setup Confirmations</h3>
                    </div>
                    <div className="space-y-2">
                      {(strategy.setupConfirmations || strategy.confirmations || []).map((conf, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-accent-foreground" />
                          </div>
                          <p className="text-sm text-foreground flex-1">{conf}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Entry Trigger (NEW) */}
            {(strategy.entryTrigger || (strategy.entryTriggers && strategy.entryTriggers.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Entry Trigger
                    </h3>
                    {strategy.entryTrigger ? (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-foreground">{strategy.entryTrigger}</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {strategy.entryTriggers?.map((trigger, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span>{trigger}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Risk Management (with NEW SL info) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Risk Management</h3>
                  </div>
                  <div className="space-y-4">
                    {strategy.riskPerTrade && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Risk Per Trade</p>
                        <p className="text-xl font-semibold text-foreground">{strategy.riskPerTrade}%</p>
                      </div>
                    )}
                    {strategy.riskRewardRatio && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Risk:Reward Ratio</p>
                        <p className="text-xl font-semibold text-foreground">1:{strategy.riskRewardRatio}</p>
                      </div>
                    )}
                    {(strategy.slType || strategy.stopLossType) && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Stop Loss Type</p>
                        <Badge variant="outline" className="text-sm">{strategy.slType || strategy.stopLossType}</Badge>
                      </div>
                    )}
                    {strategy.slDistance && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">SL Distance/Rule</p>
                        <p className="text-sm text-foreground">{strategy.slDistance}</p>
                      </div>
                    )}
                    {(strategy.tpType || strategy.takeProfitType) && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Take Profit Type</p>
                        <Badge variant="outline" className="text-sm">{strategy.tpType || strategy.takeProfitType}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* SL Criteria (LEGACY) */}
            {strategy.slCriteria && strategy.slCriteria.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Stop Loss Criteria</h3>
                    <ul className="space-y-2">
                      {strategy.slCriteria.map((criteria, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-destructive mt-1">•</span>
                          <span className="flex-1">{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Exit Options (NEW) */}
            {strategy.exitOptions && strategy.exitOptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Exit Options</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Available exit reasons when closing trades with this strategy
                    </p>
                    <div className="space-y-2">
                      {strategy.exitOptions.map((option, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                          <div className="mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <p className="text-sm text-foreground flex-1">{option}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Exit Rules (LEGACY) */}
            {strategy.exitRules && strategy.exitRules.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Exit Rules</h3>
                    <ul className="space-y-2">
                      {strategy.exitRules.map((rule, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="flex-1">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
