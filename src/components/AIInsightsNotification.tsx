import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getNewInsights, markInsightsAsRead, type AIInsight } from "@/lib/aiInsightsEngine";

/**
 * AI Insights Notification Component
 * Shows pop-up notifications when new insights are discovered
 */
export default function AIInsightsNotification() {
  const [newInsights, setNewInsights] = useState<AIInsight[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for new insights every 5 minutes
    const checkForInsights = () => {
      const insights = getNewInsights();
      if (insights.length > 0) {
        setNewInsights(insights);
        setIsVisible(true);
      }
    };

    // Check immediately on mount
    checkForInsights();

    // Then check every 5 minutes
    const interval = setInterval(checkForInsights, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (currentInsightIndex < newInsights.length - 1) {
      setCurrentInsightIndex(prev => prev + 1);
    } else {
      setIsVisible(false);
      markInsightsAsRead();
      setNewInsights([]);
      setCurrentInsightIndex(0);
    }
  };

  const handleViewAll = () => {
    setIsVisible(false);
    markInsightsAsRead();
    setNewInsights([]);
    setCurrentInsightIndex(0);
    navigate('/insights');
  };

  if (!isVisible || newInsights.length === 0) return null;

  const currentInsight = newInsights[currentInsightIndex];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'from-destructive/20 to-destructive/10 border-destructive/30';
      case 'High': return 'from-primary/20 to-primary/10 border-primary/30';
      case 'Medium': return 'from-accent/20 to-accent/10 border-accent/30';
      default: return 'from-muted/20 to-muted/10 border-muted/30';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)]"
        >
          <Card className={`bg-gradient-to-br ${getImpactColor(currentInsight.impact)} border-2 shadow-2xl`}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary animate-pulse" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        New Insight
                      </p>
                    </div>
                    <h3 className="font-semibold text-foreground mt-1">
                      {currentInsight.title}
                    </h3>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Insight Content */}
              <div className="space-y-3">
                <p className="text-sm text-foreground leading-relaxed">
                  {currentInsight.insight}
                </p>

                <div className="rounded-lg bg-card/50 p-3 border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Recommended Action
                  </p>
                  <p className="text-sm text-foreground">
                    {currentInsight.actionable}
                  </p>
                </div>

                {/* Impact Badge */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={
                      currentInsight.impact === 'Critical' ? 'destructive' :
                      currentInsight.impact === 'High' ? 'default' :
                      'secondary'
                    }
                  >
                    {currentInsight.impact} Impact
                  </Badge>
                  
                  {newInsights.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {currentInsightIndex + 1} of {newInsights.length}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleViewAll}
                >
                  View All Insights
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDismiss}
                >
                  {currentInsightIndex < newInsights.length - 1 ? 'Next' : 'Dismiss'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
