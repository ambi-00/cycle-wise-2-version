// Demo account data - realistic 7-month trading journey from unprofitable to profitable
// This data is used when app_mode is set to 'DEMO'
// Generates 1-5 trades per trading day (Mon-Fri) with realistic progression

export interface DemoTrade {
  id: string;
  entry_date: string;
  exit_date: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price: number;
  position_size: number;
  profit_loss: number;
  profit_loss_percent: number;
  strategy: string;
  notes?: string;
  cycle_phase?: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
}

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'GOLD', 'BTCUSD', 'ETHUSD'];
const STRATEGIES = ['Breakout', 'Trend Following', 'Support/Resistance', 'Mean Reversion', 'Order Block', 'Supply/Demand'];

// Helper: Check if date is a trading day (Mon-Fri)
const isTradingDay = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday to Friday
};

// Helper: Generate trading days for a given month
const getTradingDays = (year: number, month: number): Date[] => {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (isTradingDay(date)) {
      days.push(date);
    }
  }
  return days;
};

// Generate trades for a specific phase with win rate and risk profile
const generateTradesForPhase = (
  startMonth: number,
  startYear: number,
  monthCount: number,
  winRate: number,
  avgWin: number,
  avgLoss: number,
  tradesPerDayMin: number,
  tradesPerDayMax: number,
  startId: number
): DemoTrade[] => {
  const trades: DemoTrade[] = [];
  let tradeId = startId;
  
  for (let monthOffset = 0; monthOffset < monthCount; monthOffset++) {
    const month = (startMonth + monthOffset) % 12;
    const year = startYear + Math.floor((startMonth + monthOffset) / 12);
    const tradingDays = getTradingDays(year, month);
    
    for (const day of tradingDays) {
      // Random number of trades per day (1-5)
      const numTrades = Math.floor(Math.random() * (tradesPerDayMax - tradesPerDayMin + 1)) + tradesPerDayMin;
      
      for (let i = 0; i < numTrades; i++) {
        const isWin = Math.random() < winRate;
        
        // Random entry time during trading hours (8:00-20:00)
        const entryDate = new Date(day);
        entryDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
        
        // Exit time: 1-8 hours later
        const exitDate = new Date(entryDate);
        exitDate.setHours(exitDate.getHours() + Math.floor(Math.random() * 7) + 1);
        
        const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const direction = Math.random() < 0.5 ? 'LONG' : 'SHORT';
        const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
        
        // Calculate P&L with some variance
        let profitLoss: number;
        if (isWin) {
          const variance = 0.5; // +/- 50% variance
          profitLoss = avgWin * (1 + (Math.random() - 0.5) * variance);
        } else {
          const variance = 0.5;
          profitLoss = -avgLoss * (1 + (Math.random() - 0.5) * variance);
        }
        
        // Notes based on performance
        let notes = '';
        if (isWin && profitLoss > avgWin * 1.3) {
          notes = 'Great execution, caught a strong move';
        } else if (isWin) {
          notes = 'Solid trade, followed the plan';
        } else if (profitLoss < -avgLoss * 1.3) {
          notes = 'Missed stop loss, let it run too far';
        } else {
          notes = 'Cut losses quickly, good discipline';
        }
        
        trades.push({
          id: `demo-trade-${tradeId}`,
          entry_date: entryDate.toISOString(),
          exit_date: exitDate.toISOString(),
          symbol,
          direction,
          entry_price: 1.0800 + Math.random() * 0.02,
          exit_price: 1.0800 + Math.random() * 0.02,
          position_size: 0.1 + Math.random() * 0.4,
          profit_loss: Math.round(profitLoss * 100) / 100,
          profit_loss_percent: profitLoss / 10000,
          strategy,
          notes,
        });
        
        tradeId++;
      }
    }
  }
  
  return trades;
};

