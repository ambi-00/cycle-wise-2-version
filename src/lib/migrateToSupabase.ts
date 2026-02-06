/**
 * Migration Script: LocalStorage → Supabase
 * Safely migrates all existing data to the database
 */

import { supabase } from '@/integrations/supabase/client';

export interface MigrationResult {
  success: boolean;
  tradesImported: number;
  cycleLogsImported: number;
  strategiesImported: number;
  propFirmAccountsImported: number;
  aiInsightsImported: number;
  profileUpdated: boolean;
  settingsUpdated: boolean;
  errors: string[];
}

/**
 * Main function: Migrates all localStorage data to Supabase
 */
export async function migrateLocalStorageToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    tradesImported: 0,
    cycleLogsImported: 0,
    strategiesImported: 0,
    propFirmAccountsImported: 0,
    aiInsightsImported: 0,
    profileUpdated: false,
    settingsUpdated: false,
    errors: [],
  };

  try {
    // Check ob User eingeloggt ist
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      result.errors.push('Not authenticated');
      return result;
    }

    console.log('🚀 Migration gestartet...');

    // 1. Migriere Profile Settings (Cycle Settings)
    const profileResult = await migrateProfileSettings(user.id);
    result.profileUpdated = profileResult.success;
    result.errors.push(...profileResult.errors);

    // 2. Migriere User Settings (Custom Win/Loss Reasons)
    const settingsResult = await migrateUserSettings(user.id);
    result.settingsUpdated = settingsResult.success;
    result.errors.push(...settingsResult.errors);

    // 3. Migriere Trades
    const tradesResult = await migrateTrades(user.id);
    result.tradesImported = tradesResult.count;
    result.errors.push(...tradesResult.errors);

    // 4. Migriere Cycle Logs (erweitert mit Journal-Daten)
    const cycleResult = await migrateCycleLogsExtended(user.id);
    result.cycleLogsImported = cycleResult.count;
    result.errors.push(...cycleResult.errors);

    // 5. Migriere Strategien
    const strategiesResult = await migrateStrategies(user.id);
    result.strategiesImported = strategiesResult.count;
    result.errors.push(...strategiesResult.errors);

    // 6. Migriere PropFirm Accounts
    const propFirmResult = await migratePropFirmAccounts(user.id);
    result.propFirmAccountsImported = propFirmResult.count;
    result.errors.push(...propFirmResult.errors);

    // 7. Migriere AI Insights
    const aiResult = await migrateAIInsights(user.id);
    result.aiInsightsImported = aiResult.count;
    result.errors.push(...aiResult.errors);

    // Success if at least something was imported
    result.success = result.tradesImported > 0 || result.cycleLogsImported > 0 || 
                     result.strategiesImported > 0 || result.profileUpdated || result.settingsUpdated;

    console.log('✅ Migration completed:', result);
    return result;
  } catch (error: any) {
    result.errors.push(`Migration failed: ${error.message}`);
    console.error('❌ Migration Error:', error);
    return result;
  }
}

/**
 * Migrate all trades from localStorage
 */
