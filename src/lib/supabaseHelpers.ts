/**
 * Supabase Database Helper Functions
 * Wrappers for all database operations
 * With Offline-First support
 */

import { supabase } from '@/integrations/supabase/client';
import { syncSave, syncLoad } from '@/lib/syncManager';
import { getWinLossStreak as calculateWinLossStreak, loadTradesFromLocalStorage } from '@/lib/tradeLoaders';

// ============================================
// TRADES
// ============================================

export interface TradeInsert {
  date: string;
  time?: string | null;
  instrument: string;
  direction: 'long' | 'short';
  entry_price?: number | null;
  sl_price?: number | null;
  tp_price?: number | null;
  exit_price?: number | null;
  strategy?: string | null;
  checklist?: any[] | null;
  risk_percent?: number | null;
  planned_rrr?: number | null;
  planned_sl_size?: number | null;
  sl_size_unit?: string | null;
  closed_rrr?: number | null;
  max_r_reached?: number | null;
  ideal_sl_size?: number | null;
  pnl?: number | null;
  r_multiple?: number | null;
  result?: 'win' | 'loss' | 'breakeven' | '' | null;
  status?: 'open' | 'closed';
  exit_reason?: string | null;
  loss_reason?: string | null;
  custom_exit_reason?: string | null;
  pre_trade_note?: string | null;
  post_trade_note?: string | null;
  learnings?: string | null;
  emotion_before?: number | null;
  emotion_after?: number | null;
  rating?: number | null;
  timeframe_small?: string | null;
  timeframe_large?: string | null;
  image_before_small_tf?: string | null;
  image_before_large_tf?: string | null;
  image_after_small_tf?: string | null;
  image_after_large_tf?: string | null;
  cycle_day?: number | null;
  cycle_phase?: string | null;
  
  // EXECUTION QUALITY TRACKING (NEW)
  followed_entry_criteria?: boolean | null;
  followed_exit_criteria?: boolean | null;
  risk_appropriate?: boolean | null;
  emotionally_neutral?: boolean | null;
  execution_score?: number | null;
  execution_notes?: string | null;
  exit_criteria_used?: string | null;
  trade_reflection?: {
    mistakeCategory?: string;
    whatWentWrong?: string;
    whatToDifferently?: string;
    keyLesson?: string;
    screenshot?: string | null;
  } | null;
}

/**
 * Save a new trade (with Offline-First support)
 * Works in all modes: USER (Supabase), DEMO (localStorage), FILMING (localStorage)
 */
export async function saveTrade(trade: TradeInsert) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const tradeData = {
    user_id: user?.id || 'local-user',
    id: crypto.randomUUID(), // Generate ID upfront for offline support
    ...trade,
    created_at: new Date().toISOString(),
  };

  // Save with offline-first strategy (only if user is authenticated)
  if (navigator.onLine && user) {
    try {
      // Strip fields not in Supabase schema
      const { trade_reflection: _refl, ...supabaseTradeData } = tradeData;
      const { data, error } = await supabase
        .from('trades')
        .insert(supabaseTradeData)
        .select()
        .single();

      if (error) throw error;
      
      // Calculate and award XP for this trade
      try {
        const { xp, reasons } = calculateTradeXP(data);
        if (xp !== 0) {
          const result = await awardXP(user.id, xp, 'trade_compliant', {
            trade_id: data.id,
            reasons,
          });

          // Trigger XP notification
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('xp-earned', {
              detail: { amount: xp, reason: 'trade', reasons: result.reasons || reasons }
            });
            window.dispatchEvent(event);
          }
        }

        // Check for revenge trading penalty
        if (data.time) {
          await checkRevengeTradingPenalty(user.id, data.date, data.time);
        }
      } catch (xpError) {
        console.error('Failed to calculate XP, but trade saved:', xpError);
      }
      
      // Also cache in localStorage
      const localKey = `cw_journal_${trade.date}`;
      try {
        const rawData = localStorage.getItem(localKey);
        const existing = rawData ? JSON.parse(rawData) : { trades: [] };
        if (!existing.trades || !Array.isArray(existing.trades)) {
          existing.trades = [];
        }
        // Add computed fields for localStorage compatibility
        const cachedData = { 
          ...data, 
          symbol: data.instrument, // Add symbol alias for backward compat
          r_multiple: data.closed_rrr || data.planned_rrr || 0 // Map closed_rrr to r_multiple for display
        };
        existing.trades.push(cachedData);
        localStorage.setItem(localKey, JSON.stringify(existing));
      } catch (e) {
        console.error('Failed to cache trade in localStorage:', e);
        // Create fresh structure
        localStorage.setItem(localKey, JSON.stringify({ trades: [data] }));
      }
      
      // Update sync status - successful save
      const syncStatus = localStorage.getItem('cw_sync_status');
      if (syncStatus) {
        const status = JSON.parse(syncStatus);
        status.lastSyncTime = new Date().toISOString();
        status.errors = [];
        localStorage.setItem('cw_sync_status', JSON.stringify(status));
        window.dispatchEvent(new CustomEvent('syncStatusChanged', { detail: status }));
      }
      
      return data;
    } catch (error) {
      console.error('Failed to save to Supabase, saving locally:', error);
      // Fall through to offline save
    }
  }

  // Offline or no auth: Save to localStorage only
  const localKey = `cw_journal_${trade.date}`;
  try {
    const rawData = localStorage.getItem(localKey);
    const existing = rawData ? JSON.parse(rawData) : { trades: [] };
    if (!existing.trades || !Array.isArray(existing.trades)) {
      existing.trades = [];
    }
    // Add computed fields for localStorage compatibility
    const dataWithSymbol = { 
      ...tradeData, 
      symbol: tradeData.instrument, // Add symbol alias for backward compat
      r_multiple: tradeData.closed_rrr || tradeData.planned_rrr || 0 // Map closed_rrr to r_multiple for display
    };
    existing.trades.push(dataWithSymbol);
    localStorage.setItem(localKey, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save trade to localStorage:', e);
    // Create fresh structure
    localStorage.setItem(localKey, JSON.stringify({ trades: [tradeData] }));
  }

  // Add to sync queue only if user is authenticated (XP will be calculated when synced)
  if (user) {
    await syncSave({
      type: 'trade',
      data: tradeData,
      localStorageKey: localKey,
      supabaseTable: 'trades',
      operation: 'insert',
      getId: (d) => d.id,
    });
  } else {
    // In DEMO/FILMING mode: clear sync status errors and update as "synced"
    const syncStatus = localStorage.getItem('cw_sync_status');
    if (syncStatus) {
      const status = JSON.parse(syncStatus);
      status.lastSyncTime = new Date().toISOString();
      status.errors = [];
      status.pendingCount = 0;
      localStorage.setItem('cw_sync_status', JSON.stringify(status));
      window.dispatchEvent(new CustomEvent('syncStatusChanged', { detail: status }));
    }
  }

  console.log('✅ Trade saved to localStorage:', tradeData.id, 'for date:', trade.date);
  
  // Trigger custom event to notify Dashboard and other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trades-updated', { detail: { tradeId: tradeData.id } }));
  }
  
  return tradeData;
}

