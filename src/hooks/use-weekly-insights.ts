import { useEffect } from 'react';
import { AIInsightsEngine, loadInsights, saveInsights } from '@/lib/aiInsightsEngine';
import { loadAllTrades } from '@/lib/supabaseHelpers';

/**
 * Hook to automatically generate AI insights weekly
 * Runs when the component mounts and checks if weekly analysis is due
 */
export function useWeeklyInsightGeneration() {
  useEffect(() => {
    const checkAndGenerateInsights = async () => {
      // Load all trades using the shared helper
      const trades = await loadAllTrades();
      
      // Need at least 5 trades to generate insights
      if (trades.length < 5) return;

      const engine = new AIInsightsEngine(trades);
      
      // Only run if weekly analysis is due
      if (engine.shouldRunWeeklyAnalysis()) {
        console.log('🤖 Running weekly AI insights analysis...');
        const newInsights = engine.generateInsights();
        
        if (newInsights.length > 0) {
          // Merge with existing insights (keep both old and new)
          const existingInsights = loadInsights();
          const mergedInsights = [...newInsights, ...existingInsights];
          
          // Keep only the most recent 50 insights to avoid storage bloat
          const limitedInsights = mergedInsights.slice(0, 50);
          
          saveInsights(limitedInsights);
          console.log(`✨ Generated ${newInsights.length} new AI insights!`);
        }
      }
    };

    // Run check on mount
    checkAndGenerateInsights();

    // Also run check once per day
    const interval = setInterval(checkAndGenerateInsights, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
