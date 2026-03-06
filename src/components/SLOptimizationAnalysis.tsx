import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

interface SLAnalysisProps {
  trades: any[];
}

export default function SLOptimizationAnalysis({ trades }: SLAnalysisProps) {
  // Only analyze closed trades with SL data
  const tradesWithSL = trades.filter(t => 
    t.status === 'closed' && 
    t.sl_distance !== undefined && 
    t.sl_distance !== null &&
    t.sl_distance > 0
  );

  if (tradesWithSL.length < 5) {
    return (
      <Card className="rounded-2xl shadow-soft border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Stop Loss Optimization Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Find your ideal stop loss size based on your trading data
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Not enough data</h3>
            <p className="text-muted-foreground">
              Log at least 5 trades with stop loss distances to see optimization insights.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Track SL distance in pips and note if it was too tight, too wide, or just right.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by instrument for instrument-specific analysis
  const byInstrument: Record<string, any[]> = {};
  tradesWithSL.forEach(t => {
    const instrument = t.symbol || t.instrument || 'Unknown';
    if (!byInstrument[instrument]) byInstrument[instrument] = [];
    byInstrument[instrument].push(t);
  });

  // Analyze SL feedback if available
  const slTooTight = tradesWithSL.filter(t => 
    t.sl_feedback === 'too_tight' || t.sl_feedback === 'too tight' ||
    (t.result === 'loss' && t.sl_hit_notes?.toLowerCase().includes('too tight'))
  );
  const slGood = tradesWithSL.filter(t => 
    t.sl_feedback === 'good' || t.sl_feedback === 'perfect' ||
    (t.result === 'win' && t.sl_distance)
  );
  const slTooWide = tradesWithSL.filter(t => 
    t.sl_feedback === 'too_wide' || t.sl_feedback === 'too wide'
  );

  // Calculate averages
  const avgSLAll = tradesWithSL.reduce((sum, t) => sum + (t.sl_distance || 0), 0) / tradesWithSL.length;
  const avgSLTooTight = slTooTight.length > 0 
    ? slTooTight.reduce((sum, t) => sum + (t.sl_distance || 0), 0) / slTooTight.length 
    : 0;
  const avgSLGood = slGood.length > 0 
    ? slGood.reduce((sum, t) => sum + (t.sl_distance || 0), 0) / slGood.length 
    : avgSLAll;
  const avgSLTooWide = slTooWide.length > 0 
    ? slTooWide.reduce((sum, t) => sum + (t.sl_distance || 0), 0) / slTooWide.length 
    : 0;

  // Calculate ideal SL based on winning trades and trades that weren't "too tight"
  const goodSLTrades = tradesWithSL.filter(t => 
    t.result === 'win' || 
    t.sl_feedback === 'good' || 
    t.sl_feedback === 'perfect' ||
    (t.result === 'loss' && t.sl_feedback !== 'too_tight')
  );
  
  const idealSL = goodSLTrades.length > 0
    ? goodSLTrades.reduce((sum, t) => sum + (t.sl_distance || 0), 0) / goodSLTrades.length
    : avgSLAll;

  // Test different SL sizes
  const testSLSizes = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
  
  const slStats = testSLSizes.map(slSize => {
    // Count how many trades would have worked with this SL
    const wouldWork = tradesWithSL.filter(t => {
      const tradeNeedsSL = t.sl_distance || avgSLAll;
      const wasTooTight = t.sl_feedback === 'too_tight' || t.sl_feedback === 'too tight';
      
      // If trade was too tight, it needs bigger SL
      if (wasTooTight) {
        return slSize > tradeNeedsSL;
      }
      // If trade won, current SL was ok
      if (t.result === 'win') {
        return slSize >= tradeNeedsSL * 0.8; // Allow 20% smaller
      }
      // If trade lost but SL wasn't too tight, it would likely still lose
      return false;
    }).length;

    const successRate = (wouldWork / tradesWithSL.length) * 100;
    
    return {
      size: slSize,
      successRate,
      wouldWork,
      total: tradesWithSL.length
    };
  });

  // Find optimal SL (best success rate without being too large)
  const optimal = slStats.reduce((best, current) => {
    if (current.successRate > best.successRate) return current;
    if (current.successRate === best.successRate && current.size < best.size) return current;
    return best;
  }, slStats[0]);

  // Determine behavior
  const tooTightRate = (slTooTight.length / tradesWithSL.length) * 100;
  const tooWideRate = (slTooWide.length / tradesWithSL.length) * 100;
  const behavior = tooTightRate > 30 ? 'too_tight' : 
                   tooWideRate > 30 ? 'too_wide' : 'balanced';

  return (
    <Card className="rounded-2xl shadow-soft border">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Stop Loss Optimization Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Based on {tradesWithSL.length} trades with SL data
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Behavior Analysis Card */}
        <div className={`p-6 rounded-xl bg-gradient-to-br border-2 ${
          behavior === 'too_tight' 
            ? 'from-red-500/20 to-red-600/10 border-red-500/30' 
            : behavior === 'too_wide' 
            ? 'from-blue-500/20 to-blue-600/10 border-blue-500/30'
            : 'from-green-500/20 to-green-600/10 border-green-500/30'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {behavior === 'too_tight' && '⚠️ Your SL is TOO TIGHT'}
                {behavior === 'too_wide' && '📏 Your SL is TOO WIDE'}
                {behavior === 'balanced' && '✅ Well Balanced Stop Loss'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {behavior === 'too_tight' && 'You get stopped out too often in noise'}
                {behavior === 'too_wide' && 'You risk more than necessary'}
                {behavior === 'balanced' && 'Your SL placement is working well'}
              </p>
            </div>
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{avgSLAll.toFixed(0)} pips</p>
              <p className="text-xs text-muted-foreground mt-1">Current Avg</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent-foreground">{idealSL.toFixed(0)} pips</p>
              <p className="text-xs text-muted-foreground mt-1">Ideal Size</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{optimal.size} pips</p>
              <p className="text-xs text-muted-foreground mt-1">Recommended</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-card/50">
            <p className="text-sm">
              {behavior === 'too_tight' && `${tooTightRate.toFixed(0)}% of your trades had SL too tight. Increase to ${optimal.size} pips for better results.`}
              {behavior === 'too_wide' && `${tooWideRate.toFixed(0)}% of your trades had SL too wide. You could reduce risk while maintaining results.`}
              {behavior === 'balanced' && `Your stop loss placement is working well. Keep using ${optimal.size} pips as your standard.`}
            </p>
          </div>
        </div>

        {/* Current vs Ideal vs Optimal */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-muted/30 border">
            <h4 className="font-semibold mb-2 text-sm">You Use</h4>
            <p className="text-2xl font-bold">{avgSLAll.toFixed(0)} pips</p>
            <p className="text-xs text-muted-foreground mt-1">
              Current average
            </p>
          </div>
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
            <h4 className="font-semibold mb-2 text-sm">From Good Trades</h4>
            <p className="text-2xl font-bold text-accent-foreground">{idealSL.toFixed(0)} pips</p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on winners
            </p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
            <h4 className="font-semibold mb-2 text-sm">Optimal Size</h4>
            <p className="text-2xl font-bold text-primary">{optimal.size} pips</p>
            <p className="text-xs text-muted-foreground mt-1">
              Best balance
            </p>
          </div>
        </div>

        {/* All SL Size Options */}
        <div>
          <h4 className="font-semibold mb-4">SL Size Success Rates</h4>
          <div className="space-y-2">
            {slStats.map((stat) => {
              const isOptimal = stat.size === optimal.size;
              const isCurrent = Math.abs(stat.size - avgSLAll) < 5;
              
              return (
                <div 
                  key={stat.size} 
                  className={`p-4 rounded-lg ${
                    isOptimal 
                      ? 'bg-primary/20 border-2 border-primary/40' 
                      : isCurrent
                      ? 'bg-accent/10 border border-accent/30'
                      : 'bg-muted/30 border border-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-16">{stat.size} pips</span>
                      {isOptimal && (
                        <Badge variant="default" className="text-xs">Optimal</Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="font-semibold">{stat.successRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{stat.wouldWork}/{stat.total}</p>
                        <p className="text-xs text-muted-foreground">Would Work</p>
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3 w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isOptimal ? 'bg-primary' : 'bg-accent'}`}
                      style={{ width: `${stat.successRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <span className="text-destructive">⚠️</span>
              Too Tight
            </h4>
            <p className="text-2xl font-bold mb-2">{slTooTight.length}</p>
            <p className="text-xs text-muted-foreground">
              trades stopped out in noise{avgSLTooTight > 0 ? ` (avg: ${avgSLTooTight.toFixed(0)} pips)` : ''}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Just Right
            </h4>
            <p className="text-2xl font-bold mb-2">{slGood.length}</p>
            <p className="text-xs text-muted-foreground">
              trades with good SL{avgSLGood > 0 ? ` (avg: ${avgSLGood.toFixed(0)} pips)` : ''}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              Too Wide
            </h4>
            <p className="text-2xl font-bold mb-2">{slTooWide.length}</p>
            <p className="text-xs text-muted-foreground">
              trades risking too much{avgSLTooWide > 0 ? ` (avg: ${avgSLTooWide.toFixed(0)} pips)` : ''}
            </p>
          </div>
        </div>

        {/* Per-Instrument Analysis */}
        {Object.keys(byInstrument).length > 1 && (
          <div>
            <h4 className="font-semibold mb-4">Per-Instrument Recommendations</h4>
            <div className="space-y-2">
              {Object.entries(byInstrument)
                .filter(([_, trades]) => trades.length >= 3)
                .map(([instrument, instrumentTrades]) => {
                  const avgSL = instrumentTrades.reduce((sum, t) => sum + (t.sl_distance || 0), 0) / instrumentTrades.length;
                  const goodTrades = instrumentTrades.filter(t => t.result === 'win' || t.sl_feedback === 'good');
                  const recommendedSL = goodTrades.length > 0
                    ? goodTrades.reduce((sum, t) => sum + (t.sl_distance || 0), 0) / goodTrades.length
                    : avgSL;
                  
                  return (
                    <div key={instrument} className="p-4 rounded-lg bg-muted/30 border flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{instrument}</p>
                        <p className="text-xs text-muted-foreground">{instrumentTrades.length} trades</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{recommendedSL.toFixed(0)} pips</p>
                        <p className="text-xs text-muted-foreground">
                          {avgSL > recommendedSL ? '↓ reduce' : avgSL < recommendedSL ? '↑ increase' : '→ maintain'}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/10 border">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>💡</span>
            Recommendations
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {slTooTight.length > 0 && (
              <li className="text-orange-600 dark:text-orange-400 font-semibold">
                ⚠️ <strong>{slTooTight.length} trades</strong> were stopped out too early. Increase your SL to <strong>{optimal.size} pips</strong> to avoid market noise.
              </li>
            )}
            {behavior === 'too_tight' && (
              <>
                <li>• Your average SL of {avgSLAll.toFixed(0)} pips is too small</li>
                <li>• Increase to <strong className="text-foreground">{optimal.size} pips</strong> for {optimal.successRate.toFixed(0)}% success rate</li>
                <li>• This will reduce unnecessary losses from market noise</li>
              </>
            )}
            {behavior === 'too_wide' && (
              <>
                <li>• Your SL of {avgSLAll.toFixed(0)} pips risks more than necessary</li>
                <li>• Reduce to <strong className="text-foreground">{optimal.size} pips</strong> to minimize losses</li>
                <li>• You'll maintain results while risking less capital</li>
              </>
            )}
            {behavior === 'balanced' && (
              <>
                <li>• Your SL placement is working well at {avgSLAll.toFixed(0)} pips</li>
                <li>• Consider standardizing at <strong className="text-foreground">{optimal.size} pips</strong> for consistency</li>
                <li>• Keep tracking feedback to maintain this balance</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