/**
 * Update einen existierenden Trade (mit Offline-First Support)
 */
export async function updateTrade(id: string, updates: Partial<TradeInsert>) {
  // Try online update first
  if (navigator.onLine) {
    try {
      const { trade_reflection: _refl, ...supabaseUpdates } = updates as any;
      const { data, error } = await supabase
        .from('trades')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update localStorage cache
      updateLocalStorageTrade(id, data);
      
      // Trigger custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trades-updated', { detail: { tradeId: id } }));
      }
      
      return data;
    } catch (error) {
      console.error('Failed to update in Supabase, updating locally:', error);
      // Fall through to offline update
    }
  }

  // Offline: Update localStorage and add to sync queue
  const updated = updateLocalStorageTrade(id, updates);
  
  if (updated) {
    await syncSave({
      type: 'trade',
      data: { id, ...updates },
      localStorageKey: `cw_trade_${id}`,
      supabaseTable: 'trades',
      operation: 'update',
      getId: () => id,
    });
    
    // Trigger custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trades-updated', { detail: { tradeId: id } }));
    }
  }

  return updated;
}

/**
 * Helper: Update trade in localStorage
 */
function updateLocalStorageTrade(id: string, updates: any): any | null {
  // Search all journal entries for this trade
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cw_journal_')) {
      const journal = JSON.parse(localStorage.getItem(key) || '{"trades":[]}');
      const tradeIndex = journal.trades?.findIndex((t: any) => t.id === id);
      
      if (tradeIndex !== undefined && tradeIndex >= 0) {
        journal.trades[tradeIndex] = { ...journal.trades[tradeIndex], ...updates };
        localStorage.setItem(key, JSON.stringify(journal));
        return journal.trades[tradeIndex];
      }
    }
  }
  return null;
}

/**
 * Load all trades for the user (with Offline-First fallback and DEMO mode support)
 */
export async function loadAllTrades() {
  // Check if we're in DEMO mode first
  const appMode = localStorage.getItem('cw_app_mode');
  if (appMode === 'DEMO') {
    console.log('📊 loadAllTrades: DEMO mode detected, using demo data');
    return loadTradesFromLocalStorage();
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  // Try loading from Supabase first
  if (navigator.onLine && user) {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data) {
        // Map Supabase fields to UI-friendly names
        const mappedData = data.map(trade => ({
          ...trade,
          symbol: trade.instrument, // Add symbol alias
          r_multiple: trade.closed_rrr || trade.planned_rrr || 0, // Map closed_rrr to r_multiple
          cyclePhase: trade.cycle_phase || trade.cyclePhase || trade.phase, // Map cycle_phase to cyclePhase
          rMultiple: trade.closed_rrr || trade.planned_rrr || 0 // Also add rMultiple for compatibility
        }));
        
        // Update localStorage cache
        cacheTradesToLocalStorage(data);
        return mappedData;
      }
    } catch (error) {
      console.error('Failed to load from Supabase, using localStorage:', error);
    }
  }

  // Fallback: Load from localStorage (includes DEMO mode via loadTradesFromLocalStorage)
  return loadTradesFromLocalStorage();
}

/**
 * Helper: Cache trades to localStorage
 */
