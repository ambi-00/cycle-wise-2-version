import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Heart, Brain, Zap, TrendingDown } from 'lucide-react';

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
  const [step, setStep] = useState(1); // 1-5 for questions, 6 for recommendations
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

    // Nutrition checks
    if (nutrition === 'poor' || nutrition === 'fair') {
      recommendations.push('🍎 Eat something nutritious before trading - poor nutrition = poor focus');
      riskReduction += 25;
    } else if (nutrition === 'excellent') {
      recommendations.push('✅ Great nutrition! Your body is primed for trading');
    }

    // Mood checks
    if (mood <= 3) {
      recommendations.push('😔 Your mood is very low - consider taking a break or only trading with MINIMUM risk');
      riskReduction += 40;
    } else if (mood <= 5) {
      recommendations.push('⚠️ Low mood detected - reduce position sizes by 25-50%');
      riskReduction += 30;
    } else if (mood >= 9) {
      recommendations.push('🔥 Excellent mood! But be careful of overconfidence - stick to your rules');
    }

    // Concentration checks
    if (concentration <= 3) {
      recommendations.push('🧠 Your concentration is very low - DO NOT trade today or use 50% smaller positions');
      riskReduction += 50;
    } else if (concentration <= 5) {
      recommendations.push('⚠️ Low concentration - reduce risk by 30%, use only your most proven setups');
      riskReduction += 30;
    } else if (concentration <= 6) {
      recommendations.push('📍 Moderate concentration - be extra strict with entry confirmations');
      riskReduction += 15;
    } else if (concentration >= 9) {
      recommendations.push('🎯 Excellent focus! Perfect conditions for trading');
    }

    // Sleep checks
    if (sleep <= 3) {
      recommendations.push('😴 Severely sleep deprived - skip trading, your body needs rest');
      riskReduction += 60;
    } else if (sleep <= 5) {
      recommendations.push('😴 Poor sleep quality - trade with 40% smaller positions');
      riskReduction += 40;
    } else if (sleep <= 6) {
      recommendations.push('⚠️ Below average sleep - reduce positions by 20%');
      riskReduction += 20;
    }

    // Stress checks
    if (stress >= 8) {
      recommendations.push('😰 High stress levels - this will cloud your judgment. Reduce risk by 35%');
      riskReduction += 35;
    } else if (stress >= 6) {
      recommendations.push('⚠️ Moderate-high stress - be extra careful with impulse trades');
      riskReduction += 20;
    }

    // Exercise checks
    if (hasExercised) {
      recommendations.push('💪 You exercised! This boosts focus and emotional regulation - nice!');
    }

    // Combined checks
    if (nutrition !== 'excellent' && concentration <= 5) {
      recommendations.push('🚨 Poor nutrition + low concentration = DANGEROUS combo. Fix nutrition first, then re-assess');
      riskReduction = Math.min(riskReduction + 20, 75);
    }

    if (sleep <= 5 && stress >= 6) {
      recommendations.push('🚨 Poor sleep + high stress = high risk of emotional decisions. Stay small');
      riskReduction = Math.min(riskReduction + 15, 75);
    }

    // No critical issues
    if (riskReduction === 0) {
      recommendations.push('✅ You\'re in great shape! Green light for normal trading');
      riskAdjustment = 'maintain';
    } else {
      riskAdjustment = 'reduce';
    }

    // Cap risk reduction at reasonable level
    riskReduction = Math.min(riskReduction, 75);

    return { recommendations, riskAdjustment, riskReduction };
  };

  const handleComplete = () => {
    const { recommendations, riskAdjustment, riskReduction } = generateRecommendations();
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
        </CardContent>
      </Card>
    </div>
  );
}