async function migrateTrades(userId: string) {
  const trades: any[] = [];
  const errors: string[] = [];

  try {
    // Load all trades from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('cw_journal_')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw);
          if (data.trades && Array.isArray(data.trades)) {
            trades.push(...data.trades);
          }
        } catch (e: any) {
          errors.push(`Failed to parse ${key}: ${e.message}`);
        }
      }
    }

    if (trades.length === 0) {
      console.log('No trades found to migrate');
      return { count: 0, errors };
    }

    console.log(`📊Trades found: ${trades.length}, starting migration...`);

    // Batch Insert (50 Trades pro Batch)
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize).map(trade => ({
        user_id: userId,
        date: trade.date || new Date().toISOString().split('T')[0],
        time: trade.time || null,
        instrument: trade.instrument || 'Unknown',
        direction: trade.direction || 'long',
        entry_price: trade.entry || trade.entry_price || null,
        sl_price: trade.sl || trade.sl_price || null,
        tp_price: trade.tp || trade.tp_price || null,
        exit_price: trade.exit_price || null,
        strategy: trade.strategy || null,
        confirmations: trade.checklist || trade.confirmations || [],
        risk_percent: trade.riskPct || trade.risk_percent || null,
        planned_rrr: trade.rrr || trade.planned_rrr || null,
        planned_sl_size: trade.plannedSlSize || null,
        closed_rrr: trade.closedRrr || trade.closed_rrr || null,
        max_r_reached: trade.maxRReached || trade.max_r_reached || null,
        ideal_sl_size: trade.idealSlSize || trade.ideal_sl_size || null,
        pnl: trade.pnl || trade.closedPnl || null,
        result: trade.result || '',
        status: trade.status || 'open',
        exit_reason: trade.exit_reason || null,
        loss_reason: trade.loss_reason || null,
        custom_exit_reason: trade.custom_exit_reason || null,
        pre_trade_note: trade.preNote || trade.pre_trade_note || null,
        post_trade_note: trade.postNote || trade.post_trade_note || null,
        learnings: trade.learnings || null,
        emotion_before: trade.emotion_before || null,
        emotion_after: trade.emotion_after || null,
        rating: trade.rating || null,
        timeframe_small: trade.tfSmall || trade.timeframe_small || trade.timeframe || null,
        timeframe_large: trade.tfLarge || trade.timeframe_large || trade.higher_timeframe || null,
        image_before_small: trade.image_before_small_tf || null,
        image_before_large: trade.image_before_large_tf || null,
        image_after_small: trade.image_after_small_tf || null,
        image_after_large: trade.image_after_large_tf || null,
        cycle_day: trade.cycleDay || trade.cycle_day || null,
        cycle_phase: trade.cyclePhase || trade.cycle_phase || null,
      }));

      const { data, error } = await supabase
        .from('trades')
        .insert(batch)
        .select();

      if (error) {
        errors.push(`Batch ${i / batchSize + 1} failed: ${error.message}`);
        console.error('Batch Error:', error);
      } else {
        imported += data?.length || 0;
        console.log(`✓ Batch ${i / batchSize + 1}: ${data?.length} Trades importiert`);
      }
    }

    console.log(`✅ Total: ${imported} Trades erfolgreich migriert`);
    return { count: imported, errors };
  } catch (error: any) {
    errors.push(`Trade migration failed: ${error.message}`);
    return { count: 0, errors };
  }
}

/**
 * Migriere Cycle Logs aus localStorage
 */
async function migrateCycleLogs(userId: string) {
  const logs: any[] = [];
  const errors: string[] = [];

  try {
    // Hole Cycle Settings
    const avgCycleLength = Number(localStorage.getItem('cw_avgCycleLength')) || 28;
    const periodLength = Number(localStorage.getItem('cw_periodLength')) || 5;
    const lastPeriodStart = localStorage.getItem('cw_lastPeriodStart') || null;

    // Load all journal entries that have period data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('cw_journal_')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw);
          const date = key.replace('cw_journal_', '');

          // Create Cycle Log if relevant data is available
          if (data.hasPeriod || data.mood || data.confidence) {
            logs.push({
              user_id: userId,
              date,
              has_period: data.hasPeriod || false,
              mood: data.mood || null,
              confidence: data.confidence || null,
              energy: null, // Not in old data
              notes: data.quickNote || data.lessons || null,
              safety_mode_enabled: false,
              avg_cycle_length: avgCycleLength,
              period_length: periodLength,
              last_period_start: lastPeriodStart,
            });
          }
        } catch (e: any) {
          errors.push(`Failed to parse cycle log ${key}: ${e.message}`);
        }
      }
    }

    if (logs.length === 0) {
      console.log('No cycle logs found to migrate');
      return { count: 0, errors };
    }

    console.log(`📅 Cycle logs found: ${logs.length}, starting migration...`);

    // Insert Cycle Logs (upsert for Unique Constraint)
    const { data, error } = await supabase
      .from('cycle_logs')
      .upsert(logs, { onConflict: 'user_id,date' })
      .select();

    if (error) {
      errors.push(`Cycle logs migration failed: ${error.message}`);
      console.error('Cycle Logs Error:', error);
      return { count: 0, errors };
    }

    const imported = data?.length || 0;
    console.log(`✅ ${imported} Cycle Logs erfolgreich migriert`);
    return { count: imported, errors };
  } catch (error: any) {
    errors.push(`Cycle logs migration failed: ${error.message}`);
    return { count: 0, errors };
  }
}

/**
 * Check if migration has already been performed
 */
/**
 * Migrate Profile Settings (Cycle Settings)
 */
async function migrateProfileSettings(userId: string) {
  const errors: string[] = [];
  try {
    const avgCycleLength = Number(localStorage.getItem('cw_avgCycleLength')) || 28;
    const periodLength = Number(localStorage.getItem('cw_periodLength')) || 5;
    const lastPeriodStart = localStorage.getItem('cw_lastPeriodStart') || null;
    const pmsDays = Number(localStorage.getItem('cw_pmsDays')) || 3;
    const variationDays = Number(localStorage.getItem('cw_variationDays')) || 2;
    const periodDaysRaw = localStorage.getItem('cw_periodDays');
    const periodDays = periodDaysRaw ? JSON.parse(periodDaysRaw) : [];

    const { error } = await supabase
      .from('profiles')
      .update({
        avg_cycle_length: avgCycleLength,
        period_length: periodLength,
        last_period_start: lastPeriodStart,
        pms_days: pmsDays,
        variation_days: variationDays,
        period_days: periodDays,
      })
      .eq('id', userId);

    if (error) {
      errors.push(`Profile settings migration failed: ${error.message}`);
      return { success: false, errors };
    }

    console.log('✅ Profile settings migriert');
    return { success: true, errors };
  } catch (error: any) {
    errors.push(`Profile settings migration failed: ${error.message}`);
    return { success: false, errors };
  }
}