function cacheTradesToLocalStorage(trades: any[]) {
  const byDate: Record<string, any[]> = {};
  
  trades.forEach(trade => {
    if (!byDate[trade.date]) {
      byDate[trade.date] = [];
    }
    // Add computed fields for localStorage compatibility
    const enrichedTrade = {
      ...trade,
      symbol: trade.instrument, // Add symbol alias for backward compat
      r_multiple: trade.closed_rrr || trade.planned_rrr || 0, // Map closed_rrr to r_multiple for display
      cyclePhase: trade.cycle_phase || trade.cyclePhase || trade.phase // Map cycle_phase to cyclePhase for UI
    };
    byDate[trade.date].push(enrichedTrade);
  });

  Object.entries(byDate).forEach(([date, dateTrades]) => {
    const key = `cw_journal_${date}`;
    localStorage.setItem(key, JSON.stringify({ trades: dateTrades }));
  });
}

/**
 * Helper: Load all trades from localStorage
 */
function loadTradesFromLocalStorage(): any[] {
  const allTrades: any[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cw_journal_')) {
      try {
        const journal = JSON.parse(localStorage.getItem(key) || '{"trades":[]}');
        if (journal.trades) {
          allTrades.push(...journal.trades);
        }
      } catch (err) {
        console.error('Failed to parse localStorage trade:', err);
      }
    }
  }

  return allTrades.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

/**
 * Load trades for a specific month
 */
export async function loadTradesForMonth(year: number, month: number) {
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a trade
 */
export async function deleteTrade(id: string) {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// STRATEGIES
// ============================================

export interface StrategyInsert {
  name: string;
  description?: string;
  markets?: string[];
  timeframes?: string[];
  confirmations?: string[];
  entry_triggers?: string[];
  exit_rules?: string[];
  general_rules?: string[];
  risk_per_trade?: number;
  target_rrr?: number;
  stop_loss_type?: string;
  take_profit_type?: string;
}

/**
 * Save a new strategy (with Offline-First support)
 */
export async function saveStrategy(strategy: StrategyInsert) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const strategyData = {
    user_id: user.id,
    id: crypto.randomUUID(),
    ...strategy,
    created_at: new Date().toISOString(),
  };

  // Try online save first
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('strategies')
        .insert(strategyData)
        .select()
        .single();

      if (!error && data) {
        // Update localStorage cache
        const cached = JSON.parse(localStorage.getItem('cw_strategies') || '[]');
        cached.push(data);
        localStorage.setItem('cw_strategies', JSON.stringify(cached));
        return data;
      }
    } catch (error) {
      console.error('Failed to save strategy to Supabase:', error);
    }
  }

  // Offline: Save to localStorage and sync queue
  const cached = JSON.parse(localStorage.getItem('cw_strategies') || '[]');
  cached.push(strategyData);
  localStorage.setItem('cw_strategies', JSON.stringify(cached));

  await syncSave({
    type: 'strategy',
    data: strategyData,
    localStorageKey: 'cw_strategies',
    supabaseTable: 'strategies',
    operation: 'insert',
    getId: (d) => d.id,
  });

  return strategyData;
}

/**
 * Update eine Strategie
 */
export async function updateStrategy(id: string, updates: Partial<StrategyInsert>) {
  const { data, error } = await supabase
    .from('strategies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Load all strategies (with Offline-First fallback)
 */
export async function loadAllStrategies() {
  // Try Supabase first if online
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Update localStorage cache
        localStorage.setItem('cw_strategies', JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Failed to load strategies from Supabase:', error);
    }
  }

  // Fallback: Load from localStorage
  const cached = localStorage.getItem('cw_strategies');
  return cached ? JSON.parse(cached) : [];
}

/**
 * Delete a strategy
 */
export async function deleteStrategy(id: string) {
  const { error } = await supabase
    .from('strategies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// CYCLE LOGS
// ============================================

export interface CycleLogInsert {
  date: string;
  has_period?: boolean;
  mood?: number;
  confidence?: number;
  energy?: number;
  notes?: string;
  safety_mode_enabled?: boolean;
  avg_cycle_length?: number;
  period_length?: number;
  last_period_start?: string;
}

/**
 * Speichere oder update einen Cycle Log (mit Offline-First Support)
 */
export async function saveCycleLog(log: CycleLogInsert) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const cycleData = {
    user_id: user.id,
    ...log,
  };

  // Try online save first
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('cycle_logs')
        .upsert(cycleData)
        .select()
        .single();

      if (!error && data) {
        // Cache to localStorage
        const localKey = `cw_journal_${log.date}`;
        const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
        existing.cycle = data;
        localStorage.setItem(localKey, JSON.stringify(existing));
        return data;
      }
    } catch (error) {
      console.error('Failed to save cycle log to Supabase:', error);
    }
  }

  // Offline: Save to localStorage and sync queue
  const localKey = `cw_journal_${log.date}`;
  const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
  existing.cycle = cycleData;
  localStorage.setItem(localKey, JSON.stringify(existing));

  await syncSave({
    type: 'cycle_log',
    data: cycleData,
    localStorageKey: localKey,
    supabaseTable: 'cycle_logs',
    operation: 'insert',
    getId: (d) => `${d.user_id}_${d.date}`,
  });

  return cycleData;
}

/**
 * Load Cycle Logs for a time period (with Offline-First fallback)
 */
