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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-destructive" />
            <div>
              <CardTitle>Daily Trading Health Check-In 💚</CardTitle>
              <CardDescription>Let's assess your readiness to trade today</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-24">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-3 block">🍎 Nutrition - Did you eat enough today?</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['poor', 'fair', 'good', 'excellent'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setNutrition(opt)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                        nutrition === opt
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {opt === 'poor' && '😟 Poor'}
                      {opt === 'fair' && '😐 Fair'}
                      {opt === 'good' && '😊 Good'}
                      {opt === 'excellent' && '😄 Excellent'}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">Next →</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  How's your mood right now? (1 = terrible, 10 = fantastic)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold min-w-[3rem] text-center">{mood}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {mood <= 3 && '😞 Very low'}
                  {mood > 3 && mood <= 5 && '😕 Below average'}
                  {mood > 5 && mood <= 7 && '😐 Neutral'}
                  {mood > 7 && mood <= 8 && '😊 Good'}
                  {mood > 8 && '🤩 Excellent!'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">← Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Next →</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  How's your concentration? (1 = can't focus, 10 = laser-focused)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={concentration}
                    onChange={(e) => setConcentration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold min-w-[3rem] text-center">{concentration}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {concentration <= 3 && '🌫️ Very foggy'}
                  {concentration > 3 && concentration <= 5 && '😵 Scattered'}
                  {concentration > 5 && concentration <= 7 && '📍 Decent'}
                  {concentration > 7 && concentration <= 8 && '🎯 Focused'}
                  {concentration > 8 && '🔥 Locked in!'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">← Back</Button>
                <Button onClick={() => setStep(4)} className="flex-1">Next →</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-3 block">😴 How was your sleep last night?</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sleep}
                    onChange={(e) => setSleep(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold min-w-[3rem] text-center">{sleep}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {sleep <= 3 && '😫 Terrible'}
                  {sleep > 3 && sleep <= 5 && '😴 Poor'}
                  {sleep > 5 && sleep <= 7 && '😐 Average'}
                  {sleep > 7 && sleep <= 8 && '😊 Good'}
                  {sleep > 8 && '😍 Excellent!'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1">← Back</Button>
                <Button onClick={() => setStep(5)} className="flex-1">Next →</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-3 block">😰 Current stress level? (1 = calm, 10 = very stressed)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stress}
                    onChange={(e) => setStress(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold min-w-[3rem] text-center">{stress}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {stress <= 2 && '😌 Very calm'}
                  {stress > 2 && stress <= 4 && '😊 Relaxed'}
                  {stress > 4 && stress <= 6 && '😐 Moderate'}
                  {stress > 6 && stress <= 8 && '😟 Stressed'}
                  {stress > 8 && '😰 Very stressed'}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold block">💪 Have you exercised today?</label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={hasExercised}
                    onCheckedChange={(checked) => setHasExercised(!!checked)}
                    id="exercise"
                  />
                  <label htmlFor="exercise" className="text-sm">Yes, I exercised or moved around</label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(4)} variant="outline" className="flex-1">← Back</Button>
                <Button onClick={() => setStep(6)} className="flex-1">See Recommendations →</Button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-start gap-3 mb-4">
                  <Heart className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Your Trading Readiness Assessment</h3>
                    <p className="text-sm text-muted-foreground">Based on your health check-in</p>
                  </div>
                </div>

                {/* Risk Adjustment Badge */}
                <div className="mb-4">
                  {riskReduction > 0 ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Risk Reduction: {riskReduction}%
                      </Badge>
                      <span className="text-sm text-muted-foreground">Recommended</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Green Light - Trade Normally
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-warning" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Nutrition</div>
                  <div className="text-sm font-semibold capitalize">{nutrition}</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Avg Score</div>
                  <div className="text-sm font-semibold">{Math.round((mood + concentration + sleep) / 3)}/10</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Stress Level</div>
                  <div className="text-sm font-semibold">{stress}/10</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(5)} variant="outline" className="flex-1">← Edit</Button>
                <Button onClick={handleComplete} className="flex-1 bg-gradient-to-r from-primary to-primary/70">
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
