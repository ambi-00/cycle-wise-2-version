/**
 * Dashboard Widget System
 * Manages widget configuration, sizes, and metadata
 */

export type WidgetSize = 'small' | 'medium' | 'large';
export type WidgetId = 
  | 'cycle-phase' 
  | 'performance-cards'
  | 'ai-insight'
  | 'recent-trades'
  | 'strategy-performance'
  | 'hot-instruments'
  | 'xp-bar'
  | 'streak-display'
  | 'journal-entry'
  | 'prop-firm-summary'
  | 'leaderboard-preview'
  | 'equity-curve'
  | 'discipline-meter'
  | 'daily-goal'
  | 'win-rate-meter'
  | 'best-worst-trades'
  | 'cycle-phase-performance'
  | 'monthly-stats'
  | 'trade-frequency'
  | 'risk-assessment'
  | 'pnl-meter'
  | 'trade-ratio'
  | 'streak-meter'
  | 'profit-factor'
  | 'drawdown-meter'
  | 'strategy-comparison'
  | 'best-worst-days'
  | 'instrument-heatmap'
  | 'monthly-checkin-insights'
  | 'monthly-checkin-goals'
  | 'weekly-summary'
  | 'trading-performance-comparison';

export interface DashboardWidget {
  id: WidgetId;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  size: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  category: 'performance' | 'cycle' | 'social' | 'planning' | 'system';
  isPremium?: boolean;
  order: number;
}

export interface DashboardConfig {
  widgets: DashboardWidget[];
  lastUpdated: string;
}

// Grid column mapping for 3-column desktop grid (original layout)
// Mobile: full width (col-span-1 = 100% in 1-col grid)
// Tablet: 2-column grid
// Desktop: 3-column grid with left column 2-wide, right column 1-wide
export const getColSpan = (size: WidgetSize): string => {
  switch (size) {
    case 'small': return 'col-span-1 sm:col-span-1 lg:col-span-1';
    case 'medium': return 'col-span-1 sm:col-span-1 lg:col-span-1';
    case 'large': return 'col-span-1 sm:col-span-1 lg:col-span-2';
  }
};

// Alias for backward compatibility
export const getColSpanMobile = (): string => 'col-span-1';