export async function loadCycleLogs(startDate: string, endDate: string) {
  // Try Supabase first if online
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('cycle_logs')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (!error && data) {
        // Cache to localStorage
        data.forEach(log => {
          const localKey = `cw_journal_${log.date}`;
          const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
          existing.cycle = log;
          localStorage.setItem(localKey, JSON.stringify(existing));
        });
        return data;
      }
    } catch (error) {
      console.error('Failed to load cycle logs from Supabase:', error);
    }
  }

  // Fallback: Load from localStorage
  const logs: any[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cw_journal_')) {
      const dateStr = key.replace('cw_journal_', '');
      if (dateStr >= startDate && dateStr <= endDate) {
        try {
          const journal = JSON.parse(localStorage.getItem(key) || '{}');
          if (journal.cycle) {
            logs.push(journal.cycle);
          }
        } catch (err) {
          console.error('Failed to parse cycle log:', err);
        }
      }
    }
  }
  
  return logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

/**
 * Load all period logs (for Cycle Calculation)
 */
export async function loadAllPeriodDates() {
  const { data, error } = await supabase
    .from('cycle_logs')
    .select('date')
    .eq('has_period', true)
    .order('date', { ascending: false });

  if (error) throw error;
  return data?.map(d => d.date) || [];
}

// ============================================
// PROP FIRM ACCOUNTS
// ============================================

export interface PropFirmAccountInsert {
  firm_name: string;
  account_number: string;
  investor_password_encrypted?: string;
  server?: string;
  balance?: number;
  equity?: number;
  profit?: number;
  auto_sync?: boolean;
}

/**
 * Speichere ein PropFirm-Account
 */