// Generate all demo trades - 7 months journey
export const generateDemoTrades = (): DemoTrade[] => {
  const allTrades: DemoTrade[] = [];
  
  // Phase 1: Months 1-2 (Aug-Sep 2025) - Struggling (35% WR, bad R:R)
  // 1-3 trades per day, losing money
  allTrades.push(...generateTradesForPhase(
    7, 2025, 2,  // Aug-Sep 2025
    0.35,        // 35% win rate
    150,         // avg win $150
    250,         // avg loss $250 (bad R:R)
    1, 3,        // 1-3 trades/day
    1
  ));
  
  // Phase 2: Months 3-4 (Oct-Nov 2025) - Learning (45% WR, improving R:R)
  // 2-4 trades per day, getting closer to break-even
  const phase1Count = allTrades.length;
  allTrades.push(...generateTradesForPhase(
    9, 2025, 2,  // Oct-Nov 2025
    0.45,        // 45% win rate
    200,         // avg win $200
    220,         // avg loss $220 (better R:R)
    2, 4,        // 2-4 trades/day
    phase1Count + 1
  ));
  
  // Phase 3: Month 5 (Dec 2025) - Break-even (52% WR, good R:R)
  // 2-4 trades per day, finally consistent
  const phase2Count = allTrades.length;
  allTrades.push(...generateTradesForPhase(
    11, 2025, 1,  // Dec 2025
    0.52,         // 52% win rate
    250,          // avg win $250
    200,          // avg loss $200 (R:R > 1)
    2, 4,         // 2-4 trades/day
    phase2Count + 1
  ));
  
  // Phase 4: Months 6-7 (Jan-Feb 2026) - Profitable (60% WR, strong R:R)
  // 2-5 trades per day, making good money
  const phase3Count = allTrades.length;
  allTrades.push(...generateTradesForPhase(
    0, 2026, 2,  // Jan-Feb 2026
    0.60,        // 60% win rate
    300,         // avg win $300
    150,         // avg loss $150 (R:R = 2:1)
    2, 5,        // 2-5 trades/day
    phase3Count + 1
  ));
  
  return allTrades.sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
};

// Demo profile stats
export const getDemoStats = () => {
  const trades = generateDemoTrades();
  const totalPnL = trades.reduce((sum, t) => sum + t.profit_loss, 0);
  const wins = trades.filter(t => t.profit_loss > 0).length;
  const losses = trades.filter(t => t.profit_loss < 0).length;
  
  return {
    totalTrades: trades.length,
    winRate: (wins / trades.length * 100).toFixed(1),
    totalPnL: totalPnL.toFixed(2),
    avgWin: (trades.filter(t => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0) / wins).toFixed(2),
    avgLoss: Math.abs(trades.filter(t => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0) / losses).toFixed(2),
    bestTrade: Math.max(...trades.map(t => t.profit_loss)).toFixed(2),
    worstTrade: Math.min(...trades.map(t => t.profit_loss)).toFixed(2),
  };
};

// ============ DEMO CYCLE DATA ============

export interface DemoCycleSettings {
  avgCycleLength: number;
  periodLength: number;
  lastPeriodStart: string;
  periodDates: string[]; // Array of dates where period was logged
}

// Generate realistic cycle data for demo mode
export const generateDemoCycleData = (): DemoCycleSettings => {
  // 28-day cycle, 5-day period, last period started 12 days ago
  const today = new Date();
  const lastPeriodStart = new Date(today);
  lastPeriodStart.setDate(lastPeriodStart.getDate() - 12); // Day 13 of cycle (ovulation phase)
  
  // Generate period dates for last 3 cycles
  const periodDates: string[] = [];
  
  // Current cycle period (12 days ago)
  for (let i = 0; i < 5; i++) {
    const date = new Date(lastPeriodStart);
    date.setDate(date.getDate() + i);
    periodDates.push(date.toISOString().split('T')[0]);
  }
  
  // Previous cycle (-28 days from last period)
  const prevCycleStart = new Date(lastPeriodStart);
  prevCycleStart.setDate(prevCycleStart.getDate() - 28);
  for (let i = 0; i < 5; i++) {
    const date = new Date(prevCycleStart);
    date.setDate(date.getDate() + i);
    periodDates.push(date.toISOString().split('T')[0]);
  }
  
  // Cycle before that (-56 days)
  const prevPrevCycleStart = new Date(lastPeriodStart);
  prevPrevCycleStart.setDate(prevPrevCycleStart.getDate() - 56);
  for (let i = 0; i < 5; i++) {
    const date = new Date(prevPrevCycleStart);
    date.setDate(date.getDate() + i);
    periodDates.push(date.toISOString().split('T')[0]);
  }
  
  return {
    avgCycleLength: 28,
    periodLength: 5,
    lastPeriodStart: lastPeriodStart.toISOString().split('T')[0],
    periodDates: periodDates.sort(),
  };
};