export const WIDGET_REGISTRY: Record<WidgetId, Omit<DashboardWidget, 'order'>> = {
  'cycle-phase': {
    id: 'cycle-phase',
    title: 'Cycle Phase',
    description: 'Your current cycle phase and recommendations',
    icon: '🔄',
    enabled: true,
    size: 'large',
    minSize: 'large',
    maxSize: 'large',
    category: 'cycle',
  },
  'performance-cards': {
    id: 'performance-cards',
    title: 'Performance Overview',
    description: 'P&L, Win Rate, Avg R, Trade Count',
    icon: '📊',
    enabled: true,
    size: 'large',
    minSize: 'large',
    maxSize: 'large',
    category: 'performance',
  },
  'ai-insight': {
    id: 'ai-insight',
    title: 'AI Insights',
    description: 'AI-generated trading recommendations',
    icon: '🤖',
    enabled: true,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'recent-trades': {
    id: 'recent-trades',
    title: 'Recent Trades',
    description: 'Your latest trading activity',
    icon: '📝',
    enabled: true,
    size: 'large',
    minSize: 'large',
    maxSize: 'large',
    category: 'performance',
  },
  'strategy-performance': {
    id: 'strategy-performance',
    title: 'Strategy Performance',
    description: 'Detailed breakdown by strategy',
    icon: '🎯',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'hot-instruments': {
    id: 'hot-instruments',
    title: 'Hot Instruments',
    description: 'Most traded instruments with win rates',
    icon: '🔥',
    enabled: false,
    size: 'small',
    minSize: 'small',
    maxSize: 'small',
    category: 'performance',
  },
  'xp-bar': {
    id: 'xp-bar',
    title: 'XP Progress',
    description: 'Your trading experience progression',
    icon: '⭐',
    enabled: true,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'system',
  },
  'streak-display': {
    id: 'streak-display',
    title: 'Streaks',
    description: 'Login and trading streaks',
    icon: '🔥',
    enabled: true,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'system',
  },
  'journal-entry': {
    id: 'journal-entry',
    title: 'Journal Entry',
    description: 'Quick access to daily journaling',
    icon: '📔',
    enabled: true,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'planning',
  },
  'prop-firm-summary': {
    id: 'prop-firm-summary',
    title: 'Prop Firm Accounts',
    description: 'Your connected trading accounts',
    icon: '💼',
    enabled: true,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'leaderboard-preview': {
    id: 'leaderboard-preview',
    title: 'Leaderboard',
    description: 'Competition standings and badges',
    icon: '🏆',
    enabled: true,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'social',
  },
  'equity-curve': {
    id: 'equity-curve',
    title: 'Equity Curve',
    description: 'Your P&L over time',
    icon: '📈',
    enabled: false,
    size: 'large',
    minSize: 'large',
    maxSize: 'large',
    category: 'performance',
    isPremium: true,
  },
  'discipline-meter': {
    id: 'discipline-meter',
    title: 'Discipline Meter',
    description: 'Track your trading discipline score',
    icon: '💪',
    enabled: false,
    size: 'small',
    minSize: 'small',
    maxSize: 'small',
    category: 'system',
  },
  'daily-goal': {
    id: 'daily-goal',
    title: 'Daily Goal',
    description: 'Today\'s trading objectives',
    icon: '🎯',
    enabled: false,
    size: 'small',
    minSize: 'small',
    maxSize: 'small',
    category: 'planning',
  },
  'win-rate-meter': {
    id: 'win-rate-meter',
    title: 'Win Rate Meter',
    description: 'Visual win rate with color coding',
    icon: '📊',
    enabled: false,
    size: 'small',
    minSize: 'small',
    maxSize: 'small',
    category: 'performance',
  },
  'best-worst-trades': {
    id: 'best-worst-trades',
    title: 'Best & Worst Trades',
    description: 'Your top winning and losing trades',
    icon: '🏆',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'cycle-phase-performance': {
    id: 'cycle-phase-performance',
    title: 'Cycle Phase Performance',
    description: 'How you trade in each cycle phase',
    icon: '🔄',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'cycle',
  },
  'monthly-stats': {
    id: 'monthly-stats',
    title: 'Monthly Stats',
    description: 'Month-by-month trading statistics',
    icon: '📅',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'trade-frequency': {
    id: 'trade-frequency',
    title: 'Trade Frequency',
    description: 'Trading activity by day of week',
    icon: '📊',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'risk-assessment': {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    description: 'Your current risk level and metrics',
    icon: '⚠️',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'pnl-meter': {
    id: 'pnl-meter',
    title: 'P&L Meter',
    description: 'Detailed profit & loss across timeframes',
    icon: '💰',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'trade-ratio': {
    id: 'trade-ratio',
    title: 'Trade Ratio',
    description: 'Win/Loss/Breakeven distribution',
    icon: '📊',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'streak-meter': {
    id: 'streak-meter',
    title: 'Streak Meter',
    description: 'Current and longest win/loss streaks',
    icon: '🔥',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'profit-factor': {
    id: 'profit-factor',
    title: 'Profit Factor',
    description: 'Gross profit divided by gross loss ratio',
    icon: '⭐',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'drawdown-meter': {
    id: 'drawdown-meter',
    title: 'Drawdown Meter',
    description: 'Maximum drawdown percentage from peak',
    icon: '📉',
    enabled: false,
    size: 'small',
    minSize: 'small',
    maxSize: 'small',
    category: 'performance',
  },
  'strategy-comparison': {
    id: 'strategy-comparison',
    title: 'Strategy Comparison',
    description: 'Compare performance across strategies',
    icon: '⚔️',
    enabled: false,
    size: 'medium',
    minSize: 'medium',
    maxSize: 'medium',
    category: 'performance',
  },
  'best-worst-days': {
    id: 'best-worst-days',
    title: 'Best & Worst Days',
    description: 'Top performing and worst trading days',
    icon: '📅',
    enabled: false,
    size: 'small',
    minSize: 'small',
    maxSize: 'large',
    category: 'performance',
  },
  'instrument-heatmap': {
    id: 'instrument-heatmap',
    title: 'Instrument Heatmap',
    description: 'Performance by instrument with heat coloring',
    icon: '🔥',
    enabled: false,
    size: 'medium',
    minSize: 'small',
    maxSize: 'large',
    category: 'performance',
  },
  'monthly-checkin-insights': {
    id: 'monthly-checkin-insights',
    title: 'Monthly Insights',
    description: 'AI insights from your monthly check-in',
    icon: '💡',
    enabled: false,
    size: 'medium',
    minSize: 'small',
    maxSize: 'large',
    category: 'planning',
  },
  'monthly-checkin-goals': {
    id: 'monthly-checkin-goals',
    title: 'Monthly Goals',
    description: 'Your goals from the monthly check-in',
    icon: '🎯',
    enabled: false,
    size: 'medium',
    minSize: 'small',
    maxSize: 'large',
    category: 'planning',
  },
  'weekly-summary': {
    id: 'weekly-summary',
    title: 'Weekly Summary',
    description: 'Overview of your trading this week',
    icon: '📅',
    enabled: false,
    size: 'large',
    minSize: 'medium',
    maxSize: 'large',
    category: 'performance',
  },
  'trading-performance-comparison': {
    id: 'trading-performance-comparison',
    title: 'Performance Comparison',
    description: 'Compare performance across week, month, and all-time',
    icon: '📊',
    enabled: false,
    size: 'large',
    minSize: 'large',
    maxSize: 'large',
    category: 'performance',
  },
};

// Default dashboard configuration (on first load)
// Recreates ORIGINAL dashboard layout before widget system:
// Top: xp-bar, streak-display
// Left (2 cols): cycle-phase → performance-cards → ai-insight → recent-trades
// Right (1 col): journal-entry → prop-firm-summary → leaderboard-preview
export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  widgets: [
    // ENABLED (visible on first load) - original layout order
    { ...WIDGET_REGISTRY['xp-bar'], enabled: true, order: 1 },
    { ...WIDGET_REGISTRY['streak-display'], enabled: true, order: 2 },
    { ...WIDGET_REGISTRY['cycle-phase'], enabled: true, order: 3 },
    { ...WIDGET_REGISTRY['performance-cards'], enabled: true, order: 4 },
    { ...WIDGET_REGISTRY['ai-insight'], enabled: true, order: 5 },
    { ...WIDGET_REGISTRY['recent-trades'], enabled: true, order: 6 },
    { ...WIDGET_REGISTRY['journal-entry'], enabled: true, order: 7 },
    { ...WIDGET_REGISTRY['prop-firm-summary'], enabled: true, order: 8 },
    { ...WIDGET_REGISTRY['leaderboard-preview'], enabled: true, order: 9 },
    
    // DISABLED - NEW TRADER ANALYTICS WIDGETS (8 pieces)
    { ...WIDGET_REGISTRY['pnl-meter'], enabled: false, order: 10 },
    { ...WIDGET_REGISTRY['trade-ratio'], enabled: false, order: 11 },
    { ...WIDGET_REGISTRY['streak-meter'], enabled: false, order: 12 },
    { ...WIDGET_REGISTRY['profit-factor'], enabled: false, order: 13 },
    { ...WIDGET_REGISTRY['drawdown-meter'], enabled: false, order: 14 },
    { ...WIDGET_REGISTRY['strategy-comparison'], enabled: false, order: 15 },
    { ...WIDGET_REGISTRY['best-worst-days'], enabled: false, order: 16 },
    { ...WIDGET_REGISTRY['instrument-heatmap'], enabled: false, order: 17 },
    
    // DISABLED - OTHER OPTIONAL WIDGETS
    { ...WIDGET_REGISTRY['strategy-performance'], enabled: false, order: 18 },
    { ...WIDGET_REGISTRY['hot-instruments'], enabled: false, order: 19 },
    { ...WIDGET_REGISTRY['equity-curve'], enabled: false, order: 20 },
    { ...WIDGET_REGISTRY['discipline-meter'], enabled: false, order: 21 },
    { ...WIDGET_REGISTRY['daily-goal'], enabled: false, order: 22 },
    { ...WIDGET_REGISTRY['win-rate-meter'], enabled: false, order: 23 },
    { ...WIDGET_REGISTRY['best-worst-trades'], enabled: false, order: 24 },
    { ...WIDGET_REGISTRY['cycle-phase-performance'], enabled: false, order: 25 },
    { ...WIDGET_REGISTRY['monthly-stats'], enabled: false, order: 26 },
    { ...WIDGET_REGISTRY['trade-frequency'], enabled: false, order: 27 },
    { ...WIDGET_REGISTRY['risk-assessment'], enabled: false, order: 28 },
    { ...WIDGET_REGISTRY['monthly-checkin-insights'], enabled: false, order: 29 },
    { ...WIDGET_REGISTRY['monthly-checkin-goals'], enabled: false, order: 30 },
    { ...WIDGET_REGISTRY['weekly-summary'], enabled: false, order: 31 },
    { ...WIDGET_REGISTRY['trading-performance-comparison'], enabled: false, order: 32 },
  ],
  lastUpdated: new Date().toISOString(),
};

const CONFIG_KEY = 'cw_dashboard_config';
const CONFIG_VERSION = 3; // Increment when DEFAULT_DASHBOARD_CONFIG changes - v3: Fixed widget sizes
const CONFIG_VERSION_KEY = 'cw_dashboard_config_version';

/**
 * Load dashboard config from localStorage
 * Returns default config if not found or version mismatch
 * Merges new widgets from registry with existing config
 */
export const loadDashboardConfig = (): DashboardConfig => {
  try {
    const storedVersion = localStorage.getItem(CONFIG_VERSION_KEY);
    const stored = localStorage.getItem(CONFIG_KEY);
    
    // If version mismatch or no version, reset to default (migration)
    if (!stored || Number(storedVersion) !== CONFIG_VERSION) {
      const defaultConfig = JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_CONFIG));
      localStorage.setItem(CONFIG_VERSION_KEY, String(CONFIG_VERSION));
      localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultConfig));
      return defaultConfig;
    }
    
    if (stored) {
      const config: DashboardConfig = JSON.parse(stored);
      
      // Merge new widgets from WIDGET_REGISTRY that aren't in the stored config
      const existingIds = new Set(config.widgets.map(w => w.id));
      const allWidgetIds = Object.keys(WIDGET_REGISTRY) as Array<keyof typeof WIDGET_REGISTRY>;
      
      let maxOrder = Math.max(...config.widgets.map(w => w.order), 0);
      
      allWidgetIds.forEach(id => {
        if (!existingIds.has(id)) {
          const registryWidget = WIDGET_REGISTRY[id];
          config.widgets.push({
            ...registryWidget,
            order: ++maxOrder,
          });
        }
      });
      
      return config;
    }
  } catch (e) {
    console.error('Failed to load dashboard config:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_CONFIG));
};

/**
 * Save dashboard config to localStorage
 */
export const saveDashboardConfig = (config: DashboardConfig): void => {
  try {
    config.lastUpdated = new Date().toISOString();
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(CONFIG_VERSION_KEY, String(CONFIG_VERSION));
  } catch (e) {
    console.error('Failed to save dashboard config:', e);
  }
};

/**
 * Reset dashboard to default config
 */
export const resetDashboardConfig = (): void => {
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch (e) {
    console.error('Failed to reset dashboard config:', e);
  }
};

/**
 * Get enabled widgets sorted by order
 */
export const getEnabledWidgets = (config: DashboardConfig): DashboardWidget[] => {
  return config.widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get available widgets for the customizer
 */
export const getAvailableWidgets = (config: DashboardConfig): DashboardWidget[] => {
  return config.widgets.sort((a, b) => a.order - b.order);
};

/**
 * Update widget in config
 */
export const updateWidget = (
  config: DashboardConfig,
  id: WidgetId,
  updates: Partial<DashboardWidget>
): DashboardConfig => {
  return {
    ...config,
    widgets: config.widgets.map(w =>
      w.id === id ? { ...w, ...updates } : w
    ),
  };
};

/**
 * Reorder widgets
 */
export const reorderWidgets = (
  config: DashboardConfig,
  newOrder: WidgetId[]
): DashboardConfig => {
  const widgetMap = new Map(config.widgets.map(w => [w.id, w]));
  return {
    ...config,
    widgets: newOrder
      .map((id, index) => {
        const widget = widgetMap.get(id);
        return widget ? { ...widget, order: index + 1 } : null;
      })
      .filter((w): w is DashboardWidget => w !== null),
  };
};
