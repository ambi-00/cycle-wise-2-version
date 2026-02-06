# AI Insights Data Collection Guide

## Overview
CycleWise collects comprehensive trading data to power 6 AI-driven insights. Each insight requires specific data points.

---

## 1. 😰 Emotional State Impact (Anxious vs. Calm trading)

**Purpose:** Identify correlation between emotional state and trading performance.

**Data Points Collected:**
- `emotionalStateTrading` - Trader's emotional state when entering trade ('anxious', 'calm', 'neutral')
- `emotion_before` & `emotion_after` - Emotion rating before/after trade (1-10 scale in Day.tsx)
- `stress` - Stress level (1-10 scale in Day.tsx)
- `result` - Trade result (win/loss/breakeven)
- `pnl` - Profit/loss amount
- `win_rate` - Calculate from trades filtered by emotional state

**Collection Points:**
- NewTrade.tsx: `emotionalStateTrading` dropdown when creating trade
- Day.tsx: `stress` slider (1-10) in journal section
- NewTrade.tsx: `emotion_before` slider when entering trade

**Example Insight:**
"Trades when anxious (stress > 7) have 32% lower success rate. Best performance when calm (stress < 4): 78% win rate."

---

## 2. 📊 R:R Ratio Optimization

**Purpose:** Identify optimal Risk:Reward ratios for consistent profitability.

**Data Points Collected:**
- `planned_rrr` - Planned Risk:Reward ratio at entry
- `closed_rrr` - Actual Risk:Reward ratio at exit
- `rMultiple` (r_multiple) - Actual R multiples achieved
- `sl_price` - Stop loss price
- `tp_price` - Take profit price
- `entry_price` - Entry price
- `result` - Trade result
- `pnl` - Profit/loss
- `instrument` - Currency pair (EUR/USD, GBP/JPY, etc.)

**Collection Points:**
- NewTrade.tsx: Entry form → "Planned RRR" input
- NewTrade.tsx: Exit form → "Closed RRR" input
- Automatic calculation from SL/TP prices

**Example Insight:**
"Your 1:2 RRR trades average 72% win rate, but 1:3 trades only 58%. Optimize for 1:2 ratio for consistency."

---

## 3. 🩸 Menstrual Phase Trading Alert

**Purpose:** Reveal how menstrual cycle phases affect trading psychology and performance.

**Data Points Collected:**
- `cycle_phase` - Current cycle phase (menstruation/follicular/ovulation/luteal)
- `cycle_day` - Day within cycle
- `result` - Trade result
- `pnl` - Profit/loss
- `win_rate` - Calculated per phase
- `emotion_before` - Emotional state
- `energy` - Energy level (1-10)
- `focus` - Mental clarity (1-10)

**Collection Points:**
- CycleTracker.tsx: User sets cycle start date
- Day.tsx: System auto-calculates phase based on cycle data
- Automatically tracked with each trade

**Example Insight:**
"Menstrual phase: 52% win rate. Follicular: 71% (best!). Consider taking more setups during follicular phase."

---

## 4. 🕐 Session Timing Success (London vs. New York)

**Purpose:** Identify which trading sessions produce best results.

**Data Points Collected:**
- `sessionTime` - Trading session (london/newyork/asia/other) - NEW FIELD
- `sessionStartTime` - When trade was entered (time of day)
- `date` - Date of trade (to calculate session)
- `result` - Trade result
- `pnl` - Profit/loss
- `win_rate` - Calculated per session
- `emotion_before` - Emotional state during session

**Collection Points:**
- NewTrade.tsx: `sessionTime` dropdown when creating trade
- NewTrade.tsx: `sessionStartTime` auto-captured from system time
- Automatic from `date` field

**Session Times (UTC-based):**
- 🇬🇧 London: 08:00-17:00 UTC
- 🇺🇸 New York: 13:00-22:00 UTC
- 🌏 Asia: 23:00-08:00 UTC

**Example Insight:**
"London session outperforms NY by 22%. Your morning trades (9-11 AM): 68% win rate. Focus on London hours for consistency."

---

## 5. ⚠️ Winning Streak Behavior (Overtrading Warning)

**Purpose:** Detect overtrading patterns and preserve capital during winning streaks.

**Data Points Collected:**
- `result` - Each trade's result
- `date` & `time` - Trade execution time (sequential ordering)
- `pnl` - Profit/loss (to identify streaks)
- `sessionStartTime` - Time trade was entered
- Track consecutive wins: win → win → win → ?

**Collection Points:**
- NewTrade.tsx: Each trade entry records result
- Automatic calculation from historical trades
- System detects 3+ consecutive wins

**Example Insight:**
"After 3+ consecutive wins, your next trade has 38% lower success rate (vs 65% baseline). You tend to overtrade. Set daily win limit: 3."

**Recommended Action:**
- Alert user after 3 consecutive wins
- Suggest taking break or reducing position size
- Track behavior change week-over-week

---

## 6. 📈 Pair Performance Ranking (EUR/USD vs. GBP/JPY)

**Purpose:** Focus on profitable currency pairs and avoid underperforming ones.