// ============ DEMO HEALTH CHECK-IN DATA ============

export interface DemoHealthCheckIn {
  date: string;
  nutrition: 'poor' | 'fair' | 'good' | 'excellent';
  mood: number;
  concentration: number;
  sleep: number;
  stress: number;
  hasExercised: boolean;
  recommendations: string[];
  riskAdjustment: 'reduce' | 'maintain' | 'increase' | null;
  riskReduction: number;
}

// Generate realistic health check-in data for last 60 days
export const generateDemoHealthCheckIns = (): DemoHealthCheckIn[] => {
  const checkIns: DemoHealthCheckIn[] = [];
  const today = new Date();
  
  // Generate for last 60 days (realistic - not every day)
  for (let i = 0; i < 60; i++) {
    // Skip some days (80% completion rate)
    if (Math.random() > 0.8) continue;
    
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Realistic variation - better health in recent weeks (learning progress)
    const progressFactor = Math.max(0, 1 - (i / 60)); // 1.0 = today, 0.0 = 60 days ago
    
    // Generate values with realistic variation
    const nutrition = Math.random() < 0.1 + progressFactor * 0.2 ? 'excellent' : 
                      Math.random() < 0.5 + progressFactor * 0.2 ? 'good' : 
                      Math.random() < 0.7 ? 'fair' : 'poor';
    
    const mood = Math.floor(Math.random() * 3) + 6 + Math.floor(progressFactor * 2); // 6-10 range, better recently
    const concentration = Math.floor(Math.random() * 3) + 6 + Math.floor(progressFactor * 2);
    const sleep = Math.floor(Math.random() * 3) + 6 + Math.floor(progressFactor * 2);
    const stress = Math.floor(Math.random() * 4) + 2 - Math.floor(progressFactor * 2); // 2-5 range, lower recently
    const hasExercised = Math.random() < 0.3 + progressFactor * 0.3; // 30-60% exercise rate
    
    // Simple recommendation generation
    const recommendations: string[] = [];
    let riskReduction = 0;
    let riskAdjustment: 'reduce' | 'maintain' | 'increase' = 'maintain';
    
    if (concentration <= 6) {
      recommendations.push('📍 Moderate concentration - be extra strict with confirmations');
      riskReduction += 8;
    }
    if (sleep <= 6) {
      recommendations.push('⚠️ Below-average sleep - reduce risk, focus on quality');
      riskReduction += 10;
    }
    if (stress >= 7) {
      recommendations.push('⚠️ High stress - trade smaller, avoid revenge trading');
      riskReduction += 12;
    }
    if (hasExercised) {
      recommendations.push('💪 You exercised! Improved focus & control');
    }
    if (recommendations.length === 0) {
      recommendations.push('✅ You\'re in good shape for trading - proceed with discipline');
    }
    
    if (riskReduction > 0) riskAdjustment = 'reduce';
    
    checkIns.push({
      date: dateStr,
      nutrition,
      mood,
      concentration,
      sleep,
      stress,
      hasExercised,
      recommendations,
      riskAdjustment,
      riskReduction,
    });
  }
  
  return checkIns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
