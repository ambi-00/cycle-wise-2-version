# AI Insights Engine Documentation

## Overview

The AI Insights Engine automatically analyzes your trading data and generates personalized insights to help improve your trading performance. It runs weekly and detects new patterns as you log more trades.

## Features

### 1. **Automatic Analysis Types**

The engine analyzes 8 different aspects of your trading:

#### Pattern Recognition
- **Entry Timing**: Detects if you enter trades too early vs waiting for confirmation
- **Time-of-Day**: Identifies which trading sessions (Asian, London, NY) work best for you
- **Risk Management**: Alerts when position sizes are too large or inconsistent

#### Cycle Analysis
- **Phase Performance**: Compares R-multiples across menstrual cycle phases
- **Identifies best/worst phases** for trading based on your actual performance

#### Strategy Analysis
- **Strategy Effectiveness**: Compares win rates and R-multiples across different strategies
- **Pair-specific performance**: Identifies which strategies work best on specific currency pairs

#### Psychology Detection
- **Revenge Trading**: Detects emotional trading patterns after losses
- **Mistake Patterns**: Identifies your most common trading mistakes

#### Confirmation Analysis
- **Confirmation Effectiveness**: Calculates which confirmations give you the biggest edge
- **Win rate by confirmation type**

## How It Works

### Data Collection

The engine reads trades from localStorage:
```javascript
// Trades are stored under keys like:
cw_journal_2024-02-01
cw_journal_2024-02-02
// etc.
```

### Analysis Triggers

1. **Weekly Automatic Analysis**
   - Runs every 7 days automatically
   - Triggered on Dashboard load
   - Generates new insights if patterns are detected

2. **Manual Generation**
   - Users can click "Generate New Insights" in AI Insights page
   - Useful after logging many new trades

3. **Real-time Notifications**
   - Pop-up notifications appear when new insights are discovered
   - Shows one insight at a time
   - Can dismiss or view all insights

### Minimum Data Requirements

- **Entry Timing**: 10+ trades
- **Cycle Performance**: 20+ trades (with cycle phase data)
- **Strategy Analysis**: 15+ trades (with strategy data)
- **Revenge Trading**: 20+ trades
- **Confirmations**: 15+ trades (with confirmation data)
- **Time-of-Day**: 20+ trades (with time data)
- **Mistakes**: 15+ trades (with mistake data)
- **Risk Management**: 15+ trades (with R-multiple data)

## Code Structure

### Core Files

1. **`src/lib/aiInsightsEngine.ts`**
   - Main engine class
   - Analysis algorithms
   - Insight generation logic

2. **`src/components/AIInsightsNotification.tsx`**
   - Pop-up notification component
   - Shows new insights
   - Handles user interactions

3. **`src/pages/AIInsights.tsx`**
   - Main insights page
   - Displays all generated insights
   - Manual insight generation

4. **`src/hooks/use-weekly-insights.ts`**
   - Automatic weekly analysis hook
   - Runs on Dashboard mount

## Usage Examples

### Generate Insights Programmatically

```typescript
import { AIInsightsEngine, saveInsights } from '@/lib/aiInsightsEngine';

// Load your trades
const trades = loadAllTrades();

// Create engine instance
const engine = new AIInsightsEngine(trades);

// Generate insights
const insights = engine.generateInsights();

// Save to localStorage
saveInsights(insights);
```

### Check for New Insights

```typescript
import { getNewInsights, markInsightsAsRead } from '@/lib/aiInsightsEngine';

// Get unread insights
const newInsights = getNewInsights();

if (newInsights.length > 0) {
  // Show notifications
  showNotification(newInsights);
  
  // Mark as read
  markInsightsAsRead();
}
```

### Load All Insights

```typescript
import { loadInsights } from '@/lib/aiInsightsEngine';

const allInsights = loadInsights();
```

## Insight Structure

Each insight contains:

```typescript
interface AIInsight {
  id: string;                    // Unique identifier
  category: string;              // pattern | cycle | strategy | psychology | confirmation
  title: string;                 // Short title
  insight: string;               // Detailed explanation with data
  actionable: string;            // Recommended action
  impact: string;                // Critical | High | Medium | Low
  icon: string;                  // Icon name (Clock, Calendar, etc.)
  createdAt: Date;               // When insight was generated
  isNew: boolean;                // Whether user has seen it
  data?: any;                    // Supporting data
}
```

## Future Enhancements

### Planned Features
1. **AI-Powered Predictions**
   - Integrate OpenAI API for natural language insights
   - Predictive analysis of future performance

2. **Custom Insight Rules**
   - Let users define their own analysis rules
   - Custom thresholds for alerts

3. **Insight History**
   - Track which insights users acted on
   - Measure impact of implemented suggestions

4. **Smart Notifications**
   - Push notifications (if PWA)
   - Email summaries of weekly insights

5. **Comparative Analysis**
   - Compare to other traders (anonymized)
   - Industry benchmarks

## Storage

All insights are stored in localStorage:

```
Key: cw_ai_insights
Value: Array of AIInsight objects (JSON)

Key: cw_last_insight_analysis  
Value: ISO date string of last analysis
```

## Performance Considerations

- Insights are generated in the background (with setTimeout)
- Maximum of 50 insights stored to prevent storage bloat
- Analysis runs max once per week to avoid redundant calculations
- Notifications check every 5 minutes for new insights

## Testing

To test the engine:

1. Log at least 15-20 trades with varied data
2. Include cycle phases, strategies, confirmations
3. Visit Dashboard (triggers weekly check)
4. Or manually click "Generate New Insights"
5. Wait for pop-up notification
6. Check AI Insights page for full details

## Troubleshooting

**No insights generated:**
- Ensure you have at least 5 trades logged
- Check that trades have required data (cycle phase, strategy, etc.)
- Verify localStorage is not full

**Insights not showing:**
- Check browser console for errors
- Verify `cw_ai_insights` exists in localStorage
- Ensure `isNew: true` for new insights

**Weekly analysis not running:**
- Dashboard must be visited to trigger check
- Check `cw_last_insight_analysis` date in localStorage
- Ensure at least 7 days have passed since last analysis
