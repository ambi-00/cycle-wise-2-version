import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Heart, Brain, Zap, TrendingDown, Loader } from 'lucide-react';

interface HealthCheckData {
  date: string;
  nutrition: 'poor' | 'fair' | 'good' | 'excellent';
  mood: number; // 1-10
  concentration: number; // 1-10
  sleep: number; // 1-10
  stress: number; // 1-10 (higher = more stressed)
  hasExercised: boolean;
  recommendations: string[];
  riskAdjustment: 'reduce' | 'maintain' | 'increase' | null;
  riskReduction: number; // percentage (e.g., 25 means reduce risk by 25%)
}

interface DailyHealthCheckInProps {
  onComplete: (data: HealthCheckData) => void;
  isOpen: boolean;
}

const RatingButtons = ({ value, onChange, max = 10 }: { value: number; onChange: (v: number) => void; max?: number }) => (
  <div className="flex gap-2 flex-wrap justify-center">
    {Array.from({ length: max }, (_, i) => i + 1).map((num) => (
      <button
        key={num}
        onClick={() => onChange(num)}
        className={`h-10 w-10 rounded-full font-semibold transition-all ${
          value === num
            ? 'bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-lg scale-110'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
        }`}
      >
        {num}
      </button>
    ))}
  </div>
);

