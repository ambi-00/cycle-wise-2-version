/**
 * Trade Review Modal
 * Appears immediately after closing a trade to assess execution quality
 * Focuses on PROCESS, not outcome (P&L)
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Award, Target, Brain, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TradeReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (reviewData: TradeExecutionReview) => void;
  tradeData: {
    id: string;
    symbol: string;
    result: 'win' | 'loss' | 'breakeven';
    profitLoss: number;
    strategy?: string;
  };
  strategyExitCriteria?: string[]; // From strategy definition
}

export interface TradeExecutionReview {
  followed_entry_criteria: boolean;
  followed_exit_criteria: boolean;
  risk_appropriate: boolean;
  emotionally_neutral: boolean;
  execution_score: number;
  execution_notes: string;
  exit_criteria_used: string;
}

export default function TradeReviewModal({ 
  open, 
  onOpenChange, 
  onComplete, 
  tradeData,
  strategyExitCriteria = []
}: TradeReviewModalProps) {
  const [followedEntry, setFollowedEntry] = useState<boolean | null>(null);
  const [followedExit, setFollowedExit] = useState<boolean | null>(null);
  const [riskAppropriate, setRiskAppropriate] = useState<boolean | null>(null);
  const [emotionallyNeutral, setEmotionallyNeutral] = useState<boolean | null>(null);
  const [exitCriteriaUsed, setExitCriteriaUsed] = useState("");
  const [notes, setNotes] = useState("");

  // Calculate execution score (0-100%)
  const calculateScore = () => {
    const checks = [followedEntry, followedExit, riskAppropriate, emotionallyNeutral];
    const completed = checks.filter(c => c === true).length;
    const total = checks.filter(c => c !== null).length;
    return total > 0 ? Math.round((completed / 4) * 100) : 0;
  };

  const executionScore = calculateScore();
  const allChecked = [followedEntry, followedExit, riskAppropriate, emotionallyNeutral].every(c => c !== null);

  const handleComplete = () => {
    if (!allChecked) return;

    const reviewData: TradeExecutionReview = {
      followed_entry_criteria: followedEntry!,
      followed_exit_criteria: followedExit!,
      risk_appropriate: riskAppropriate!,
      emotionally_neutral: emotionallyNeutral!,
      execution_score: executionScore,
      execution_notes: notes.trim(),
      exit_criteria_used: exitCriteriaUsed || 'Not specified'
    };

    onComplete(reviewData);
    onOpenChange(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMentoringMessage = () => {
    const isProfitable = tradeData.result === 'win';
    
    if (executionScore === 100) {
      if (isProfitable) {
        return {
          icon: Award,
          color: 'text-green-500',
          message: "Perfect execution + profitable result! This is how pro traders operate.",
          tip: "Remember: Even perfect execution doesn't guarantee wins. Consistency in your process is what matters long-term."
        };
      } else {
        return {
          icon: Award,
          color: 'text-blue-500',
          message: "Perfect execution despite the loss. This is a WINNING trade in terms of process!",
          tip: "Losses are part of trading. What matters is that you followed your rules. Your statistical edge will play out over time."
        };
      }
    }

    if (executionScore >= 75) {
      return {
        icon: TrendingUp,
        color: 'text-green-500',
        message: "Strong execution! You're trading with discipline.",
        tip: "Keep this consistency up and your edge will compound over time."
      };
    }

    if (executionScore >= 50) {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        message: "Decent execution, but room for improvement.",
        tip: "Which rule did you break? Understanding this pattern is how you improve. It's not about perfection, it's about progress."
      };
    }

    return {
      icon: Brain,
      color: 'text-orange-500',
      message: "This trade wasn't according to plan. That's okay - awareness is the first step.",
      tip: "Every trader breaks rules sometimes. The key is: 1) Notice it, 2) Understand why, 3) Learn from it. You're doing step 1 right now."
    };
  };

  const mentoring = allChecked ? getMentoringMessage() : null;
  const MentoringIcon = mentoring?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5" />
            Trade Execution Review
          </DialogTitle>
          <DialogDescription>
            Focus on your PROCESS, not the outcome. A loss with perfect execution is better than a lucky win.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trade Summary */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trade Closed</p>
                <p className="text-lg font-semibold">{tradeData.symbol}</p>
                {tradeData.strategy && (
                  <Badge variant="outline" className="mt-1">{tradeData.strategy}</Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Result</p>
                <p className={`text-2xl font-bold ${
                  tradeData.result === 'win' ? 'text-green-500' :
                  tradeData.result === 'loss' ? 'text-red-500' :
                  'text-muted-foreground'
                }`}>
                  ${tradeData.profitLoss.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Execution Checks */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Rate Your Execution</h3>
            
            {/* Entry Criteria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Did you follow your entry criteria?</label>
              <div className="flex gap-2">
                <Button
                  variant={followedEntry === true ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFollowedEntry(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Yes
                </Button>
                <Button
                  variant={followedEntry === false ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setFollowedEntry(false)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  No
                </Button>
              </div>
            </div>

            {/* Exit Criteria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Did you follow your exit criteria?</label>
              <div className="flex gap-2">
                <Button
                  variant={followedExit === true ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFollowedExit(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Yes
                </Button>
                <Button
                  variant={followedExit === false ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setFollowedExit(false)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  No
                </Button>
              </div>
            </div>

            {/* Exit Criteria Selection */}
            {strategyExitCriteria.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Which exit criteria did you use?</label>
                <Select value={exitCriteriaUsed} onValueChange={setExitCriteriaUsed}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exit criteria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyExitCriteria.map((criteria) => (
                      <SelectItem key={criteria} value={criteria}>
                        {criteria}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other / Not in plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Risk Management */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Was your risk size appropriate?</label>
              <div className="flex gap-2">
                <Button
                  variant={riskAppropriate === true ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setRiskAppropriate(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Yes
                </Button>
                <Button
                  variant={riskAppropriate === false ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setRiskAppropriate(false)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  No
                </Button>
              </div>
            </div>

            {/* Emotional Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Were you emotionally neutral?</label>
              <p className="text-xs text-muted-foreground">No fear, no greed, no revenge trading</p>
              <div className="flex gap-2">
                <Button
                  variant={emotionallyNeutral === true ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setEmotionallyNeutral(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Yes
                </Button>
                <Button
                  variant={emotionallyNeutral === false ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setEmotionallyNeutral(false)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  No
                </Button>
              </div>
            </div>
          </div>

          {/* Execution Score */}
          {allChecked && (
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Execution Score</span>
                <span className={`text-3xl font-bold ${getScoreColor(executionScore)}`}>
                  {executionScore}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    executionScore >= 75 ? 'bg-green-500' :
                    executionScore >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${executionScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Mentoring Message */}
          {mentoring && (
            <div className={`rounded-lg border-2 p-4 ${
              executionScore >= 75 ? 'border-green-500/30 bg-green-500/5' :
              executionScore >= 50 ? 'border-yellow-500/30 bg-yellow-500/5' :
              'border-orange-500/30 bg-orange-500/5'
            }`}>
              <div className="flex gap-3">
                {MentoringIcon && <MentoringIcon className={`h-6 w-6 flex-shrink-0 ${mentoring.color}`} />}
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{mentoring.message}</p>
                  <p className="text-sm text-muted-foreground">{mentoring.tip}</p>
                </div>
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Execution Notes (Optional)</label>
            <Textarea
              placeholder="What did you learn? What would you do differently?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onComplete({
                followed_entry_criteria: false,
                followed_exit_criteria: false,
                risk_appropriate: false,
                emotionally_neutral: false,
                execution_score: 0,
                execution_notes: '',
                exit_criteria_used: 'Review skipped'
              })}
            >
              Skip Review
            </Button>
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={!allChecked}
            >
              Complete Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
