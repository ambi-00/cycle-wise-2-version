import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertCircle } from "lucide-react";

interface RRRAnalysisProps {
  trades: any[];
}

export default function RRROptimizationAnalysis({ trades }: RRRAnalysisProps) {
  // Only analyze trades that have both planned RRR and maxRReached data
  const tradesWithData = trades.filter(t => 
    t.status === 'closed' && 
    t.rrr !== undefined && 
    t.rrr !== null &&
    t.maxRReached !== undefined && 
    t.maxRReached !== null &&
    t.maxRReached > 0
  );

  if (tradesWithData.length < 5) {
    return (
      <Card className="rounded-2xl shadow-soft border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            RRR Optimization Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Analyze if your RRR targets are optimal
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Not enough data</h3>
            <p className="text-muted-foreground">
              Log at least 5 trades with both planned RRR and "Max R Reached" to see optimization insights.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Set your RRR target before trade, then log how far it actually went in profit.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Analyze planned vs actual
  const avgPlannedRRR = tradesWithData.reduce((sum, t) => sum + (t.rrr || 0), 0) / tradesWithData.length;
  const avgMaxReached = tradesWithData.reduce((sum, t) => sum + (t.maxRReached || 0), 0) / tradesWithData.length;
  
  // How often did they hit their planned target?
  const hitPlannedTarget = tradesWithData.filter(t => (t.maxRReached || 0) >= (t.rrr || 0)).length;
  const hitRate = (hitPlannedTarget / tradesWithData.length) * 100;
  
  // Are they too conservative? (max reached often much higher than planned)
  const tooConservative = tradesWithData.filter(t => 
    (t.maxRReached || 0) >= (t.rrr || 0) * 1.5
  ).length;
  const conservativeRate = (tooConservative / tradesWithData.length) * 100;
  
  // Are they too aggressive? (max reached often lower than planned)
  const tooAggressive = tradesWithData.filter(t => 
    (t.maxRReached || 0) < (t.rrr || 0) * 0.8
  ).length;
  const aggressiveRate = (tooAggressive / tradesWithData.length) * 100;
  
  // CRITICAL: Analyze losses that could have been wins with smaller TP
  const lossTrades = tradesWithData.filter(t => t.result === 'loss' && (t.maxRReached || 0) > 0);
  const avoidableLosses = lossTrades.filter(t => (t.maxRReached || 0) >= 1.0); // Would have won at 1:1
  const avoidableLossRate = lossTrades.length > 0 ? (avoidableLosses.length / lossTrades.length) * 100 : 0;
  
  // Test different RRR targets based on actual data
  const testRRRs = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
  
  const rrrStats = testRRRs.map(targetRRR => {
    const hits = tradesWithData.filter(t => (t.maxRReached || 0) >= targetRRR).length;
    const winRate = (hits / tradesWithData.length) * 100;
    const expectedValue = (winRate / 100) * targetRRR - ((100 - winRate) / 100) * 1;
    
    return {
      rrr: targetRRR,
      winRate,
      hits,
      total: tradesWithData.length,
      expectedValue
    };
  });

  // Find optimal RRR (best expected value with >50% win rate)
  const viable = rrrStats.filter(s => s.winRate >= 50);
  const optimal = viable.length > 0 ? viable.reduce((best, current) => 
    current.expectedValue > best.expectedValue ? current : best
  , viable[0]) : rrrStats[0];
  
  // Determine trader behavior
  const behavior = conservativeRate > 40 ? 'conservative' : 
                   aggressiveRate > 40 ? 'aggressive' : 'balanced';

  return (
    <Card className="rounded-2xl shadow-soft border">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          RRR Optimization Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Based on {tradesWithData.length} trades with max R data
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Behavior Analysis Card */}
        <div className={`p-6 rounded-xl bg-gradient-to-br border-2 ${
          behavior === 'conservative' 
            ? 'from-blue-500/20 to-blue-600/10 border-blue-500/30' 
            : behavior === 'aggressive' 
            ? 'from-red-500/20 to-red-600/10 border-red-500/30'
            : 'from-green-500/20 to-green-600/10 border-green-500/30'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {behavior === 'conservative' && '🎯 You aim too LOW'}
                {behavior === 'aggressive' && '⚠️ You aim too HIGH'}
                {behavior === 'balanced' && '✅ Well Balanced Targets'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {behavior === 'conservative' && 'You could take more profit'}
                {behavior === 'aggressive' && 'Your targets are often unrealistic'}
                {behavior === 'balanced' && 'Your RRR targets are reasonable'}
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{avgPlannedRRR.toFixed(1)}R</p>
              <p className="text-xs text-muted-foreground mt-1">Avg Planned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent-foreground">{avgMaxReached.toFixed(1)}R</p>
              <p className="text-xs text-muted-foreground mt-1">Avg Possible</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{hitRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Hit Rate</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-card/50">
            <p className="text-sm">
              {behavior === 'conservative' && `${conservativeRate.toFixed(0)}% of your trades went ${(avgMaxReached / avgPlannedRRR).toFixed(1)}x further than your target. Consider aiming higher!`}
              {behavior === 'aggressive' && `${aggressiveRate.toFixed(0)}% of your trades didn't reach your target. Consider more realistic RRR goals.`}
              {behavior === 'balanced' && `You hit your planned RRR ${hitRate.toFixed(0)}% of the time. Good balance between ambition and reality.`}
            </p>
          </div>
        </div>

        {/* Planned vs Actual vs Optimal */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-muted/30 border">
            <h4 className="font-semibold mb-2 text-sm">You Plan</h4>
            <p className="text-2xl font-bold">{avgPlannedRRR.toFixed(1)}R</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your average target
            </p>
          </div>
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
            <h4 className="font-semibold mb-2 text-sm">Actually Possible</h4>
            <p className="text-2xl font-bold text-accent-foreground">{avgMaxReached.toFixed(1)}R</p>
            <p className="text-xs text-muted-foreground mt-1">
              What market gave you
            </p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
            <h4 className="font-semibold mb-2 text-sm">Optimal Target</h4>
            <p className="text-2xl font-bold text-primary">{optimal.rrr}R</p>
            <p className="text-xs text-muted-foreground mt-1">
              Best win rate + EV
            </p>
          </div>
        </div>

        {/* All RRR Options */}
        <div>
          <h4 className="font-semibold mb-4">All RRR Target Options</h4>
          <div className="space-y-2">
            {rrrStats.map((stat) => {
              const isOptimal = stat.rrr === optimal.rrr;
              const isViable = stat.winRate >= 50;
              
              return (
                <div 
                  key={stat.rrr} 
                  className={`p-4 rounded-lg ${
                    isOptimal 
                      ? 'bg-primary/20 border-2 border-primary/40' 
                      : 'bg-muted/30 border border-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-12">{stat.rrr}R</span>
                      {isOptimal && (
                        <Badge variant="default" className="text-xs">Optimal</Badge>
                      )}
                      {!isViable && (
                        <Badge variant="destructive" className="text-xs">Low WR</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="font-semibold">{stat.winRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{stat.hits}/{stat.total}</p>
                        <p className="text-xs text-muted-foreground">Hits</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${stat.expectedValue > 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                          {stat.expectedValue > 0 ? '+' : ''}{stat.expectedValue.toFixed(2)}R
                        </p>
                        <p className="text-xs text-muted-foreground">Exp. Value</p>
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3 w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isOptimal ? 'bg-primary' : 'bg-accent'}`}
                      style={{ width: `${stat.winRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <span className="text-primary">🎯</span>
              Too Conservative
            </h4>
            <p className="text-2xl font-bold mb-2">{conservativeRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              of trades where you could have taken {((avgMaxReached / avgPlannedRRR) * 100 - 100).toFixed(0)}% more profit
            </p>
          </div>
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <span className="text-destructive">⚠️</span>
              Too Aggressive
            </h4>
            <p className="text-2xl font-bold mb-2">{aggressiveRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              of trades where your target was unrealistic
            </p>
          </div>
          {lossTrades.length > 0 && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <span className="text-orange-500">💥</span>
                Avoidable Losses
              </h4>
              <p className="text-2xl font-bold mb-2">{avoidableLosses.length}/{lossTrades.length}</p>
              <p className="text-xs text-muted-foreground">
                losses that were in profit but hit SL - would have won with smaller TP
              </p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/10 border">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>💡</span>
            Recommendations
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {avoidableLosses.length > 0 && (
              <li className="text-orange-600 dark:text-orange-400 font-semibold">
                ⚠️ <strong>{avoidableLosses.length} of your losses</strong> were in profit before hitting SL. With a smaller TP target, they would have been winners!
              </li>
            )}
            {behavior === 'conservative' && (
              <>
                <li>• Consider targeting <strong className="text-foreground">{optimal.rrr}R</strong> instead of {avgPlannedRRR.toFixed(1)}R</li>
                <li>• Your trades often go to {avgMaxReached.toFixed(1)}R - you're leaving money on the table</li>
                <li>• You could improve your results by being more ambitious with targets</li>
              </>
            )}
            {behavior === 'aggressive' && (
              <>
                <li>• Lower your target to <strong className="text-foreground">{optimal.rrr}R</strong> for better consistency</li>
                <li>• You're hitting targets only {hitRate.toFixed(0)}% of the time</li>
                <li>• More realistic targets = fewer stopped out trades = better results</li>
                {avoidableLosses.length > 0 && (
                  <li className="font-semibold">• If you had used {optimal.rrr}R instead, {avoidableLosses.length} more trades would have been winners</li>
                )}
              </>
            )}
            {behavior === 'balanced' && (
              <>
                <li>• Your RRR targeting is well balanced</li>
                <li>• Consider <strong className="text-foreground">{optimal.rrr}R</strong> as optimal based on your data</li>
                <li>• Keep tracking planned vs actual to maintain this balance</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
