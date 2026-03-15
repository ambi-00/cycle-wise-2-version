/**
 * Achievements System
 * All achievement definitions and calculation logic.
 * 100% local — uses localStorage trades, no backend needed.
 */

import { loadTradesFromLocalStorage } from '@/lib/tradeLoaders';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AchievementTier = 'beginner' | 'intermediate' | 'pro' | 'elite';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  tier: AchievementTier;
}

export type AchievementCategory =
  | 'first_ever'
  | 'trade_count'
  | 'best_day'
  | 'best_week'
  | 'best_month'
  | 'total_pnl'
  | 'win_streak'
  | 'green_days'
  | 'perfect_trades'
  | 'rule_streak'
  | 'rule_total'
  | 'zen_streak'
  | 'strategy'
  | 'consistency';

export interface UnlockedAchievements {
  unlocked: string[];
  unlockedDates: Record<string, string>;
}

// ─── Category meta ────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<AchievementCategory, { label: string; emoji: string; gradient: string; description: string }> = {
  first_ever:     { label: 'First Ever',           emoji: '🐣', gradient: 'from-violet-500/20 to-purple-400/20', description: 'Your very first milestones: first trade, first note, first reflection & more.' },
  trade_count:    { label: 'Trade Count',           emoji: '📊', gradient: 'from-blue-500/20 to-cyan-400/20',    description: 'Total number of trades you have logged in your journal.' },
  best_day:       { label: 'Best Day',              emoji: '💰', gradient: 'from-amber-500/20 to-yellow-400/20', description: 'Your highest PnL achieved on a single trading day.' },
  best_week:      { label: 'Best Week',             emoji: '📅', gradient: 'from-emerald-500/20 to-green-400/20',description: 'Your highest PnL achieved within a single trading week.' },
  best_month:     { label: 'Best Month',            emoji: '📆', gradient: 'from-teal-500/20 to-emerald-400/20', description: 'Your highest PnL achieved within a single trading month.' },
  total_pnl:      { label: 'Total PnL',             emoji: '📈', gradient: 'from-green-500/20 to-lime-400/20',   description: 'Your cumulative all-time PnL across every logged trade.' },
  win_streak:     { label: 'Win Streak',            emoji: '🔥', gradient: 'from-orange-500/20 to-red-400/20',   description: 'How many winning trades you closed back-to-back without a loss.' },
  green_days:     { label: 'Profit Days in a Row',  emoji: '💚', gradient: 'from-green-500/20 to-emerald-400/20',description: 'How many consecutive trading days ended in profit.' },
  perfect_trades: { label: '5-Star Trades',         emoji: '⭐', gradient: 'from-yellow-500/20 to-amber-400/20', description: 'Trades you rated 5 stars — perfect execution, entry, and mindset.' },
  rule_streak:    { label: 'Rule Streak',           emoji: '🎯', gradient: 'from-pink-500/20 to-rose-400/20',    description: 'How many trades in a row you closed while following all your trading rules.' },
  rule_total:     { label: 'Rule Following',        emoji: '📋', gradient: 'from-fuchsia-500/20 to-pink-400/20', description: 'Total number of trades where you followed every rule in your checklist.' },
  zen_streak:     { label: 'Zen Streak',            emoji: '🧘', gradient: 'from-sky-500/20 to-blue-400/20',     description: 'Consecutive trades with an emotional rating above 2 — no revenge, stress, or FOMO trading.' },
  strategy:       { label: 'Strategy',              emoji: '🏆', gradient: 'from-indigo-500/20 to-violet-400/20',description: 'Using multiple strategies and staying loyal to one strategy across many trades.' },
  consistency:    { label: 'Consistency',           emoji: '🗓️', gradient: 'from-indigo-500/20 to-blue-400/20',  description: 'How long you keep trading and journalling actively across multiple months.' },
};

// ─── Tier meta ────────────────────────────────────────────────────────────────