export async function savePropFirmAccount(account: PropFirmAccountInsert) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('prop_firm_accounts')
    .insert({
      user_id: user.id,
      ...account,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Load all PropFirm accounts
 */
export async function loadPropFirmAccounts() {
  const { data, error } = await supabase
    .from('prop_firm_accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a PropFirm account
 */
export async function deletePropFirmAccount(id: string) {
  const { error } = await supabase
    .from('prop_firm_accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// IMAGE UPLOAD
// ============================================

/**
 * Upload ein Trade-Screenshot
 */
export async function uploadTradeImage(file: File, folder: 'before' | 'after' = 'before'): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Compress image if needed (optional)
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const filePath = `${user.id}/${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('trade-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Return the URL
  const { data: { publicUrl } } = supabase.storage
    .from('trade-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete a trade image
 */
export async function deleteTradeImage(url: string) {
  // Extract path from URL
  const urlParts = url.split('/trade-images/');
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('trade-images')
    .remove([filePath]);

  if (error) throw error;
}

// ============================================
// AI INSIGHTS
// ============================================

export interface AIInsightInsert {
  category: 'pattern' | 'cycle' | 'strategy' | 'psychology' | 'confirmation';
  title: string;
  insight: string;
  actionable?: string;
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  icon?: string;
  data?: any;
}

/**
 * Speichere ein AI Insight (mit Offline-First Support)
 */
export async function saveAIInsight(insight: AIInsightInsert) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const insightData = {
    user_id: user.id,
    id: crypto.randomUUID(),
    ...insight,
    created_at: new Date().toISOString(),
    is_new: true,
    is_dismissed: false,
  };

  // Try online save first
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .insert(insightData)
        .select()
        .single();

      if (!error && data) {
        // Update localStorage cache
        const cached = JSON.parse(localStorage.getItem('cw_ai_insights') || '[]');
        cached.unshift(data);
        localStorage.setItem('cw_ai_insights', JSON.stringify(cached));
        return data;
      }
    } catch (error) {
      console.error('Failed to save AI insight to Supabase:', error);
    }
  }

  // Offline: Save to localStorage and sync queue
  const cached = JSON.parse(localStorage.getItem('cw_ai_insights') || '[]');
  cached.unshift(insightData);
  localStorage.setItem('cw_ai_insights', JSON.stringify(cached));

  await syncSave({
    type: 'ai_insight',
    data: insightData,
    localStorageKey: 'cw_ai_insights',
    supabaseTable: 'ai_insights',
    operation: 'insert',
    getId: (d) => d.id,
  });

  return insightData;
}

/**
 * Load all AI Insights (with Offline-First fallback)
 */
export async function loadAIInsights(onlyNew = false) {
  // Try Supabase first if online
  if (navigator.onLine) {
    try {
      let query = supabase
        .from('ai_insights')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (onlyNew) {
        query = query.eq('is_new', true);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Update localStorage cache
        localStorage.setItem('cw_ai_insights', JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Failed to load AI insights from Supabase:', error);
    }
  }

  // Fallback: Load from localStorage
  const cached = localStorage.getItem('cw_ai_insights');
  if (!cached) return [];

  const insights = JSON.parse(cached);
  const filtered = insights.filter((i: any) => !i.is_dismissed);
  
  return onlyNew ? filtered.filter((i: any) => i.is_new) : filtered;
}

/**
 * Markiere Insight als gelesen
 */
export async function markInsightAsRead(id: string) {
  const { error } = await supabase
    .from('ai_insights')
    .update({ is_new: false })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Dismiss ein Insight
 */
export async function dismissInsight(id: string) {
  const { error } = await supabase
    .from('ai_insights')
    .update({ is_dismissed: true })
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// PROFILE SETTINGS (Cycle Settings)
// ============================================

export interface ProfileUpdate {
  name?: string;
  avatar_url?: string;
  avg_cycle_length?: number;
  period_length?: number;
  last_period_start?: string;
  pms_days?: number;
  variation_days?: number;
  period_days?: string[];
}

/**
 * Lade User Profile (mit Offline-First Fallback)
 */
export async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try Supabase first if online
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        // Cache to localStorage
        localStorage.setItem('cw_profile', JSON.stringify(data));
        
        // Also cache cycle settings separately (legacy support)
        if (data.avg_cycle_length) localStorage.setItem('cw_avgCycleLength', String(data.avg_cycle_length));
        if (data.period_length) localStorage.setItem('cw_periodLength', String(data.period_length));
        if (data.last_period_start) localStorage.setItem('cw_lastPeriodStart', data.last_period_start);
        if (data.pms_days) localStorage.setItem('cw_pmsDays', String(data.pms_days));
        if (data.variation_days) localStorage.setItem('cw_variationDays', String(data.variation_days));
        if (data.period_days) localStorage.setItem('cw_periodDays', JSON.stringify(data.period_days));
        
        return data;
      }
    } catch (error) {
      console.error('Failed to load profile from Supabase:', error);
    }
  }

  // Fallback: Load from localStorage
  const cached = localStorage.getItem('cw_profile');
  if (cached) {
    return JSON.parse(cached);
  }

  throw new Error('Profile not found');
}

/**
 * Update User Profile (inkl. Cycle Settings) mit Offline-First Support
 */
export async function updateProfile(updates: ProfileUpdate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try online update first
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (!error && data) {
        // Update localStorage cache
        localStorage.setItem('cw_profile', JSON.stringify(data));
        
        // Update legacy localStorage keys
        if (updates.avg_cycle_length) localStorage.setItem('cw_avgCycleLength', String(updates.avg_cycle_length));
        if (updates.period_length) localStorage.setItem('cw_periodLength', String(updates.period_length));
        if (updates.last_period_start) localStorage.setItem('cw_lastPeriodStart', updates.last_period_start);
        if (updates.pms_days) localStorage.setItem('cw_pmsDays', String(updates.pms_days));
        if (updates.variation_days) localStorage.setItem('cw_variationDays', String(updates.variation_days));
        if (updates.period_days) localStorage.setItem('cw_periodDays', JSON.stringify(updates.period_days));
        
        return data;
      }
    } catch (error) {
      console.error('Failed to update profile in Supabase:', error);
    }
  }

  // Offline: Update localStorage and add to sync queue
  const cached = JSON.parse(localStorage.getItem('cw_profile') || '{}');
  const updated = { ...cached, ...updates };
  localStorage.setItem('cw_profile', JSON.stringify(updated));

  // Update legacy keys
  if (updates.avg_cycle_length) localStorage.setItem('cw_avgCycleLength', String(updates.avg_cycle_length));
  if (updates.period_length) localStorage.setItem('cw_periodLength', String(updates.period_length));
  if (updates.last_period_start) localStorage.setItem('cw_lastPeriodStart', updates.last_period_start);
  if (updates.pms_days) localStorage.setItem('cw_pmsDays', String(updates.pms_days));
  if (updates.variation_days) localStorage.setItem('cw_variationDays', String(updates.variation_days));
  if (updates.period_days) localStorage.setItem('cw_periodDays', JSON.stringify(updates.period_days));

  await syncSave({
    type: 'profile_update',
    data: { id: user.id, ...updates },
    localStorageKey: 'cw_profile',
    supabaseTable: 'profiles',
    operation: 'update',
    getId: () => user.id,
  });

  return updated;
}

// ============================================
// USER SETTINGS (Custom Win/Loss Reasons)
// ============================================

export interface UserSettingsUpdate {
  custom_win_reasons?: string[];
  custom_loss_reasons?: string[];
  default_win_reasons?: string[];
  default_loss_reasons?: string[];
  settings?: any;
}

/**
 * Lade User Settings
 */
export async function loadUserSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If not found, create default settings
    if (error.code === 'PGRST116') {
      return await createUserSettings();
    }
    throw error;
  }
  return data;
}

/**
 * Create User Settings
 */
async function createUserSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .insert({ user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update User Settings
 */
export async function updateUserSettings(updates: UserSettingsUpdate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...updates,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// CYCLE LOGS (Extended with Journal)
// ============================================

export interface CycleLogUpdate {
  date: string;
  has_period?: boolean;
  mood?: number;
  confidence?: number;
  energy?: number;
  notes?: string;
  quick_note?: string;
  lessons?: string;
  attachments?: any[];
  safety_mode_enabled?: boolean;
}

/**
 * Save/Update Cycle Log with all journal fields
 */
export async function saveCycleLogExtended(log: CycleLogUpdate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('cycle_logs')
    .upsert({
      user_id: user.id,
      ...log,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Load Cycle Log for a specific date
 */
export async function loadCycleLogForDate(date: string) {
  const { data, error } = await supabase
    .from('cycle_logs')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============================================
// CHALLENGES & LEADERBOARDS
// ============================================

export interface ChallengeEntry {
  challenge_type: 'profit' | 'discipline' | 'risk' | 'cycle';
  week_start: string;
  week_end: string;
  score: number;
  total_trades?: number;
  win_rate?: number;
  avg_rrr?: number;
  total_r?: number;
  consistency_score?: number;
}

/**
 * Join or Update Challenge for this week
 */
export async function joinOrUpdateChallenge(entry: ChallengeEntry) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('weekly_challenges')
    .upsert({
      user_id: user.id,
      ...entry,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Calculate and update Challenge Score based on trades
 */
export async function updateChallengeScores() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current week
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sonntag
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startStr = weekStart.toISOString().split('T')[0];
  const endStr = weekEnd.toISOString().split('T')[0];

  // Lade Trades dieser Woche
  const trades = await loadTradesForDateRange(startStr, endStr);

  if (trades.length === 0) return null;

  // Berechne Scores
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.result === 'win').length;
  const winRate = (winningTrades / totalTrades) * 100;
  
  const totalProfit = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  // Berechne R-Multiple (PnL / Risk per Trade)
  const totalR = trades.reduce((sum, t) => {
    const risk = t.risk_percent || 1;
    const rMultiple = (t.pnl || 0) / risk;
    return sum + rMultiple;
  }, 0);
  
  const avgRRR = trades.reduce((sum, t) => sum + (t.closed_rrr || 0), 0) / totalTrades;

  // Consistency: how many days were rules followed
  const daysWithTrades = new Set(trades.map(t => t.date)).size;
  const consistencyScore = (daysWithTrades / 7) * 100;

  // Update all Challenge Types
  const challengeTypes = [
    { type: 'profit' as const, score: totalProfit },
    { type: 'discipline' as const, score: consistencyScore },
    { type: 'risk' as const, score: Math.max(...trades.map(t => Math.abs(t.pnl || 0))) }, // Niedrigster Drawdown
    { type: 'cycle' as const, score: totalR }, // Total R basiert auf Cycle-Awareness
  ];

  const updates = await Promise.all(
    challengeTypes.map(({ type, score }) =>
      joinOrUpdateChallenge({
        challenge_type: type,
        week_start: startStr,
        week_end: endStr,
        score,
        total_trades: totalTrades,
        win_rate: winRate,
        avg_rrr: avgRRR,
        total_r: totalR,
        consistency_score: consistencyScore,
      })
    )
  );

  return updates;
}

/**
 * Load leaderboard for a Challenge Type
 */
export async function loadLeaderboard(challengeType: 'profit' | 'discipline' | 'risk' | 'cycle', limit = 50) {
  // Get current week
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const startStr = weekStart.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weekly_challenges')
    .select(`
      *,
      profiles:user_id (
        name,
        avatar_url
      )
    `)
    .eq('challenge_type', challengeType)
    .eq('week_start', startStr)
    .order('score', { ascending: challengeType === 'risk' }) // Risk: niedrigster Score ist besser
    .limit(limit);

  if (error) throw error;

  // Berechne Rankings
  return (data || []).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

/**
 * Lade User's Position in allen Challenges
 */
export async function loadMyChallengPositions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const startStr = weekStart.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', startStr);

  if (error) throw error;
  return data || [];
}

/**
 * Check und vergebe Badges basierend auf Performance
 */
export async function checkAndAwardBadges() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const badges: string[] = [];

  // Hole User Stats
  const allTrades = await loadAllTrades();
  const last30Days = allTrades.filter(t => {
    const tradeDate = new Date(t.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return tradeDate >= thirtyDaysAgo;
  });

  // Badge: Miss Discipline (100% rule adherence 30 days)
  const disciplineScore = last30Days.filter(t => t.rating && t.rating >= 4).length / Math.max(last30Days.length, 1);
  if (disciplineScore === 1 && last30Days.length >= 10) {
    badges.push('Miss Discipline');
  }

  // Badge: Risk Queen (Max 3% drawdown)
  const maxDrawdown = Math.max(...last30Days.map(t => Math.abs(t.pnl || 0)));
  if (maxDrawdown <= 300 && last30Days.length >= 20) { // Assuming $10k account
    badges.push('Risk Queen');
  }

  // Badge: Consistency Queen (20+ profitable days in row)
  let consecutiveDays = 0;
  let maxConsecutive = 0;
  const sortedTrades = [...allTrades].sort((a, b) => a.date.localeCompare(b.date));
  
  for (const trade of sortedTrades) {
    if (trade.result === 'win') {
      consecutiveDays++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
    } else {
      consecutiveDays = 0;
    }
  }
  
  if (maxConsecutive >= 20) {
    badges.push('Consistency Queen');
  }

  return badges;
}

/**
 * Helper: Load trades for date range
 */
async function loadTradesForDateRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// XP & GAMIFICATION SYSTEM
// ============================================

export interface XPLog {
  id?: string;
  user_id: string;
  amount: number;
  reason: string;
  details?: any;
  created_at?: string;
}

export interface GamificationProfile {
  total_xp: number;
  current_rank: string;
  login_streak: number;
  trading_streak: number;
  monthly_xp: number;
  last_login?: string;
}

// Rank thresholds
export const RANKS = {
  bronze: { min: 0, name: 'Bronze', icon: '🥉', monthlyRequired: 50 },
  silver: { min: 1000, name: 'Silver', icon: '🥈', monthlyRequired: 200 },
  gold: { min: 3000, name: 'Gold', icon: '🥇', monthlyRequired: 500 },
  platinum: { min: 6000, name: 'Platinum', icon: '💎', monthlyRequired: 1000 },
  diamond: { min: 10000, name: 'Diamond', icon: '👑', monthlyRequired: 2000 },
};

// XP amounts for different actions
export const XP_REWARDS = {
  TRADE_COMPLIANT: 50,
  TRADE_PROFIT_BASE: 20, // × R-Multiple
  TRADE_RULE_BREAK: -30,
  LOGIN_DAILY: 10,
  LOGIN_STREAK_7: 25,
  LOGIN_STREAK_30: 100,
  TRADING_STREAK_5: 100,
  TRADING_STREAK_10: 250,
  AI_INSIGHT_IMPLEMENTED: 100,
  AI_INSIGHT_PROFITABLE: 200,
  AI_INSIGHT_READ: 50,
  NO_REVENGE_TRADING: 50,
  
  // EXECUTION QUALITY (NEW)
  PERFECT_EXECUTION: 100, // 100% execution score
  EXCELLENT_EXECUTION: 50, // 75-99% execution score
  GOOD_EXECUTION: 25, // 50-74% execution score
  EXECUTION_STREAK_5: 150, // 5 trades in a row with 75%+ execution
  EXECUTION_STREAK_10: 300, // 10 trades in a row with 75%+ execution
};

/**
 * Calculate XP for a trade based on rule compliance AND execution quality
 */
export function calculateTradeXP(trade: any, userRules?: any): { xp: number; reasons: string[] } {
  let xp = 0;
  const reasons: string[] = [];

  // Check rule compliance (automatically)
  let isCompliant = true;
  
  // Rule: Stop Loss set
  if (!trade.sl_price) {
    isCompliant = false;
  }

  // Rule: Risk % within limits (assuming 2% max default)
  const maxRisk = userRules?.max_risk_percent || 2;
  if (trade.risk_percent && trade.risk_percent > maxRisk) {
    isCompliant = false;
  }

  // Rule: Strategy selected
  if (!trade.strategy) {
    isCompliant = false;
  }

  // Rule: Emotions documented
  if (trade.emotion_before === null || trade.emotion_before === undefined) {
    isCompliant = false;
  }

  // Award or penalize based on compliance
  if (isCompliant) {
    xp += XP_REWARDS.TRADE_COMPLIANT;
    reasons.push(`Regelkonformer Trade (+${XP_REWARDS.TRADE_COMPLIANT} XP)`);
  } else {
    xp += XP_REWARDS.TRADE_RULE_BREAK;
    reasons.push(`Regelbruch (${XP_REWARDS.TRADE_RULE_BREAK} XP)`);
  }

  // Bonus for profitable trades
  if (trade.result === 'win' && trade.r_multiple) {
    const profitBonus = Math.floor(XP_REWARDS.TRADE_PROFIT_BASE * trade.r_multiple);
    xp += profitBonus;
    reasons.push(`Profitable Trade (+${profitBonus} XP)`);
  }

  // EXECUTION QUALITY BONUS (NEW)
  if (trade.execution_score !== undefined && trade.execution_score !== null) {
    if (trade.execution_score === 100) {
      xp += XP_REWARDS.PERFECT_EXECUTION;
      reasons.push(`Perfect Execution (+${XP_REWARDS.PERFECT_EXECUTION} XP) 🎯`);
    } else if (trade.execution_score >= 75) {
      xp += XP_REWARDS.EXCELLENT_EXECUTION;
      reasons.push(`Excellent Execution (+${XP_REWARDS.EXCELLENT_EXECUTION} XP) ⭐`);
    } else if (trade.execution_score >= 50) {
      xp += XP_REWARDS.GOOD_EXECUTION;
      reasons.push(`Good Execution (+${XP_REWARDS.GOOD_EXECUTION} XP)`);
    }
    // No penalty for low scores - awareness is enough
  }

  return { xp, reasons };
}

/**
 * Award XP to user and log it
 */
export async function awardXP(userId: string, amount: number, reason: string, details?: any) {
  try {
    // Insert XP log
    const { error: logError } = await supabase
      .from('xp_logs')
      .insert({
        user_id: userId,
        amount,
        reason,
        details: details || {},
      });

    if (logError) throw logError;

    // Update profile XP
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_xp, monthly_xp')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const newTotalXP = ((profile as any).total_xp || 0) + amount;
    const newMonthlyXP = ((profile as any).monthly_xp || 0) + amount;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_xp: Math.max(0, newTotalXP), // Can't go below 0
        monthly_xp: Math.max(0, newMonthlyXP),
      } as any)
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true, newTotalXP, newMonthlyXP, reasons: details?.reasons };
  } catch (error) {
    console.error('Failed to award XP:', error);
    throw error;
  }
}

/**
 * Check and update login streak
 */
export async function updateLoginStreak(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('login_streak, last_login')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = (profile as any).last_login;

    let newStreak = (profile as any).login_streak || 0;
    let xpAwarded = 0;

    if (!lastLogin) {
      // First login ever
      newStreak = 1;
      xpAwarded = XP_REWARDS.LOGIN_DAILY;
    } else {
      const lastLoginDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak++;
        xpAwarded = XP_REWARDS.LOGIN_DAILY;

        // Streak milestones
        if (newStreak === 7) {
          xpAwarded += XP_REWARDS.LOGIN_STREAK_7;
        } else if (newStreak === 30) {
          xpAwarded += XP_REWARDS.LOGIN_STREAK_30;
        }
      } else if (diffDays === 0) {
        // Same day, no change
        return { streak: newStreak, xpAwarded: 0 };
      } else {
        // Streak broken
        newStreak = 1;
        xpAwarded = XP_REWARDS.LOGIN_DAILY;
      }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        login_streak: newStreak,
        last_login: today,
      } as any)
      .eq('id', userId);

    if (updateError) throw updateError;

    // Award XP
    if (xpAwarded > 0) {
      await awardXP(userId, xpAwarded, 'login_streak', { streak: newStreak });
      
      // Trigger XP notification
      if (typeof window !== 'undefined') {
        const reasons = [`Daily Login (+${XP_REWARDS.LOGIN_DAILY} XP)`];
        if (newStreak === 7) reasons.push(`7-Day Streak Bonus! (+${XP_REWARDS.LOGIN_STREAK_7} XP)`);
        if (newStreak === 30) reasons.push(`30-Day Streak Bonus! (+${XP_REWARDS.LOGIN_STREAK_30} XP)`);
        
        const event = new CustomEvent('xp-earned', {
          detail: { amount: xpAwarded, reason: 'login_streak', reasons }
        });
        window.dispatchEvent(event);
      }
    }

    return { streak: newStreak, xpAwarded };
  } catch (error) {
    console.error('Failed to update login streak:', error);
    throw error;
  }
}

/**
 * Check for revenge trading (multiple trades within 1 hour after a loss)
 */
export async function checkRevengeTradingPenalty(userId: string, tradeDate: string, tradeTime: string): Promise<boolean> {
  try {
    // Get recent trades
    const oneHourAgo = new Date(new Date(`${tradeDate} ${tradeTime}`).getTime() - 60 * 60 * 1000);
    
    const { data: recentTrades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .gte('date', oneHourAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(5);

    if (error) throw error;

    // Check if last trade was a loss
    if (recentTrades && recentTrades.length > 0) {
      const lastTrade = recentTrades[0];
      if (lastTrade.result === 'loss') {
        const lastTradeTime = new Date(`${lastTrade.date} ${lastTrade.time || '00:00'}`);
        const currentTradeTime = new Date(`${tradeDate} ${tradeTime}`);
        const diffMinutes = (currentTradeTime.getTime() - lastTradeTime.getTime()) / (1000 * 60);

        if (diffMinutes < 60) {
          // Revenge trading detected!
          await awardXP(userId, XP_REWARDS.TRADE_RULE_BREAK, 'revenge_trading', {
            last_trade_id: lastTrade.id,
            minutes_after_loss: diffMinutes,
          });
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Failed to check revenge trading:', error);
    return false;
  }
}

/** 
 * Get user's gamification stats
 */
export async function getGamificationStats(userId: string): Promise<GamificationProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_xp, current_rank, login_streak, trading_streak, monthly_xp, last_login')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as any;
  } catch (error) {
    console.error('Failed to get gamification stats:', error);
    return null;
  }
}

/**
 * Get XP leaderboard
 */
export async function getXPLeaderboard(period: 'weekly' | 'monthly' | 'alltime', limit: number = 50) {
  try {
    const query = supabase
      .from('profiles')
      .select('id, name, avatar_url, total_xp, current_rank, monthly_xp')
      .order(period === 'alltime' ? 'total_xp' : 'monthly_xp', { ascending: false })
      .limit(limit);

    // For weekly, we'd need to sum xp_logs from last 7 days
    if (period === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: xpLogs, error: logsError } = await supabase
        .from('xp_logs' as any)
        .select('user_id, amount')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (logsError) throw logsError;

      // Aggregate by user
      const userXP = new Map<string, number>();
      (xpLogs as any)?.forEach((log: any) => {
        userXP.set(log.user_id, (userXP.get(log.user_id) || 0) + log.amount);
      });

      // Get profiles for top users
      const topUserIds = Array.from(userXP.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([userId]) => userId);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, total_xp, current_rank')
        .in('id', topUserIds);

      if (profilesError) throw profilesError;

      // Combine with weekly XP
      return (profiles as any)?.map((profile: any) => ({
        ...profile,
        weekly_xp: userXP.get(profile.id) || 0,
      })).sort((a: any, b: any) => b.weekly_xp - a.weekly_xp) || [];
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data as any)?.map((entry: any, index: number) => ({
      ...entry,
      rank: index + 1,
    })) || [];
  } catch (error) {
    console.error('Failed to get XP leaderboard:', error);
    return [];
  }
}

/**
 * Calculate win/loss streak (consecutive wins or losses) from localStorage
 * Uses centralized tradeLoaders utility
 */
export async function getWinLossStreak(userId: string): Promise<{ winStreak: number; lossStreak: number; currentType: 'win' | 'loss' | 'none' }> {
  try {
    return calculateWinLossStreak();
  } catch (error) {
    console.error('Failed to calculate win/loss streak:', error);
    return { winStreak: 0, lossStreak: 0, currentType: 'none' };
  }
}

/**
 * Process monthly XP decay (should be run by cron/scheduled function)
 */
export async function processMonthlyXPDecay() {
  try {
    const { error } = await (supabase as any).rpc('process_monthly_maintenance');
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to process monthly decay:', error);
    throw error;
  }
}
