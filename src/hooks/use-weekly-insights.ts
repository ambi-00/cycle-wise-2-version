import { useEffect } from 'react';
import { AIInsightsEngine, loadInsights, saveInsights } from '@/lib/aiInsightsEngine';

/**
 * Hook to automatically generate AI insights weekly
 * Runs when the component mounts and checks if weekly analysis is due
 */
export function useWeeklyInsightGeneration() {
  useEffect(() => {
    const checkAndGenerateInsights = () => {
      // Load all trades from localStorage
      const loadAllTrades = () => {
        const allTrades: any[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cw_journal_')) {
            try {
              const raw = localStorage.getItem(key);
              if (!raw) continue;
              const dayData = JSON.parse(raw);
              // Handle both old format (array) and new format (object with trades array)
              if (Array.isArray(dayData)) {
                allTrades.push(...dayData);
              } else if (dayData.trades && Array.isArray(dayData.trades)) {
                allTrades.push(...dayData.trades);
              }
            } catch (e) {
              // Ignore malformed entries
            }
          }
        }
        
        return allTrades;
      };

      const trades = loadAllTrades();
      
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