export const TIER_META: Record<AchievementTier, { label: string; color: string; borderColor: string; badgeColor: string }> = {
  beginner:     { label: 'Beginner',     color: 'from-slate-400/20 to-slate-300/10',       borderColor: 'border-slate-400/40',    badgeColor: 'bg-slate-400/20 text-slate-500 dark:text-slate-400' },
  intermediate: { label: 'Intermediate', color: 'from-blue-500/20 to-cyan-400/10',         borderColor: 'border-blue-400/40',     badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  pro:          { label: 'Pro',          color: 'from-violet-500/20 to-purple-400/10',     borderColor: 'border-violet-400/40',   badgeColor: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  elite:        { label: 'Elite',        color: 'from-amber-500/20 to-yellow-400/10',      borderColor: 'border-amber-400/40',    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
};

// How many milestones per tier (roughly quarter splits — overridden per category in buildAchievements)
export const TIER_THRESHOLDS: AchievementTier[] = ['beginner', 'intermediate', 'pro', 'elite'];

/** Assign tiers to a flat list: first 25% → beginner, 50% → intermediate, 75% → pro, rest → elite */
export function assignTiers(list: Omit<Achievement, 'tier'>[], tierSplits?: number[]): Achievement[] {
  const n = list.length;
  const splits = tierSplits ?? [
    Math.ceil(n * 0.25),
    Math.ceil(n * 0.5),
    Math.ceil(n * 0.75),
    n,
  ];
  return list.map((a, i) => ({
    ...a,
    tier: i < splits[0] ? 'beginner'
        : i < splits[1] ? 'intermediate'
        : i < splits[2] ? 'pro'
        : 'elite',
  }));
}

function milestones(fixed: number[], step: number, max = 200_000): number[] {
  const result = [...fixed];
  let last = fixed[fixed.length - 1];
  while (last + step <= max) { last += step; result.push(last); }
  return result;
}

export const TRADE_COUNT_MILESTONES    = milestones([5,10,25,50,100,250,500,1000,2000,3000,5000,10000], 5000);
export const PNL_DAY_MILESTONES        = milestones([100,250,500,1000,1500,2000,2500,3000,3500,4000,4500,5000], 1000);
export const PNL_WEEK_MILESTONES       = milestones([100,250,500,1000,1500,2000,2500,3000], 500);
export const PNL_MONTH_MILESTONES      = milestones([100,250,500,1000,1500,2000,2500,3000], 500);
export const TOTAL_PNL_MILESTONES      = milestones([100,250,500,1000,1500,2000,2500,3000,5000,10000], 10000);
export const WIN_STREAK_MILESTONES     = milestones([2,3,5,7,10,15,20,25,30], 10);
export const GREEN_DAYS_MILESTONES     = milestones([2,3,5,7,14,21,30], 30);
export const PERFECT_TOTAL_MILESTONES  = milestones([1,5,10,25,50,100,250,500], 500);
export const PERFECT_STREAK_MILESTONES = milestones([3,5,10,15,20], 10);
export const RULE_STREAK_MILESTONES    = milestones([5,10,20,30,50,75,100], 100);
export const RULE_TOTAL_MILESTONES     = milestones([5,10,25,50,100,250,500], 500);
export const ZEN_STREAK_MILESTONES     = milestones([5,10,20,30,50], 50);
export const STRATEGY_LOYAL_MILESTONES = milestones([20,50,100,200,500], 500);
export const CONSISTENCY_MILESTONES    = [1,3,6,12,18,24,36,48,60];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
}
function fmtPnl(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;
}

function buildAchievements(
  list: number[],
  cat: AchievementCategory,
  prefix: string,
  titleFn: (n: number) => string,
  descFn: (n: number) => string,
  emoji: string
): Achievement[] {
  const raw = list.map(n => ({ id: `${prefix}_${n}`, title: titleFn(n), description: descFn(n), emoji, category: cat }));
  return assignTiers(raw);
}

// ─── Static "First Ever" ─────────────────────────────────────────────────────

export const FIRST_EVER_ACHIEVEMENTS: Achievement[] = assignTiers([
  { id: 'first_trade',         title: 'First Trade',           description: 'Logged your very first trade',                 emoji: '🐣', category: 'first_ever' },
  { id: 'first_note',          title: 'First Note',            description: 'Wrote your first post-trade note',             emoji: '📝', category: 'first_ever' },
  { id: 'first_screenshot',    title: 'First Screenshot',      description: 'Uploaded your first chart screenshot',         emoji: '📸', category: 'first_ever' },
  { id: 'first_reflection',    title: 'First Reflection',      description: 'Completed your first trade reflection',        emoji: '🪞', category: 'first_ever' },
  { id: 'first_checklist',     title: 'First Checklist',       description: 'Completed your first full checklist',          emoji: '✅', category: 'first_ever' },
  { id: 'first_strategy',      title: 'First Strategy',        description: 'Created your first trading strategy',          emoji: '📋', category: 'first_ever' },
  { id: 'first_day_profit',    title: 'First Day in Profit',   description: 'Your first ever profitable trading day',       emoji: '🌱', category: 'first_ever' },
  { id: 'first_week_profit',   title: 'First Week in Profit',  description: 'Your first ever profitable trading week',      emoji: '📅', category: 'first_ever' },
  { id: 'first_month_profit',  title: 'First Month in Profit', description: 'Your first ever profitable trading month',     emoji: '📆', category: 'first_ever' },
  { id: 'first_year_profit',   title: 'First Year in Profit',  description: 'Your first ever profitable trading year',      emoji: '🎊', category: 'first_ever' },
  { id: 'first_win_streak',    title: 'First Win Streak',      description: 'Got your first 3 wins in a row',              emoji: '🔥', category: 'first_ever' },
  { id: 'first_green_streak',  title: 'First Green Streak',    description: 'First 3 profitable days in a row',            emoji: '💚', category: 'first_ever' },
  { id: 'first_perfect_trade', title: 'First Perfect Trade',   description: 'Rated your first trade with 5 stars',         emoji: '⭐', category: 'first_ever' },
  { id: 'first_rrr2',          title: 'First RRR 2+',          description: 'First trade with closed RRR >= 2.0',          emoji: '🎯', category: 'first_ever' },
  { id: 'first_cycle',         title: 'First Cycle Tracked',   description: 'Logged your first cycle check-in',            emoji: '🌙', category: 'first_ever' },
]);

// ─── Dynamic achievements ─────────────────────────────────────────────────────

export const TRADE_COUNT_ACHIEVEMENTS    = buildAchievements(TRADE_COUNT_MILESTONES,    'trade_count',    'trades',         n => `${fmt(n)} Trades`,            n => `Logged ${fmt(n)} trades`,                      '📊');
export const BEST_DAY_ACHIEVEMENTS       = buildAchievements(PNL_DAY_MILESTONES,        'best_day',       'best_day',       n => `${fmtPnl(n)} Day`,            n => `First day with ${fmtPnl(n)}+ profit`,          '💰');
export const BEST_WEEK_ACHIEVEMENTS      = buildAchievements(PNL_WEEK_MILESTONES,       'best_week',      'best_week',      n => `${fmtPnl(n)} Week`,           n => `First week with ${fmtPnl(n)}+ profit`,         '📅');
export const BEST_MONTH_ACHIEVEMENTS     = buildAchievements(PNL_MONTH_MILESTONES,      'best_month',     'best_month',     n => `${fmtPnl(n)} Month`,          n => `First month with ${fmtPnl(n)}+ profit`,        '📆');
export const TOTAL_PNL_ACHIEVEMENTS      = buildAchievements(TOTAL_PNL_MILESTONES,      'total_pnl',      'total_pnl',      n => `${fmtPnl(n)} Total`,          n => `Reached ${fmtPnl(n)} in total earnings`,       '📈');
export const WIN_STREAK_ACHIEVEMENTS     = buildAchievements(WIN_STREAK_MILESTONES,     'win_streak',     'win_streak',     n => n === 2 ? 'Double Win' : n === 3 ? 'Hat Trick' : `${n} Win Streak`,        n => `${n} wins in a row`,            '🔥');
export const GREEN_DAYS_ACHIEVEMENTS     = buildAchievements(GREEN_DAYS_MILESTONES,     'green_days',     'green_days',     n => n === 7 ? '1 Green Week' : n === 14 ? '2 Green Weeks' : `${n} Green Days`, n => `${n} profitable days in a row`, '💚');
export const PERFECT_TOTAL_ACHIEVEMENTS  = buildAchievements(PERFECT_TOTAL_MILESTONES,  'perfect_trades', 'perfect_total',  n => `${fmt(n)} Perfect Trade${n > 1 ? 's' : ''}`,  n => `Rated ${n} trade${n > 1 ? 's' : ''} with 5 stars`, '⭐');
export const PERFECT_STREAK_ACHIEVEMENTS = buildAchievements(PERFECT_STREAK_MILESTONES, 'perfect_trades', 'perfect_streak', n => `Perfect Streak ${n}`,         n => `${n} trades in a row rated 5 stars`,           '🌟');
export const RULE_STREAK_ACHIEVEMENTS    = buildAchievements(RULE_STREAK_MILESTONES,    'rule_streak',    'rule_streak',    n => n === 5 ? 'Rule Follower' : n === 10 ? 'Disciplined' : n === 20 ? 'Iron Rules' : `Rule Streak ${n}`, n => `${n} trades in a row with rating >= 4`, '🎯');
export const RULE_TOTAL_ACHIEVEMENTS     = buildAchievements(RULE_TOTAL_MILESTONES,     'rule_total',     'rule_total',     n => n === 50 ? 'Rule Master' : n === 500 ? 'Perfectionist' : `${fmt(n)} Quality Trades`, n => `${n} total trades with rating >= 4`, '📋');
export const ZEN_STREAK_ACHIEVEMENTS     = buildAchievements(ZEN_STREAK_MILESTONES,     'zen_streak',     'zen_streak',     n => `Zen Streak ${n}`,             n => `${n} trades in a row without a rating <= 2`,   '🧘');
export const STRATEGY_LOYAL_ACHIEVEMENTS = buildAchievements(STRATEGY_LOYAL_MILESTONES, 'strategy',       'strategy_loyal', n => `Strategy Loyal ${fmt(n)}`,    n => `${n} trades with the same strategy`,           '🏆');
export const CONSISTENCY_ACHIEVEMENTS    = buildAchievements(CONSISTENCY_MILESTONES,    'consistency',    'months_active',  n => n === 1 ? '1 Month Active' : n === 12 ? '1 Year Active' : n === 24 ? '2 Years Active' : `${n} Months Active`, n => `Traded actively for ${n} month${n > 1 ? 's' : ''}`, '🗓️');

export const STRATEGY_EXTRA_ACHIEVEMENTS: Achievement[] = assignTiers([
  { id: 'multi_strategy',      title: 'Multi-Strategy',      description: 'Created 3 different strategies',                      emoji: '📋', category: 'strategy' },
  { id: 'strategy_profitable', title: 'Strategy Profitable', description: 'One strategy with win rate >= 60% (min 20 trades)',   emoji: '📈', category: 'strategy' },
]);

// ─── Combined list ────────────────────────────────────────────────────────────

export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...FIRST_EVER_ACHIEVEMENTS,
  ...TRADE_COUNT_ACHIEVEMENTS,
  ...BEST_DAY_ACHIEVEMENTS,
  ...BEST_WEEK_ACHIEVEMENTS,
  ...BEST_MONTH_ACHIEVEMENTS,
  ...TOTAL_PNL_ACHIEVEMENTS,
  ...WIN_STREAK_ACHIEVEMENTS,
  ...GREEN_DAYS_ACHIEVEMENTS,
  ...PERFECT_TOTAL_ACHIEVEMENTS,
  ...PERFECT_STREAK_ACHIEVEMENTS,
  ...RULE_STREAK_ACHIEVEMENTS,
  ...RULE_TOTAL_ACHIEVEMENTS,
  ...ZEN_STREAK_ACHIEVEMENTS,
  ...STRATEGY_EXTRA_ACHIEVEMENTS,
  ...STRATEGY_LOYAL_ACHIEVEMENTS,
  ...CONSISTENCY_ACHIEVEMENTS,
];

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cw_achievements';

export function loadUnlockedAchievements(): UnlockedAchievements {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlocked: [], unlockedDates: {} };
    return JSON.parse(raw);
  } catch {
    return { unlocked: [], unlockedDates: {} };
  }
}