/**
 * Migriere User Settings (Custom Win/Loss Reasons)
 */
async function migrateUserSettings(userId: string) {
  const errors: string[] = [];
  try {
    const customWinRaw = localStorage.getItem('cw_custom_win_reasons');
    const customLossRaw = localStorage.getItem('cw_custom_loss_reasons');
    const defaultWinRaw = localStorage.getItem('cw_default_win_reasons');
    const defaultLossRaw = localStorage.getItem('cw_default_loss_reasons');

    const customWinReasons = customWinRaw ? JSON.parse(customWinRaw) : [];
    const customLossReasons = customLossRaw ? JSON.parse(customLossRaw) : [];
    const defaultWinReasons = defaultWinRaw ? JSON.parse(defaultWinRaw) : [];
    const defaultLossReasons = defaultLossRaw ? JSON.parse(defaultLossRaw) : [];

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        custom_win_reasons: customWinReasons,
        custom_loss_reasons: customLossReasons,
        default_win_reasons: defaultWinReasons,
        default_loss_reasons: defaultLossReasons,
      });

    if (error) {
      errors.push(`User settings migration failed: ${error.message}`);
      return { success: false, errors };
    }

    console.log('✅ User settings migriert');
    return { success: true, errors };
  } catch (error: any) {
    errors.push(`User settings migration failed: ${error.message}`);
    return { success: false, errors };
  }
}

/**
 * Migriere Cycle Logs (erweitert mit Journal-Daten)
 */
async function migrateCycleLogsExtended(userId: string) {
  const cycleLogs: any[] = [];
  const errors: string[] = [];

  try {
    // Load all journal entries from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('cw_journal_')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw);
          const date = key.replace('cw_journal_', '');

          // Create Cycle Log with all fields
          const log: any = {
            user_id: userId,
            date,
            mood: data.mood || null,
            confidence: data.confidence || null,
            energy: data.energy || null,
            notes: data.notes || null,
            quick_note: data.quickNote || null,
            lessons: data.lessons || null,
            attachments: data.attachments || [],
            has_period: false,
            safety_mode_enabled: false,
          };

          // Check if period day
          const periodDaysRaw = localStorage.getItem('cw_periodDays');
          if (periodDaysRaw) {
            const periodDays = JSON.parse(periodDaysRaw);
            log.has_period = periodDays.includes(date);
          }

          cycleLogs.push(log);
        } catch (e: any) {
          errors.push(`Failed to parse ${key}: ${e.message}`);
        }
      }
    }

    if (cycleLogs.length === 0) {
      console.log('No cycle logs found to migrate');
      return { count: 0, errors };
    }

    console.log(`📅 Cycle logs found: ${cycleLogs.length}, starting migration...`);

    // Batch Insert
    const { data, error } = await supabase
      .from('cycle_logs')
      .upsert(cycleLogs, { onConflict: 'user_id,date' })
      .select();

    if (error) {
      errors.push(`Cycle logs batch insert failed: ${error.message}`);
      return { count: 0, errors };
    }

    const imported = data?.length || 0;
    console.log(`✅ ${imported} Cycle Logs erfolgreich migriert`);
    return { count: imported, errors };
  } catch (error: any) {
    errors.push(`Cycle logs migration failed: ${error.message}`);
    return { count: 0, errors };
  }
}

/**
 * Migriere Strategien
 */
