import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAIInsightsAnalysis, AnalysisInsight } from "@/hooks/use-ai-insights";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  trades: any[];
}

const getIconForCategory = (category: string) => {
  switch (category) {
    case 'overtrading': return '🛑';
    case 'rrr': return '🎯';
    case 'sl': return '🛡️';
    case 'avoidable_losses': return '💥';
    case 'performance': return '📊';
    default: return '💡';
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'critical': return 'from-red-500/20 to-red-600/10 border-red-500/30';
    case 'warning': return 'from-orange-500/20 to-orange-600/10 border-orange-500/30';
    case 'recommendation': return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
    case 'success': return 'from-green-500/20 to-green-600/10 border-green-500/30';
    default: return 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
  }
};

const getActionForCategory = (category: string) => {
  switch (category) {
    case 'overtrading': return { label: 'View Overtrading Analysis', path: '/statistics' };
    case 'rrr': return { label: 'View RRR Analysis', path: '/statistics' };
    case 'sl': return { label: 'View SL Analysis', path: '/statistics' };
    case 'avoidable_losses': return { label: 'View RRR Analysis', path: '/statistics' };
    case 'performance': return { label: 'View Performance Stats', path: '/statistics' };
    default: return { label: 'View Analysis', path: '/statistics' };
  }
};

function InsightCard({ insight, index }: { insight: AnalysisInsight; index: number }) {
  const navigate = useNavigate();
  const action = getActionForCategory(insight.category);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`rounded-2xl shadow-soft border-2 bg-gradient-to-br ${getColorForType(insight.type)}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {getIconForCategory(insight.category)}
              </div>
              <div>
                <Badge variant={insight.type === 'critical' ? 'destructive' : insight.type === 'success' ? 'default' : 'secondary'}>
                  Priority {insight.priority}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                  {insight.category.replace('_', ' ')} Analysis
                </p>
              </div>
            </div>
            <div className="text-right">
              {insight.type === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
              {insight.type === 'recommendation' && <Lightbulb className="h-5 w-5 text-blue-500" />}
              {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
          </div>
          
          <p className="text-foreground font-medium mb-4 leading-relaxed">
            {insight.message}
          </p>
          
          {insight.actionable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(action.path)}
              className="group"
            >
              {action.label}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function IntelligentAIInsights({ trades }: Props) {
  const insights = useAIInsightsAnalysis(trades);

  if (insights.length === 0) {
    return (
      <Card className="rounded-2xl shadow-soft border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Trading Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Not enough data for AI analysis yet. Keep logging trades to get personalized insights!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              We need at least 10 trades to generate meaningful recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Categorize insights
  const criticalInsights = insights.filter(i => i.type === 'critical');
  const warnings = insights.filter(i => i.type === 'warning');
  const recommendations = insights.filter(i => i.type === 'recommendation');
  const successes = insights.filter(i => i.type === 'success');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-2xl shadow-soft border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl font-serif font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Trading Insights
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Based on analysis of {trades.length} trades across RRR optimization, stop loss patterns, and overtrading detection
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{criticalInsights.length}</div>
              <div className="text-xs text-muted-foreground">Critical Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{warnings.length}</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{recommendations.length}</div>
              <div className="text-xs text-muted-foreground">Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{successes.length}</div>
              <div className="text-xs text-muted-foreground">Strengths</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      {criticalInsights.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Issues - Action Required
          </h3>
          <div className="grid gap-4">
            {criticalInsights.map((insight, index) => (
              <InsightCard key={`critical-${index}`} insight={insight} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Areas for Improvement
          </h3>
          <div className="grid gap-4">
            {warnings.map((insight, index) => (
              <InsightCard key={`warning-${index}`} insight={insight} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Optimization Opportunities
          </h3>
          <div className="grid gap-4">
            {recommendations.map((insight, index) => (
              <InsightCard key={`rec-${index}`} insight={insight} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Successes */}
      {successes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            What You're Doing Well
          </h3>
          <div className="grid gap-4">
            {successes.map((insight, index) => (
              <InsightCard key={`success-${index}`} insight={insight} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}