export function saveUnlockedAchievements(data: UnlockedAchievements): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Core calculation ─────────────────────────────────────────────────────────

export function calculateEarnedAchievementIds(trades: any[]): string[] {
  const earned: string[] = [];
  const closed = trades.filter(t => t.status === 'closed' || t.result);

  const totalPnl = closed.reduce((s, t) => s + Number(t.pnl ?? t.closedPnl ?? 0), 0);

  const byDate: Record<string, number> = {};
  closed.forEach(t => {
    const d = (t.date || '').slice(0, 10);
    if (d) byDate[d] = (byDate[d] ?? 0) + Number(t.pnl ?? t.closedPnl ?? 0);
  });

  const byWeek: Record<string, number> = {};
  closed.forEach(t => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return;
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const wk = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`;
    byWeek[key] = (byWeek[key] ?? 0) + Number(t.pnl ?? t.closedPnl ?? 0);
  });

  const byMonth: Record<string, number> = {};
  closed.forEach(t => {
    const d = (t.date || '').slice(0, 7);
    if (d) byMonth[d] = (byMonth[d] ?? 0) + Number(t.pnl ?? t.closedPnl ?? 0);
  });

  const byYear: Record<string, number> = {};
  closed.forEach(t => {
    const d = (t.date || '').slice(0, 4);
    if (d) byYear[d] = (byYear[d] ?? 0) + Number(t.pnl ?? t.closedPnl ?? 0);
  });

  const bestDay   = Math.max(0, ...Object.values(byDate));
  const bestWeek  = Math.max(0, ...Object.values(byWeek));
  const bestMonth = Math.max(0, ...Object.values(byMonth));

  // ── First Ever ──
  if (closed.length >= 1) earned.push('first_trade');
  if (closed.some(t => t.post_trade_note || t.postNote)) earned.push('first_note');
  if (closed.some(t => t.image_after_small_tf || t.image_before_small_tf || t.imageBeforeSmall || t.imageAfterSmall)) earned.push('first_screenshot');
  if (closed.some(t => t.trade_reflection)) earned.push('first_reflection');
  if (closed.some(t => t.checklist?.some((c: any) => c.done))) earned.push('first_checklist');

  try {
    const rawStr = localStorage.getItem('cw_strategies') || '[]';
    const strategies = JSON.parse(rawStr);
    if (strategies.length >= 1) earned.push('first_strategy');
    if (strategies.length >= 3) earned.push('multi_strategy');
  } catch { /* ignore */ }

  if (Object.values(byDate).some(v => v > 0))  earned.push('first_day_profit');
  if (Object.values(byWeek).some(v => v > 0))  earned.push('first_week_profit');
  if (Object.values(byMonth).some(v => v > 0)) earned.push('first_month_profit');
  if (Object.values(byYear).some(v => v > 0))  earned.push('first_year_profit');

  let s3 = 0;
  for (const t of closed) {
    if (t.result === 'win') { s3++; if (s3 >= 3) { earned.push('first_win_streak'); break; } }
    else s3 = 0;
  }

  const sortedDates = Object.keys(byDate).sort();
  let g3 = 0;
  for (const d of sortedDates) {
    if (byDate[d] > 0) { g3++; if (g3 >= 3) { earned.push('first_green_streak'); break; } }
    else g3 = 0;
  }

  if (closed.some(t => (t.rating ?? 0) >= 5)) earned.push('first_perfect_trade');
  if (closed.some(t => Number(t.closed_rrr ?? t.closedRrr ?? 0) >= 2)) earned.push('first_rrr2');
  if (localStorage.getItem('cw_cycle_settings')) earned.push('first_cycle');

  // ── Trade count ──
  TRADE_COUNT_MILESTONES.forEach(n => { if (closed.length >= n) earned.push(`trades_${n}`); });

  // ── PnL milestones ──
  PNL_DAY_MILESTONES.forEach(n   => { if (bestDay >= n)   earned.push(`best_day_${n}`); });
  PNL_WEEK_MILESTONES.forEach(n  => { if (bestWeek >= n)  earned.push(`best_week_${n}`); });
  PNL_MONTH_MILESTONES.forEach(n => { if (bestMonth >= n) earned.push(`best_month_${n}`); });
  TOTAL_PNL_MILESTONES.forEach(n => { if (totalPnl >= n)  earned.push(`total_pnl_${n}`); });

  // ── Win streak ──
  let maxWin = 0, cWin = 0;
  for (const t of closed) {
    if (t.result === 'win') { cWin++; maxWin = Math.max(maxWin, cWin); } else cWin = 0;
  }
  WIN_STREAK_MILESTONES.forEach(n => { if (maxWin >= n) earned.push(`win_streak_${n}`); });

  // ── Green days streak ──
  let maxGreen = 0, cGreen = 0;
  for (const d of sortedDates) {
    if (byDate[d] > 0) { cGreen++; maxGreen = Math.max(maxGreen, cGreen); } else cGreen = 0;
  }
  GREEN_DAYS_MILESTONES.forEach(n => { if (maxGreen >= n) earned.push(`green_days_${n}`); });

  // ── Perfect trades ──
  const perfectCount = closed.filter(t => (t.rating ?? 0) >= 5).length;
  PERFECT_TOTAL_MILESTONES.forEach(n => { if (perfectCount >= n) earned.push(`perfect_total_${n}`); });
  let maxPS = 0, cPS = 0;
  for (const t of closed) {
    if ((t.rating ?? 0) >= 5) { cPS++; maxPS = Math.max(maxPS, cPS); } else cPS = 0;
  }
  PERFECT_STREAK_MILESTONES.forEach(n => { if (maxPS >= n) earned.push(`perfect_streak_${n}`); });

  // ── Rule streak ──
  let maxRS = 0, cRS = 0;
  for (const t of closed) {
    if ((t.rating ?? 0) >= 4) { cRS++; maxRS = Math.max(maxRS, cRS); } else cRS = 0;
  }
  RULE_STREAK_MILESTONES.forEach(n => { if (maxRS >= n) earned.push(`rule_streak_${n}`); });
  const ruleTotal = closed.filter(t => (t.rating ?? 0) >= 4).length;
  RULE_TOTAL_MILESTONES.forEach(n => { if (ruleTotal >= n) earned.push(`rule_total_${n}`); });

  // ── Zen streak ──
  const rated = closed.filter(t => t.rating != null && t.rating > 0);
  let maxZen = 0, cZen = 0;
  for (const t of rated) {
    if ((t.rating ?? 0) > 2) { cZen++; maxZen = Math.max(maxZen, cZen); } else cZen = 0;
  }
  ZEN_STREAK_MILESTONES.forEach(n => { if (maxZen >= n) earned.push(`zen_streak_${n}`); });

  // ── Strategy ──
  const sMap: Record<string, { wins: number; total: number }> = {};
  closed.forEach(t => {
    if (!t.strategy) return;
    if (!sMap[t.strategy]) sMap[t.strategy] = { wins: 0, total: 0 };
    sMap[t.strategy].total++;
    if (t.result === 'win') sMap[t.strategy].wins++;
  });
  if (Object.values(sMap).some(s => s.total >= 20 && s.wins / s.total >= 0.6)) earned.push('strategy_profitable');
  const maxST = Math.max(0, ...Object.values(sMap).map(s => s.total));
  STRATEGY_LOYAL_MILESTONES.forEach(n => { if (maxST >= n) earned.push(`strategy_loyal_${n}`); });

  // ── Consistency ──
  const activeMonths = new Set(closed.map(t => (t.date || '').slice(0, 7)).filter(Boolean)).size;
  CONSISTENCY_MILESTONES.forEach(n => { if (activeMonths >= n) earned.push(`months_active_${n}`); });

  return [...new Set(earned)];
}

// ─── Check and unlock ─────────────────────────────────────────────────────────

export function checkAndUnlockAchievements(): Achievement[] {
  const trades = loadTradesFromLocalStorage();
  const earned = calculateEarnedAchievementIds(trades);
  const stored = loadUnlockedAchievements();
  const today  = new Date().toISOString().slice(0, 10);

  const newlyUnlocked: Achievement[] = [];
  earned.forEach(id => {
    if (!stored.unlocked.includes(id)) {
      stored.unlocked.push(id);
      stored.unlockedDates[id] = today;
      const a = ALL_ACHIEVEMENTS.find(a => a.id === id);
      if (a) newlyUnlocked.push(a);
    }
  });

  if (newlyUnlocked.length > 0) saveUnlockedAchievements(stored);
  return newlyUnlocked;
}

// ─── Progress helper ──────────────────────────────────────────────────────────

export function getCategoryProgress(
  category: AchievementCategory,
  trades: any[]
): { current: number; nextTarget: number | null; label: string } {
  const closed = trades.filter(t => t.status === 'closed' || t.result);

  const byDate: Record<string, number> = {};
  closed.forEach(t => { const d = (t.date || '').slice(0, 10); if (d) byDate[d] = (byDate[d] ?? 0) + Number(t.pnl ?? 0); });

  const byWeek: Record<string, number> = {};
  closed.forEach(t => {
    const d = new Date(t.date); if (isNaN(d.getTime())) return;
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const wk = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`;
    byWeek[key] = (byWeek[key] ?? 0) + Number(t.pnl ?? 0);
  });

  const byMonth: Record<string, number> = {};
  closed.forEach(t => { const d = (t.date || '').slice(0, 7); if (d) byMonth[d] = (byMonth[d] ?? 0) + Number(t.pnl ?? 0); });

  switch (category) {
    case 'trade_count': {
      const c = closed.length;
      return { current: c, nextTarget: TRADE_COUNT_MILESTONES.find(n => n > c) ?? null, label: 'trades' };
    }
    case 'best_day': {
      const c = Math.max(0, ...Object.values(byDate));
      return { current: c, nextTarget: PNL_DAY_MILESTONES.find(n => n > c) ?? null, label: '$' };
    }
    case 'best_week': {
      const c = Math.max(0, ...Object.values(byWeek));
      return { current: c, nextTarget: PNL_WEEK_MILESTONES.find(n => n > c) ?? null, label: '$' };
    }
    case 'best_month': {
      const c = Math.max(0, ...Object.values(byMonth));
      return { current: c, nextTarget: PNL_MONTH_MILESTONES.find(n => n > c) ?? null, label: '$' };
    }
    case 'total_pnl': {
      const c = closed.reduce((s, t) => s + Number(t.pnl ?? 0), 0);
      return { current: c, nextTarget: TOTAL_PNL_MILESTONES.find(n => n > c) ?? null, label: '$' };
    }
    case 'win_streak': {
      let mx = 0, cr = 0;
      for (const t of closed) { if (t.result === 'win') { cr++; mx = Math.max(mx, cr); } else cr = 0; }
      return { current: mx, nextTarget: WIN_STREAK_MILESTONES.find(n => n > mx) ?? null, label: 'wins in a row' };
    }
    case 'green_days': {
      const sd = Object.keys(byDate).sort(); let mx = 0, cr = 0;
      for (const d of sd) { if (byDate[d] > 0) { cr++; mx = Math.max(mx, cr); } else cr = 0; }
      return { current: mx, nextTarget: GREEN_DAYS_MILESTONES.find(n => n > mx) ?? null, label: 'profit days in a row' };
    }
    case 'perfect_trades': {
      const c = closed.filter(t => (t.rating ?? 0) >= 5).length;
      return { current: c, nextTarget: PERFECT_TOTAL_MILESTONES.find(n => n > c) ?? null, label: '5-star trades' };
    }
    case 'rule_streak': {
      let mx = 0, cr = 0;
      for (const t of closed) { if ((t.rating ?? 0) >= 4) { cr++; mx = Math.max(mx, cr); } else cr = 0; }
      return { current: mx, nextTarget: RULE_STREAK_MILESTONES.find(n => n > mx) ?? null, label: 'trades rated >= 4 in a row' };
    }
    case 'rule_total': {
      const c = closed.filter(t => (t.rating ?? 0) >= 4).length;
      return { current: c, nextTarget: RULE_TOTAL_MILESTONES.find(n => n > c) ?? null, label: 'quality trades' };
    }
    case 'zen_streak': {
      const rt = closed.filter(t => t.rating != null && t.rating > 0); let mx = 0, cr = 0;
      for (const t of rt) { if ((t.rating ?? 0) > 2) { cr++; mx = Math.max(mx, cr); } else cr = 0; }
      return { current: mx, nextTarget: ZEN_STREAK_MILESTONES.find(n => n > mx) ?? null, label: 'zen trades in a row' };
    }
    case 'consistency': {
      const c = new Set(closed.map(t => (t.date || '').slice(0, 7)).filter(Boolean)).size;
      return { current: c, nextTarget: CONSISTENCY_MILESTONES.find(n => n > c) ?? null, label: 'months active' };
    }
    default:
      return { current: 0, nextTarget: null, label: '' };
  }
}