export function DailyHealthCheckIn({ onComplete, isOpen }: DailyHealthCheckInProps) {
  const [step, setStep] = useState(1); // 1-5 for questions, 6 for recommendations, 7 for loading
  const [nutrition, setNutrition] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [mood, setMood] = useState(7);
  const [concentration, setConcentration] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(4);
  const [hasExercised, setHasExercised] = useState(false);

  const generateRecommendations = (): { recommendations: string[]; riskAdjustment: 'reduce' | 'maintain' | 'increase'; riskReduction: number } => {
    const recommendations: string[] = [];
    let riskReduction = 0;
    let riskAdjustment: 'reduce' | 'maintain' | 'increase' = 'maintain';

    // Calculate overall health score (weighted)
    const healthScore = (mood + concentration + sleep) / 3;
    const stressLevel = stress;
    const nutritionScore = nutrition === 'excellent' ? 10 : nutrition === 'good' ? 7 : nutrition === 'fair' ? 4 : 1;

    // MORE NUANCED RECOMMENDATIONS SYSTEM
    
    // 1. Nutrition impact (moderate)
    if (nutrition === 'poor') {
      recommendations.push('🍎 Poor nutrition detected - fuel your body first before trading');
      riskReduction += 10; // Much lower than before
    } else if (nutrition === 'fair') {
      recommendations.push('🍎 Fair nutrition - consider eating something substantial');
      riskReduction += 5;
    } else if (nutrition === 'excellent') {
      recommendations.push('✅ Excellent nutrition - great foundation for trading');
    }

    // 2. Mood impact (moderate if low, caution if high)
    if (mood <= 2) {
      recommendations.push('😔 Very low mood - avoid high-stress setups, stick to mechanical trades only');
      riskReduction += 15;
    } else if (mood === 3 || mood === 4) {
      recommendations.push('⚠️ Low mood - focus on high-conviction setups only');
      riskReduction += 10;
    } else if (mood >= 9) {
      recommendations.push('🔥 Excellent mood! Remember: overconfidence is a risk - stick to your rules strictly');
      // Don't penalize, just remind
    } else if (mood >= 7) {
      recommendations.push('😊 Good mood - solid foundation for trading');
    }

    // 3. Concentration impact (MOST critical)
    if (concentration <= 2) {
      recommendations.push('🧠 CRITICAL: Severe concentration issues - skip trading or trade 50%+ smaller positions');
      riskReduction += 35;
    } else if (concentration <= 4) {
      recommendations.push('⚠️ Low concentration - reduce position sizes by 25%, trade only proven setups');
      riskReduction += 20;
    } else if (concentration <= 6) {
      recommendations.push('📍 Moderate concentration - be extra strict with entry/exit confirmations');
      riskReduction += 8;
    } else if (concentration >= 9) {
      recommendations.push('🎯 Excellent focus - prime conditions for trading');
    }

    // 4. Sleep impact (VERY important)
    if (sleep <= 2) {
      recommendations.push('😴 Severely sleep deprived - prioritize rest, skip trading if possible');
      riskReduction += 40;
    } else if (sleep <= 4) {
      recommendations.push('😴 Poor sleep - trade with 30% smaller positions, avoid risky setups');
      riskReduction += 25;
    } else if (sleep <= 6) {
      recommendations.push('⚠️ Below-average sleep - reduce risk by 10%, focus on quality over quantity');
      riskReduction += 10;
    } else if (sleep >= 9) {
      recommendations.push('😴 Great sleep! Your recovery is solid');
    }

    // 5. Stress impact (moderate)
    if (stressLevel >= 9) {
      recommendations.push('😰 Extreme stress - avoid trading until you decompress (walk, breathe, meditate)');
      riskReduction += 20;
    } else if (stressLevel >= 7) {
      recommendations.push('⚠️ High stress - trade smaller, avoid revenge trading');
      riskReduction += 12;
    } else if (stressLevel >= 5) {
      recommendations.push('📊 Moderate stress - maintain discipline, avoid FOMO');
      riskReduction += 5;
    } else if (stressLevel <= 2) {
      recommendations.push('😌 Very calm - excellent mental state for trading');
    }

    // 6. Exercise bonus (positive)
    if (hasExercised) {
      recommendations.push('💪 You exercised! Improved focus & emotional control - great!');
      // Positive contribution, but doesn't reduce risk
    }

    // ADVANCED COMBINATIONS (only when MULTIPLE bad factors)
    const lowScoreCount = [mood <= 4, concentration <= 4, sleep <= 4, stressLevel >= 7].filter(Boolean).length;
    
    if (lowScoreCount >= 3) {
      recommendations.push('🚨 Multiple risk factors detected - seriously consider sitting out today or trading micro positions only');
      riskReduction = Math.min(riskReduction + 15, 70); // Cap at 70%, not 75%
    } else if (lowScoreCount === 2) {
      recommendations.push('⚠️ Two risk factors present - extra caution recommended');
      riskReduction = Math.min(riskReduction + 5, 70);
    }

    // NO PENALTIES for single "fair" scores
    if (riskReduction === 0 && recommendations.filter(r => r.includes('✅')).length === 0) {
      recommendations.push('✅ You\'re in reasonable shape for trading - proceed normally with discipline');
      riskAdjustment = 'maintain';
    } else if (riskReduction > 0) {
      riskAdjustment = 'reduce';
    }

    // Cap risk reduction at 70% (more realistic)
    riskReduction = Math.min(riskReduction, 70);

    return { recommendations, riskAdjustment, riskReduction };
  };

  const handleComplete = async () => {
    // Show loading screen for 1-2 seconds
    setStep(7);
    const { recommendations, riskAdjustment, riskReduction } = generateRecommendations();
    
    // Simulate thinking/processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const data: HealthCheckData = {
      date: new Date().toISOString().split('T')[0],
      nutrition,
      mood,
      concentration,
      sleep,
      stress,
      hasExercised,
      recommendations,
      riskAdjustment,
      riskReduction,
    };

    // Save to localStorage
    const key = `cw_daily_checkin_${data.date}`;
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem('cw_last_checkin', new Date().toISOString());

    onComplete(data);
  };

  if (!isOpen) return null;

  const { recommendations, riskReduction } = generateRecommendations();

  // Progress bar
  const progress = (step / 6) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-primary/15 to-primary/5 border-b sticky top-0">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-6 h-6 text-destructive" />
            <div className="flex-1">
              <CardTitle>Daily Trading Health Check-In</CardTitle>
              <CardDescription>Let's assess your readiness to trade today</CardDescription>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-primary to-primary/70 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-8 pb-24">
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <label className="text-lg font-semibold mb-6 block">🍎 Nutrition - Did you eat enough today?</label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(['poor', 'fair', 'good', 'excellent'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setNutrition(opt)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        nutrition === opt
                          ? 'bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-lg'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                    >
                      {opt === 'poor' && '😟\nPoor'}
                      {opt === 'fair' && '😐\nFair'}
                      {opt === 'good' && '😊\nGood'}
                      {opt === 'excellent' && '😄\nExcellent'}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full h-11">Next →</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    How's your mood?
                  </label>
                  <span className="text-3xl font-bold text-primary">{mood}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">1 = terrible, 10 = fantastic</p>
                <RatingButtons value={mood} onChange={setMood} />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-11">← Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 h-11">Next →</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    How's your concentration?
                  </label>
                  <span className="text-3xl font-bold text-primary">{concentration}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">1 = can't focus, 10 = laser-focused</p>
                <RatingButtons value={concentration} onChange={setConcentration} />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-11">← Back</Button>
                <Button onClick={() => setStep(4)} className="flex-1 h-11">Next →</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-lg font-semibold">😴 How was your sleep last night?</label>
                  <span className="text-3xl font-bold text-primary">{sleep}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">1 = terrible, 10 = excellent</p>
                <RatingButtons value={sleep} onChange={setSleep} />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1 h-11">← Back</Button>
                <Button onClick={() => setStep(5)} className="flex-1 h-11">Next →</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-lg font-semibold">😰 Current stress level?</label>
                  <span className="text-3xl font-bold text-primary">{stress}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">1 = calm, 10 = very stressed</p>
                <RatingButtons value={stress} onChange={setStress} />
              </div>

              <div className="space-y-4">
                <label className="text-lg font-semibold block">💪 Have you exercised today?</label>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <Checkbox
                    checked={hasExercised}
                    onCheckedChange={(checked) => setHasExercised(!!checked)}
                    id="exercise"
                    className="w-5 h-5"
                  />
                  <label htmlFor="exercise" className="text-base cursor-pointer">Yes, I exercised or moved around</label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(4)} variant="outline" className="flex-1 h-11">← Back</Button>
                <Button onClick={() => setStep(6)} className="flex-1 h-11">See Recommendations →</Button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                <div className="flex items-start gap-3 mb-4">
                  <Heart className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-xl">Your Trading Readiness</h3>
                    <p className="text-sm text-muted-foreground">Based on your health assessment</p>
                  </div>
                </div>

                {/* Risk Adjustment Badge */}
                <div className="mb-6">
                  {riskReduction > 0 ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="gap-2 px-4 py-2 text-sm">
                        <TrendingDown className="w-4 h-4" />
                        Risk Reduction: -{riskReduction}%
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Green Light - Trade Normally
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm bg-background/50 p-3 rounded-lg">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-warning" />
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Nutrition</div>
                  <div className="text-sm font-semibold capitalize">{nutrition}</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Mood</div>
                  <div className="text-sm font-semibold">{mood}/10</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Focus</div>
                  <div className="text-sm font-semibold">{concentration}/10</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Sleep</div>
                  <div className="text-sm font-semibold">{sleep}/10</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(5)} variant="outline" className="flex-1 h-11">← Edit</Button>
                <Button onClick={handleComplete} className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/70">
                  Start Trading ✅
                </Button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
              <div className="relative w-16 h-16">
                <Loader className="w-16 h-16 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Analyzing Your Health Data...</h3>
                <p className="text-muted-foreground text-sm">Creating personalized trading recommendations</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
