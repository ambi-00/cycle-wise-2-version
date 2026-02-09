import { Calendar, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate } from "react-router-dom";

interface CyclePrediction {
  nextPeriodStart: string;
  nextOvulation: string;
  daysUntilPeriod: number;
  confidence: "high" | "medium" | "low";
  recommendation: string;
}

interface CyclePredictionsProps {
  mode?: "recommendation" | "predictions" | "all";
}

export default function CyclePredictions({ mode = "all" }: CyclePredictionsProps) {
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();
  const hasPro = hasFeature('smart_predictions');

  const getPredictions = (): CyclePrediction | null => {
    try {
      const lastPeriodStart = localStorage.getItem("cw_lastPeriodStart");
      if (!lastPeriodStart) return null;

      const avgCycleLength = Number(localStorage.getItem("cw_avgCycleLength") || 28);
      const periodLength = Number(localStorage.getItem("cw_periodLength") || 5);

      const lastDate = new Date(lastPeriodStart);
      const today = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;

      // Calculate days since last period
      const daysSinceLastPeriod = Math.floor((today.getTime() - lastDate.getTime()) / msPerDay);
      const currentCycleDay = ((daysSinceLastPeriod % avgCycleLength) + avgCycleLength) % avgCycleLength + 1;

      // Predict next period
      const daysUntilPeriod = avgCycleLength - (daysSinceLastPeriod % avgCycleLength);
      const nextPeriodDate = new Date(today.getTime() + daysUntilPeriod * msPerDay);

      // Predict next ovulation (typically 14 days before next period)
      const nextOvulationDate = new Date(nextPeriodDate.getTime() - 14 * msPerDay);

      // Determine confidence based on cycle regularity
      const cycleHistory = getCycleHistory();
      const confidence = cycleHistory.length >= 3 ? "high" : cycleHistory.length >= 1 ? "medium" : "low";

      // Generate recommendation based on current phase
      const recommendation = getPhaseRecommendation(currentCycleDay, periodLength, avgCycleLength);

      return {
        nextPeriodStart: nextPeriodDate.toISOString().slice(0, 10),
        nextOvulation: nextOvulationDate.toISOString().slice(0, 10),
        daysUntilPeriod,
        confidence,
        recommendation,
      };
    } catch (error) {
      return null;
    }
  };

  const getCycleHistory = (): string[] => {
    const history: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cw_journal_')) {
        try {
          const journal = JSON.parse(localStorage.getItem(key) || '{}');
          if (journal.hasPeriod) {
            history.push(key.replace('cw_journal_', ''));
          }
        } catch {}
      }
    }
    return history.sort().reverse();
  };

  const getPhaseRecommendation = (cycleDay: number, periodLen: number, cycleLen: number): string => {
    const follicularEnd = Math.min(periodLen + 7, cycleLen);
    const ovulationEnd = Math.min(periodLen + 11, cycleLen);

    if (cycleDay <= periodLen) {
      return "🩸 Menstruation phase - Consider lighter trading, focus on recovery and rest";
    } else if (cycleDay <= follicularEnd) {
      return "✨ Follicular phase - High energy! Great time for learning new strategies";
    } else if (cycleDay <= ovulationEnd) {
      return "🌟 Ovulation phase - Peak performance! Your best trading days";
    } else {
      return "🌙 Luteal phase - Energy may vary - stick to proven strategies and manage risk carefully";
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const prediction = getPredictions();

  if (!prediction) {
    return (
      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          Track your first period to get personalized predictions!
        </AlertDescription>
      </Alert>
    );
  }

  const confidenceColors = {
    high: "text-accent-foreground",
    medium: "text-primary",
    low: "text-muted-foreground",
  };

  const confidenceText = {
    high: "High confidence - Based on your cycle pattern",
    medium: "Medium confidence - Track more cycles for better accuracy",
    low: "Low confidence - We need more data for accurate predictions",
  };

  return (
    <div className="space-y-4">
      {/* Confidence Level & Today's Recommendation */}
      {(mode === "recommendation" || mode === "all") && (
        <>
          <div className={`text-sm ${confidenceColors[prediction.confidence]} flex items-center gap-1 p-3 rounded-lg bg-muted/30`}>
            <span className="font-medium">Confidence: {prediction.confidence.toUpperCase()}</span>
            <span>·</span>
            <span>{confidenceText[prediction.confidence]}</span>
          </div>

          <Alert className="border-accent/50 bg-accent/10">
            <AlertDescription className="text-sm">
              <strong>Today's Recommendation:</strong> {prediction.recommendation}
            </AlertDescription>
          </Alert>
        </>
      )}

      {/* Smart Predictions Card */}
      {(mode === "predictions" || mode === "all") && (
        <>
          {!hasPro ? (
            <div className="relative">
              <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                <Card className="max-w-md w-full">
                  <CardContent className="p-8 text-center">
                    <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-xl mb-2">Pro Feature</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Upgrade to Pro for AI-powered cycle predictions and personalized trading recommendations.
                    </p>
                    <Button onClick={() => navigate('/checkout?tier=pro&returnTo=/dashboard')} size="lg" className="w-full">
                      Upgrade to Pro - €19.99/mo
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-2 border-primary/20 blur-sm pointer-events-none">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Smart Predictions</h3>
                      <p className="text-xs text-muted-foreground">AI-powered cycle insights</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-1">Next Period</p>
                      <p className="text-2xl font-bold text-foreground">Jan 15, 2024</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-1">Next Ovulation</p>
                      <p className="text-2xl font-bold text-foreground">Jan 28, 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Smart Predictions</h3>
                    <p className="text-xs text-muted-foreground">Based on your cycle pattern</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Next Period</p>
                    <p className="text-2xl font-bold text-foreground">{formatDate(prediction.nextPeriodStart)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      in {prediction.daysUntilPeriod} {prediction.daysUntilPeriod === 1 ? "day" : "days"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Next Ovulation</p>
                    <p className="text-2xl font-bold text-foreground">{formatDate(prediction.nextOvulation)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Peak performance window</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
