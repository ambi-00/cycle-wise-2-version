// Demo account data - realistic trading journey from unprofitable to profitable
// This data is used when app_mode is set to 'DEMO'

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

// Month 1-2: Struggling phase (70% loss rate)
const generateEarlyLosses = (): DemoTrade[] => {
  const trades: DemoTrade[] = [];
  const startDate = new Date('2025-09-01');
  
  // September - lots of mistakes
  for (let i = 0; i < 25; i++) {
    const isWin = Math.random() < 0.30; // 30% win rate
    const entryDate = new Date(startDate);
    entryDate.setDate(entryDate.getDate() + Math.floor(i * 1.2));
    
    const exitDate = new Date(entryDate);
    exitDate.setHours(exitDate.getHours() + Math.floor(Math.random() * 12) + 2);
    
    const symbol = ['EURUSD', 'GBPUSD', 'USDJPY', 'GOLD', 'BTCUSD'][Math.floor(Math.random() * 5)];
    const direction = Math.random() < 0.5 ? 'LONG' : 'SHORT';
    
    let profitLoss: number;
    if (isWin) {
      profitLoss = Math.random() * 150 + 50; // Small wins $50-200
    } else {
      profitLoss = -(Math.random() * 300 + 100); // Big losses $100-400
    }
    
    trades.push({
      id: `demo-trade-${i + 1}`,
      entry_date: entryDate.toISOString(),
      exit_date: exitDate.toISOString(),
      symbol,
      direction,
      entry_price: 1.0800 + Math.random() * 0.02,
      exit_price: 1.0800 + Math.random() * 0.02,
      position_size: 0.5 + Math.random() * 1.5,
      profit_loss: profitLoss,
      profit_loss_percent: profitLoss / 5000 * 100,
      strategy: ['Breakout', 'Trend Follow', 'Range Trade', 'News Trade'][Math.floor(Math.random() * 4)],
      notes: isWin ? 'Lucky break' : 'Ignored stop loss / Overleveraged / FOMO entry',
      cycle_phase: ['menstrual', 'follicular', 'ovulatory', 'luteal'][Math.floor(Math.random() * 4)] as any,
    });
  }
  
  return trades;
};

// Month 3-4: Learning phase (50% win rate, break-even)
const generateLearningPhase = (): DemoTrade[] => {
  const trades: DemoTrade[] = [];
  const startDate = new Date('2025-11-01');
  
  for (let i = 0; i < 30; i++) {
    const isWin = Math.random() < 0.50; // 50% win rate
    const entryDate = new Date(startDate);
    entryDate.setDate(entryDate.getDate() + Math.floor(i * 2));
    
    const exitDate = new Date(entryDate);
    exitDate.setHours(exitDate.getHours() + Math.floor(Math.random() * 8) + 1);
    
    const symbol = ['EURUSD', 'GBPUSD', 'GOLD'][Math.floor(Math.random() * 3)];
    const direction = Math.random() < 0.5 ? 'LONG' : 'SHORT';
    
    let profitLoss: number;
    if (isWin) {
      profitLoss = Math.random() * 200 + 100; // Better wins $100-300
    } else {
      profitLoss = -(Math.random() * 200 + 100); // Controlled losses $100-300
    }
    
    trades.push({
      id: `demo-trade-${26 + i}`,
      entry_date: entryDate.toISOString(),
      exit_date: exitDate.toISOString(),
      symbol,
      direction,
      entry_price: 1.0800 + Math.random() * 0.02,
      exit_price: 1.0800 + Math.random() * 0.02,
      position_size: 0.5 + Math.random() * 1.0,
      profit_loss: profitLoss,
      profit_loss_percent: profitLoss / 5000 * 100,
      strategy: ['Support/Resistance', 'Trend Follow', 'Mean Reversion'][Math.floor(Math.random() * 3)],
      notes: isWin ? 'Followed plan' : 'Respected stop loss',
      cycle_phase: ['follicular', 'ovulatory'][Math.floor(Math.random() * 2)] as any,
    });
  }
  
  return trades;
};

// Month 5-6: Profitable phase (65% win rate)
const generateProfitablePhase = (): DemoTrade[] => {
  const trades: DemoTrade[] = [];
  const startDate = new Date('2026-01-01');
  
  for (let i = 0; i < 35; i++) {
    const isWin = Math.random() < 0.65; // 65% win rate
    const entryDate = new Date(startDate);
    entryDate.setDate(entryDate.getDate() + Math.floor(i * 1.7));
    
    const exitDate = new Date(entryDate);
    exitDate.setHours(exitDate.getHours() + Math.floor(Math.random() * 6) + 1);
    
    const symbol = ['EURUSD', 'GOLD'][Math.floor(Math.random() * 2)]; // Focus on 2 pairs
    const direction = Math.random() < 0.5 ? 'LONG' : 'SHORT';
    
    let profitLoss: number;
    if (isWin) {
      profitLoss = Math.random() * 300 + 150; // Solid wins $150-450
    } else {
      profitLoss = -(Math.random() * 150 + 50); // Small losses $50-200
    }
    
    trades.push({
      id: `demo-trade-${56 + i}`,
      entry_date: entryDate.toISOString(),
      exit_date: exitDate.toISOString(),
      symbol,
      direction,
      entry_price: 1.0800 + Math.random() * 0.02,
      exit_price: 1.0800 + Math.random() * 0.02,
      position_size: 0.5 + Math.random() * 0.8,
      profit_loss: profitLoss,
      profit_loss_percent: profitLoss / 5000 * 100,
      strategy: ['Trend Follow', 'Support/Resistance'][Math.floor(Math.random() * 2)],
      notes: isWin ? 'Perfect execution' : 'Quick exit, saved capital',
      cycle_phase: ['follicular', 'ovulatory'][Math.floor(Math.random() * 2)] as any,
    });
  }
  
  return trades;
};

// Generate all demo trades
export const generateDemoTrades = (): DemoTrade[] => {
  return [
    ...generateEarlyLosses(),      // Sep-Oct: -$3,500
    ...generateLearningPhase(),    // Nov-Dec: ~$0 (break-even)
    ...generateProfitablePhase(),  // Jan-Feb: +$5,200
  ].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
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