**Data Points Collected:**
- `instrument` - Currency pair (EUR/USD, GBP/JPY, AUD/USD, etc.)
- `result` - Trade result per pair
- `pnl` - Profit/loss per pair
- `win_rate` - Calculated per instrument
- `direction` - Long/short bias per pair
- `closed_rrr` - Risk/reward actually achieved per pair

**Collection Points:**
- NewTrade.tsx: Instrument input field
- Automatic aggregation across all trades
- TradeInsert type tracks instrument

**Example Insight:**
"EUR/USD: 73% win rate (best). GBP/JPY: 41% (avoid). XAU/USD: 58%. Focus on EUR/USD for next 2 weeks."

**Data Breakdown:**
```
EUR/USD: 
  - 15 trades, 11 wins, 73% WR
  - Avg PnL: +45 pips
  - Best in follicular phase

GBP/JPY:
  - 12 trades, 5 wins, 41% WR
  - Avg PnL: -28 pips
  - Avoid during menstrual phase
```

---

## 7. 😴 Sleep Quality Correlation

**Purpose:** Connect sleep quality to trading decision quality and performance.

**Data Points Collected:**
- `sleepQuality` - Sleep quality rating (1-10 scale from Day.tsx)
- `sleep_hours` - Optional: hours slept (for future enhancement)
- `date` - Date of sleep
- `result` - Trade results on that day
- `win_rate` - Calculated for trades on high/low sleep days
- `pnl` - Average P&L on good vs. poor sleep days

**Collection Points:**
- Day.tsx: Sleep Quality slider (1-10) in journal section
- Automatic matching of sleep data with trades for same date
- System tracks daily sleep → next day trading performance

**Example Insight:**
"Poor sleep (1-5 rating): 28% lower win rate. Best trading: days after 8+ hours sleep. Prioritize rest for cognitive performance."

**Recommended Action:**
- Alert user if sleep quality drops below 5: "Low sleep detected. Consider reducing position sizes."
- Track sleep trend vs. monthly P&L correlation
- Seasonal analysis: sleep pattern changes by cycle phase

---

## Data Storage Implementation

### localStorage Keys for AI Insights Data:
```javascript
// Individual trade
cw_journal_2025-02-06 → {
  trades: [{
    id, date, time, instrument,
    result, pnl, rMultiple,
    emotionalStateTrading,    // NEW
    sessionTime,              // NEW
    sessionStartTime,         // NEW
    cyclePhase, cycleDay,
    emotion_before, emotion_after,
    strategy, rrr, closedRrr,
    ...
  }]
}

// Cycle tracking
cw_lastPeriodStart
cw_avgCycleLength
cw_periodLength

// Daily journal
cw_journal_2025-02-06 → {
  sleepQuality,
  energy, focus, stress, mood,
  ...
}
```

### Supabase Tables:
- `trades` table: Stores all trade data with AI fields
- `daily_journal` table: Stores daily metrics (sleep, mood, etc.)
- `cycle_logs` table: Stores cycle phase tracking

---

## Implementation Checklist

- ✅ **Emotional State**: emotionalStateTrading field added to NewTrade.tsx
- ✅ **R:R Ratio**: rrr, closedRrr, rMultiple fields tracked
- ✅ **Menstrual Phase**: cyclePhase, cycleDay auto-calculated
- ✅ **Session Timing**: sessionTime, sessionStartTime fields added to NewTrade.tsx
- ✅ **Winning Streak**: Automatic from trade results (sequential)
- ✅ **Pair Performance**: instrument field already tracked
- ✅ **Sleep Quality**: sleepQuality slider added to Day.tsx

---

## Next Steps for AI Insights Engine

1. **Create AI Insights Calculator** (`lib/aiInsightsEngine.ts`)
   - Calculate win rates by emotional state
   - Identify session timing patterns
   - Detect overtrading streaks
   - Rank instruments by performance

2. **Create AI Insights API Endpoint** (Backend)
   - Process trades data daily
   - Generate personalized recommendations
   - Send alerts for high-risk situations

3. **Create Visualization Components**
   - Pair performance ranking chart
   - Session timing comparison bars
   - Emotional state scatter plot
   - Sleep quality correlation graph

4. **Add Alerts & Notifications**
   - "Low sleep: reduce position size"
   - "3 wins: overtrade warning"
   - "Poor session timing detected"
   - "Cycle phase shift: trading behavior may change"

---

## Example AI Insights Output

```
Today's Trading Profile:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Session Timing: London (optimal)
😴 Sleep Quality: 9/10 (excellent for trading)
🩸 Cycle Phase: Follicular (high focus, 71% WR)
😰 Emotional State: Calm (78% WR in this state)
📈 Best Pair: EUR/USD (73% success)
⚠️ Alerts: None - optimal conditions!

Recommendation: Today is an excellent trading day.
Take EUR/USD setups in London session (8-14 UTC).
```

---

## Questions?

For questions about AI Insights data collection, see:
- `lib/aiInsightsEngine.ts` - Calculation engine
- `pages/AIInsights.tsx` - Display component
- `docs/AI_INSIGHTS_README.md` - Complete AI system guide