async function migrateStrategies(userId: string) {
  const errors: string[] = [];
  try {
    const raw = localStorage.getItem('cw_strategies');
    if (!raw) {
      console.log('No strategies found to migrate');
      return { count: 0, errors };
    }

    const strategies = JSON.parse(raw);
    if (!Array.isArray(strategies) || strategies.length === 0) {
      return { count: 0, errors };
    }

    console.log(`📋 Strategies found: ${strategies.length}, starting migration...`);

    const strategiesData = strategies.map(s => ({
      user_id: userId,
      name: s.name || 'Unnamed Strategy',
      description: s.description || null,
      markets: s.markets || [],
      timeframes: s.timeframes || [],
      confirmations: s.confirmations || [],
      entry_triggers: s.entryTriggers || s.entry_triggers || [],
      exit_rules: s.exitRules || s.exit_rules || [],
      general_rules: s.generalRules || s.general_rules || [],
      risk_per_trade: s.riskPerTrade || s.risk_per_trade || null,
      target_rrr: s.targetRrr || s.target_rrr || null,
      stop_loss_type: s.stopLossType || s.stop_loss_type || null,
      take_profit_type: s.takeProfitType || s.take_profit_type || null,
      total_trades: s.totalTrades || s.total_trades || 0,
      win_rate: s.winRate || s.win_rate || null,
      avg_rrr: s.avgRrr || s.avg_rrr || null,
      score: s.score || null,
    }));

    const { data, error } = await supabase
      .from('strategies')
      .upsert(strategiesData, { onConflict: 'user_id,name' })
      .select();

    if (error) {
      errors.push(`Strategies migration failed: ${error.message}`);
      return { count: 0, errors };
    }

    const imported = data?.length || 0;
    console.log(`✅ ${imported} Strategien erfolgreich migriert`);
    return { count: imported, errors };
  } catch (error: any) {
    errors.push(`Strategies migration failed: ${error.message}`);
    return { count: 0, errors };
  }
}

/**
 * Migriere PropFirm Accounts
 */
async function migratePropFirmAccounts(userId: string) {
  const errors: string[] = [];
  try {
    const raw = localStorage.getItem('cw_propfirm_accounts');
    if (!raw) {
      console.log('No PropFirm accounts found to migrate');
      return { count: 0, errors };
    }

    const accounts = JSON.parse(raw);
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return { count: 0, errors };
    }

    console.log(`🏦 PropFirm accounts found: ${accounts.length}, starting migration...`);

    const accountsData = accounts.map(acc => ({
      user_id: userId,
      firm_name: acc.firmName || acc.firm_name || 'Unknown',
      account_number: acc.accountNumber || acc.account_number || '',
      investor_password_encrypted: acc.investorPassword || acc.investor_password_encrypted || null,
      server: acc.server || null,
      balance: acc.balance || null,
      equity: acc.equity || null,
      profit: acc.profit || null,
      auto_sync: acc.autoSync || acc.auto_sync || false,
      last_sync: acc.lastSync || acc.last_sync || null,
    }));

    const { data, error } = await supabase
      .from('prop_firm_accounts')
      .upsert(accountsData, { onConflict: 'user_id,firm_name,account_number' })
      .select();

    if (error) {
      errors.push(`PropFirm accounts migration failed: ${error.message}`);
      return { count: 0, errors };
    }

    const imported = data?.length || 0;
    console.log(`✅ ${imported} PropFirm Accounts erfolgreich migriert`);
    return { count: imported, errors };
  } catch (error: any) {
    errors.push(`PropFirm accounts migration failed: ${error.message}`);
    return { count: 0, errors };
  }
}

/**
 * Migriere AI Insights
 */
async function migrateAIInsights(userId: string) {
  const errors: string[] = [];
  try {
    const raw = localStorage.getItem('cw_ai_insights');
    if (!raw) {
      console.log('No AI insights found to migrate');
      return { count: 0, errors };
    }

    const insights = JSON.parse(raw);
    if (!Array.isArray(insights) || insights.length === 0) {
      return { count: 0, errors };
    }

    console.log(`🤖 AI insights found: ${insights.length}, starting migration...`);

    const insightsData = insights.map(ins => ({
      user_id: userId,
      category: ins.category || 'pattern',
      title: ins.title || 'Insight',
      insight: ins.insight || '',
      actionable: ins.actionable || null,
      impact: ins.impact || 'Medium',
      icon: ins.icon || null,
      data: ins.data || {},
      is_new: ins.isNew !== undefined ? ins.isNew : true,
      is_dismissed: ins.isDismissed || false,
    }));

    const { data, error } = await supabase
      .from('ai_insights')
      .insert(insightsData)
      .select();

    if (error) {
      errors.push(`AI insights migration failed: ${error.message}`);
      return { count: 0, errors };
    }

    const imported = data?.length || 0;
    console.log(`✅ ${imported} AI Insights erfolgreich migriert`);
    return { count: imported, errors };
  } catch (error: any) {
    errors.push(`AI insights migration failed: ${error.message}`);
    return { count: 0, errors };
  }
}

/**
 * Check if migration has already been performed
 */
export async function checkMigrationStatus(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if trades exist in DB
    const { count } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true });

    return (count || 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Markiere Migration als abgeschlossen
 */
export function markMigrationComplete() {
  localStorage.setItem('cw_migration_completed', new Date().toISOString());
}

/**
 * Check if migration flag is set
 */
export function isMigrationMarkedComplete(): boolean {
  return localStorage.getItem('cw_migration_completed') !== null;
}
