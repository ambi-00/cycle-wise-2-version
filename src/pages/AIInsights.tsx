import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, RefreshCw, Brain, ArrowRight, TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { usePaymentSuccess } from "@/hooks/use-payment-success";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";
import { useAppMode } from "@/hooks/use-app-mode";
import { generateDemoTrades } from "@/data/demo-data";
import { getCurrentCycleInfo, loadCycleSettings } from "@/lib/demoDataLoaders";
import { AIInsightsEngine, AIInsight, loadInsights, markInsightsAsRead } from "@/lib/aiInsightsEngine";
import { useAIInsightsAnalysis } from "@/hooks/use-ai-insights";

// ─── Unified feed card type ───────────────────────────────────────────────────
interface FeedCard {
  id: string;
  emoji: string;
  category: string;
  title: string;
  message: string;
  tip?: string;
  gradient: string;
  badgeColor: string;
  isNew: boolean;
  timestamp: number;
  stats?: { label: string; value: string }[];
}

// ─── Gradient / badge helpers ─────────────────────────────────────────────────
const IMPACT_GRADIENT: Record<string, string> = {
  Critical: "from-red-500/20 via-red-400/10 to-orange-500/10",
  High:     "from-amber-500/20 via-amber-400/10 to-yellow-400/10",
  Medium:   "from-secondary/50 to-accent/30",
  Low:      "from-emerald-500/15 via-teal-400/10 to-green-400/10",
  positive: "from-emerald-500/15 via-teal-400/10 to-green-400/10",
  phase:    "from-violet-500/20 via-purple-400/10 to-pink-500/10",
};

const IMPACT_BADGE: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-500",
  High:     "bg-amber-500/10 text-amber-600",
  Medium:   "bg-blue-500/10 text-blue-600",
  Low:      "bg-emerald-500/10 text-emerald-600",
  positive: "bg-emerald-500/10 text-emerald-600",
  phase:    "bg-violet-500/10 text-violet-600",
};

// ─── Cycle phase metadata (for phase-transition alert cards) ─────────────────
const PHASE_META: Record<string, { emoji: string; name: string; hormone: string; tip: string }> = {
  menstruation: {
    emoji: "❄️",
    name: "Menstruation",
    hormone: "Estrogen & progesterone are at their lowest",
    tip: "Prioritise quality over quantity. Great time to review past trades and prepare your watchlist.",
  },
  follicular: {
    emoji: "�",
    name: "Follicular",
    hormone: "Estrogen is rising steadily",
    tip: "Your sharpest cognitive phase. Great for learning new setups and making key decisions.",
  },
  ovulation: {
    emoji: "☀️",
    name: "Ovulation",
    hormone: "Estrogen peaks + LH surge",
    tip: "Watch for overconfidence. Pre-set your max daily loss limit before each session.",
  },
  luteal: {
    emoji: "�",
    name: "Luteal",
    hormone: "Progesterone rises then falls with estrogen",
    tip: "Late luteal increases emotional reactivity. Consider reducing position sizes in the final week.",
  },
};

// ─── Relative time helper ─────────────────────────────────────────────────────
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const hours = diff / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  return `${Math.floor(days / 7)} weeks ago`;
}

// ─── R-multiple helper ────────────────────────────────────────────────────────
function getR(t: any): number {
  const r = t.r_multiple !== undefined ? t.r_multiple : t.rMultiple;
  return typeof r === "number" ? r : 0;
}

// ─── Phase-transition alert cards ────────────────────────────────────────────
function buildPhaseCards(
  currentCycleDay: number | null,
  avgCycleLength: number,
  periodLength: number,
  now = Date.now()
): FeedCard[] {
  if (!currentCycleDay) return [];
  const cards: FeedCard[] = [];

  const follicularStart = periodLength + 1;
  const ovulationStart  = periodLength + 8;
  const lutealStart     = periodLength + 12;

  const phaseStarts: { day: number; key: string }[] = [
    { day: 1,               key: "menstruation" },
    { day: follicularStart, key: "follicular"   },
    { day: ovulationStart,  key: "ovulation"    },
    { day: lutealStart,     key: "luteal"       },
  ];

  for (const { day, key } of phaseStarts) {
    const daysUntil = day - currentCycleDay;
    const meta = PHASE_META[key];
    if (!meta) continue;

    if (daysUntil === 0 || daysUntil === -1) {
      cards.push({
        id: `phase_start_${key}`,
        emoji: meta.emoji,
        category: "Cycle Phase",
        title: `You've entered ${meta.name}`,
        message: `${meta.hormone}. This is your current hormonal environment.`,
        tip: meta.tip,
        gradient: IMPACT_GRADIENT.phase,
        badgeColor: IMPACT_BADGE.phase,
        isNew: true,
        timestamp: now - 30 * 60 * 1000,
      });
    } else if (daysUntil > 0 && daysUntil <= 2) {
      cards.push({
        id: `phase_upcoming_${key}`,
        emoji: meta.emoji,
        category: "Cycle Alert",
        title: `${meta.name} starts in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
        message: `${meta.hormone}. Prepare your approach for the phase shift ahead.`,
        tip: meta.tip,
        gradient: IMPACT_GRADIENT.phase,
        badgeColor: IMPACT_BADGE.phase,
        isNew: true,
        timestamp: now - 60 * 60 * 1000,
      });
    }
  }

  return cards;
}

// ─── Pattern analysis → FeedCards ────────────────────────────────────────────
function buildPatternCards(trades: any[], now = Date.now()): FeedCard[] {
  const cards: FeedCard[] = [];
  const closed = trades.filter(
    (t) => t.status === "closed" && (t.result === "win" || t.result === "loss")
  );
  if (closed.length < 10) return cards;

  const wins    = closed.filter((t) => t.result === "win").length;
  const winRate = (wins / closed.length) * 100;
  const totalR  = closed.reduce((s, t) => s + getR(t), 0);
  const avgR    = totalR / closed.length;

  // ── 1. Overall performance (20+ trades) ───────────────────────────────────
  if (closed.length >= 20) {
    const impact = winRate >= 55 && avgR > 0 ? "positive" : avgR < 0 ? "High" : "Medium";
    cards.push({
      id: "overall_perf",
      emoji: winRate >= 55 && avgR > 0 ? "📈" : "📊",
      category: "Performance",
      title: winRate >= 55 && avgR > 0 ? "Positive Overall Performance" : "Performance Overview",
      message: `Across ${closed.length} closed trades: ${winRate.toFixed(0)}% win rate, avg ${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R per trade.`,
      tip:
        winRate >= 55 && avgR > 0
          ? "Your edge is statistically confirmed. Keep your rules strict and let it play out."
          : avgR < 0
          ? "Review your RRR — a positive win rate with negative average R suggests premature profit-taking or oversized stops."
          : "Build more sample size to confirm your edge.",
      gradient:   IMPACT_GRADIENT[impact],
      badgeColor: IMPACT_BADGE[impact],
      isNew: false,
      timestamp: now - 2 * 60 * 60 * 1000,
    });
  }

  // ── 2. Instrument analysis ─────────────────────────────────────────────────
  const byInstrument: Record<string, { wins: number; losses: number; totalR: number }> = {};
  closed.forEach((t) => {
    const inst = (t.symbol || t.instrument || "Unknown").toUpperCase();
    if (!byInstrument[inst]) byInstrument[inst] = { wins: 0, losses: 0, totalR: 0 };
    if (t.result === "win") byInstrument[inst].wins++;
    else byInstrument[inst].losses++;
    byInstrument[inst].totalR += getR(t);
  });
  const instrStats = Object.entries(byInstrument)
    .filter(([, s]) => s.wins + s.losses >= 3)
    .map(([name, s]) => ({
      name,
      total: s.wins + s.losses,
      winRate: (s.wins / (s.wins + s.losses)) * 100,
      avgR: s.totalR / (s.wins + s.losses),
    }));
  const worstInstr = [...instrStats].sort((a, b) => a.winRate - b.winRate)[0];
  const bestInstr  = [...instrStats].sort((a, b) => b.winRate - a.winRate)[0];

  if (worstInstr && worstInstr.winRate < 40) {
    const sev = worstInstr.winRate < 30 ? "Critical" : "High";
    cards.push({
      id: `instr_loss_${worstInstr.name}`,
      emoji: "📉",
      category: "Instrument Pattern",
      title: `${worstInstr.name}: Consistent Losses`,
      message: `Only ${worstInstr.winRate.toFixed(0)}% win rate across ${worstInstr.total} trades on ${worstInstr.name} (avg ${worstInstr.avgR.toFixed(2)}R).`,
      tip: `Pause ${worstInstr.name} and analyse your approach. Consider removing it temporarily from your watchlist.`,
      gradient:   IMPACT_GRADIENT[sev],
      badgeColor: IMPACT_BADGE[sev],
      isNew: false,
      timestamp: now - 5 * 60 * 60 * 1000,
      stats: [
        { label: "Win Rate", value: `${worstInstr.winRate.toFixed(0)}%`   },
        { label: "Avg R",    value: `${worstInstr.avgR.toFixed(2)}R`      },
        { label: "Trades",   value: `${worstInstr.total}`                 },
      ],
    });
  }
  if (bestInstr && bestInstr.winRate >= 65 && bestInstr.total >= 4 && bestInstr.name !== worstInstr?.name) {
    cards.push({
      id: `instr_strength_${bestInstr.name}`,
      emoji: "💎",
      category: "Instrument Strength",
      title: `${bestInstr.name}: Your Best Instrument`,
      message: `${bestInstr.winRate.toFixed(0)}% win rate across ${bestInstr.total} trades — your proven edge.`,
      tip: `Prioritise ${bestInstr.name} in your sessions. Your edge here is statistically confirmed.`,
      gradient:   IMPACT_GRADIENT.positive,
      badgeColor: IMPACT_BADGE.positive,
      isNew: false,
      timestamp: now - 4 * 60 * 60 * 1000,
      stats: [
        { label: "Win Rate", value: `${bestInstr.winRate.toFixed(0)}%`    },
        { label: "Avg R",    value: `+${bestInstr.avgR.toFixed(2)}R`      },
        { label: "Trades",   value: `${bestInstr.total}`                  },
      ],
    });
  }

  // ── 3. Strategy analysis ───────────────────────────────────────────────────
  const byStrategy: Record<string, { wins: number; losses: number; totalR: number }> = {};
  closed.forEach((t) => {
    const strat = t.strategy || "No Strategy";
    if (!byStrategy[strat]) byStrategy[strat] = { wins: 0, losses: 0, totalR: 0 };
    if (t.result === "win") byStrategy[strat].wins++;
    else byStrategy[strat].losses++;
    byStrategy[strat].totalR += getR(t);
  });
  const stratStats = Object.entries(byStrategy)
    .filter(([, s]) => s.wins + s.losses >= 3)
    .map(([name, s]) => ({
      name,
      total: s.wins + s.losses,
      winRate: (s.wins / (s.wins + s.losses)) * 100,
      avgR: s.totalR / (s.wins + s.losses),
    }));
  const worstStrat = [...stratStats].sort((a, b) => a.winRate - b.winRate)[0];
  const bestStrat  = [...stratStats].sort((a, b) => b.winRate - a.winRate)[0];

  if (worstStrat && worstStrat.winRate < 40 && stratStats.length >= 2) {
    cards.push({
      id: `strat_loss_${worstStrat.name}`,
      emoji: "⚙️",
      category: "Strategy Pattern",
      title: `"${worstStrat.name}" is Underperforming`,
      message: `${worstStrat.winRate.toFixed(0)}% win rate on ${worstStrat.total} trades — significantly below your average.`,
      tip: `Review the rules for "${worstStrat.name}". Is it suited to current market conditions?`,
      gradient:   IMPACT_GRADIENT.High,
      badgeColor: IMPACT_BADGE.High,
      isNew: false,
      timestamp: now - 6 * 60 * 60 * 1000,
      stats: [
        { label: "Win Rate", value: `${worstStrat.winRate.toFixed(0)}%`  },
        { label: "Avg R",    value: `${worstStrat.avgR.toFixed(2)}R`     },
        { label: "Trades",   value: `${worstStrat.total}`                },
      ],
    });
  }
  if (bestStrat && bestStrat.winRate >= 60 && bestStrat.total >= 5) {
    cards.push({
      id: `strat_strength_${bestStrat.name}`,
      emoji: "⭐",
      category: "Strategy Strength",
      title: `"${bestStrat.name}": Your Strongest Setup`,
      message: `${bestStrat.winRate.toFixed(0)}% win rate across ${bestStrat.total} trades — your best-performing strategy.`,
      tip: `Stick to "${bestStrat.name}" during uncertain conditions. Your edge here is statistically real.`,
      gradient:   IMPACT_GRADIENT.positive,
      badgeColor: IMPACT_BADGE.positive,
      isNew: false,
      timestamp: now - 7 * 60 * 60 * 1000,
      stats: [
        { label: "Win Rate", value: `${bestStrat.winRate.toFixed(0)}%`  },
        { label: "Avg R",    value: `+${bestStrat.avgR.toFixed(2)}R`    },
        { label: "Trades",   value: `${bestStrat.total}`                },
      ],
    });
  }

  // ── 4. Day-of-week analysis ────────────────────────────────────────────────
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const byDay: Record<number, { wins: number; losses: number }> = {};
  closed.forEach((t) => {
    if (!t.date) return;
    const parts = t.date.split("-");
    if (parts.length !== 3) return;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return;
    const day = d.getDay();
    if (!byDay[day]) byDay[day] = { wins: 0, losses: 0 };
    if (t.result === "win") byDay[day].wins++;
    else byDay[day].losses++;
  });
  const dayStats = Object.entries(byDay)
    .filter(([, s]) => s.wins + s.losses >= 3)
    .map(([dayNum, s]) => ({
      day:     DAY_NAMES[Number(dayNum)],
      total:   s.wins + s.losses,
      winRate: (s.wins / (s.wins + s.losses)) * 100,
    }));
  const worstDay = [...dayStats].sort((a, b) => a.winRate - b.winRate)[0];
  const bestDay  = [...dayStats].sort((a, b) => b.winRate - a.winRate)[0];

  if (worstDay && worstDay.winRate < 35 && worstDay.total >= 4) {
    cards.push({
      id: `day_loss_${worstDay.day}`,
      emoji: "📅",
      category: "Day Pattern",
      title: `${worstDay.day}s: Your Worst Trading Day`,
      message: `Only ${worstDay.winRate.toFixed(0)}% win rate across ${worstDay.total} ${worstDay.day} trades.`,
      tip: `Consider skipping or reducing position size on ${worstDay.day}s. Your edge may not be active this day.`,
      gradient:   IMPACT_GRADIENT.High,
      badgeColor: IMPACT_BADGE.High,
      isNew: false,
      timestamp: now - 8 * 60 * 60 * 1000,
      stats: [
        { label: "Win Rate", value: `${worstDay.winRate.toFixed(0)}%` },
        { label: "Trades",   value: `${worstDay.total}`               },
      ],
    });
  }
  if (bestDay && bestDay.winRate >= 65 && bestDay.total >= 4 && bestDay.day !== worstDay?.day) {
    cards.push({
      id: `day_strength_${bestDay.day}`,
      emoji: "✅",
      category: "Day Pattern",
      title: `${bestDay.day}s: Your Peak Trading Day`,
      message: `${bestDay.winRate.toFixed(0)}% win rate across ${bestDay.total} trades — ${bestDay.day}s consistently produce your best results.`,
      tip: `Prioritise high-quality setups on ${bestDay.day}s. Be more selective on other days.`,
      gradient:   IMPACT_GRADIENT.positive,
      badgeColor: IMPACT_BADGE.positive,
      isNew: false,
      timestamp: now - 9 * 60 * 60 * 1000,
      stats: [
        { label: "Win Rate", value: `${bestDay.winRate.toFixed(0)}%` },
        { label: "Trades",   value: `${bestDay.total}`               },
      ],
    });
  }

  // ── 5. Consecutive-loss behaviour (revenge trading) ────────────────────────
  const sorted = [...closed].sort(
    (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
  );
  let consecutiveLosses = 0;
  let tradesAfterTwoLosses = 0;
  let winsAfterTwoLosses = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].result === "loss") consecutiveLosses++;
    else consecutiveLosses = 0;
    if (consecutiveLosses >= 2 && i + 1 < sorted.length) {
      tradesAfterTwoLosses++;
      if (sorted[i + 1].result === "win") winsAfterTwoLosses++;
    }
  }
  if (tradesAfterTwoLosses >= 5) {
    const wr = (winsAfterTwoLosses / tradesAfterTwoLosses) * 100;
    if (wr < 40) {
      cards.push({
        id: "consecutive_losses",
        emoji: "🔁",
        category: "Psychology Alert",
        title: "Revenge Trading Detected",
        message: `After 2 consecutive losses, your next trade only wins ${wr.toFixed(0)}% of the time — well below your average.`,
        tip: "Create a hard rule: after 2 losses in any session, close your platform. Your data shows your edge is gone at this point.",
        gradient:   IMPACT_GRADIENT.Critical,
        badgeColor: IMPACT_BADGE.Critical,
        isNew: false,
        timestamp: now - 10 * 60 * 60 * 1000,
        stats: [
          { label: "Post-Loss Win Rate", value: `${wr.toFixed(0)}%`        },
          { label: "Times Detected",     value: `${tradesAfterTwoLosses}x` },
        ],
      });
    }
  }

  // ── 6. Post-win-streak overconfidence ──────────────────────────────────────
  let winStreak = 0;
  let tradesAfterStreak = 0;
  let winsAfterStreak = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    winStreak = sorted[i].result === "win" ? winStreak + 1 : 0;
    if (winStreak >= 3) {
      tradesAfterStreak++;
      if (sorted[i + 1].result === "win") winsAfterStreak++;
    }
  }
  if (tradesAfterStreak >= 5) {
    const wrStreak = (winsAfterStreak / tradesAfterStreak) * 100;
    if (wrStreak < winRate - 15) {
      cards.push({
        id: "post_win_streak",
        emoji: "🎯",
        category: "Psychology Alert",
        title: "Win Streak → Performance Drop",
        message: `After 3+ wins in a row, your next trade wins only ${wrStreak.toFixed(0)}% (vs ${winRate.toFixed(0)}% overall). Overconfidence detected.`,
        tip: "After 3 wins in a row, take an extra 30 minutes before the next trade. Review the setup with fresh eyes.",
        gradient:   IMPACT_GRADIENT.High,
        badgeColor: IMPACT_BADGE.High,
        isNew: false,
        timestamp: now - 11 * 60 * 60 * 1000,
        stats: [
          { label: "Post-Streak WR", value: `${wrStreak.toFixed(0)}%` },
          { label: "Overall WR",     value: `${winRate.toFixed(0)}%`  },
          { label: "Detected",       value: `${tradesAfterStreak}x`   },
        ],
      });
    }
  }

  // ── 7. RRR asymmetry ──────────────────────────────────────────────────────
  const winTrades  = closed.filter((t) => t.result === "win");
  const lossTrades = closed.filter((t) => t.result === "loss");
  const avgWinR    = winTrades.length
    ? winTrades.reduce((s, t) => s + Math.abs(getR(t)), 0) / winTrades.length
    : 0;
  const avgLossR   = lossTrades.length
    ? Math.abs(lossTrades.reduce((s, t) => s + getR(t), 0) / lossTrades.length)
    : 1;
  if (avgWinR > 0 && avgLossR > 0 && avgWinR / avgLossR >= 1.8) {
    cards.push({
      id: "rrr_strength",
      emoji: "⚖️",
      category: "Risk/Reward",
      title: "Excellent Risk/Reward Asymmetry",
      message: `Wins average +${avgWinR.toFixed(2)}R, losses average only -${avgLossR.toFixed(2)}R — a ${(avgWinR / avgLossR).toFixed(1)}:1 ratio.`,
      tip: "Never widen your stop out of fear and never cut winners early. This R:R discipline is your professional edge.",
      gradient:   IMPACT_GRADIENT.positive,
      badgeColor: IMPACT_BADGE.positive,
      isNew: false,
      timestamp: now - 12 * 60 * 60 * 1000,
      stats: [
        { label: "Avg Win",  value: `+${avgWinR.toFixed(2)}R`               },
        { label: "Avg Loss", value: `-${avgLossR.toFixed(2)}R`              },
        { label: "Ratio",    value: `${(avgWinR / avgLossR).toFixed(1)}:1`  },
      ],
    });
  }

  // ── 8. All clear ──────────────────────────────────────────────────────────
  const critCount = cards.filter((c) => c.gradient.includes("red")).length;
  if (critCount === 0 && closed.length >= 10) {
    cards.push({
      id: "all_clear",
      emoji: "🌟",
      category: "Overall",
      title: "No Significant Loss Patterns Found",
      message: `Across all ${closed.length} analysed trades, no major recurring loss patterns were detected.`,
      tip: "Keep your current rules and risk management strict. Consistency is your biggest asset right now.",
      gradient:   IMPACT_GRADIENT.positive,
      badgeColor: IMPACT_BADGE.positive,
      isNew: false,
      timestamp: now - 13 * 60 * 60 * 1000,
      stats: [
        { label: "Win Rate",       value: `${winRate.toFixed(0)}%`                     },
        { label: "Avg R",          value: `${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R` },
        { label: "Trades Checked", value: `${closed.length}`                           },
      ],
    });
  }

  // Sort: warning/loss patterns first, then strengths
  return cards.sort((a, b) => {
    const aIsBad = a.gradient.includes("red") || a.gradient.includes("amber");
    const bIsBad = b.gradient.includes("red") || b.gradient.includes("amber");
    if (aIsBad && !bIsBad) return -1;
    if (!aIsBad && bIsBad) return 1;
    return 0;
  });
}

// ─── Convert engine AIInsight → FeedCard ─────────────────────────────────────
function engineToFeedCard(insight: AIInsight): FeedCard {
  const impact = insight.impact in IMPACT_GRADIENT ? insight.impact : "Medium";
  return {
    id:         insight.id,
    emoji:      insight.icon || "🧠",
    category:   insight.category.charAt(0).toUpperCase() + insight.category.slice(1),
    title:      insight.title,
    message:    insight.insight,
    tip:        insight.actionable,
    gradient:   IMPACT_GRADIENT[impact],
    badgeColor: IMPACT_BADGE[impact],
    isNew:      insight.isNew,
    timestamp:  new Date(insight.createdAt).getTime(),
  };
}

// ─── InsightFeedCard component ────────────────────────────────────────────────
function InsightFeedCard({ card, index }: { card: FeedCard; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const accentBorder = card.gradient.includes("red")
    ? "border-l-red-400/80"
    : card.gradient.includes("amber")
    ? "border-l-amber-400/80"
    : card.gradient.includes("violet") || card.gradient.includes("purple")
    ? "border-l-violet-400/80"
    : card.gradient.includes("emerald") || card.gradient.includes("teal")
    ? "border-l-emerald-400/80"
    : "border-l-primary/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`rounded-2xl bg-card shadow-card p-5 cursor-pointer select-none border border-border/50 border-l-4 ${accentBorder}`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0 mt-0.5">{card.emoji}</div>
        <div className="flex-1 min-w-0">
          {/* Category badge + NEW tag */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${card.badgeColor}`}
            >
              {card.category}
            </span>
            {card.isNew && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold animate-pulse">
                NEW
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="font-semibold text-foreground text-sm leading-snug">{card.title}</h4>

          {/* Message */}
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{card.message}</p>

          {/* Expanded content */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-3 overflow-hidden"
            >
              {card.tip && (
                <div className="rounded-xl bg-muted/50 border border-border/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    💡 Action
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{card.tip}</p>
                </div>
              )}
              {card.stats && card.stats.length > 0 && (
                <div className={`grid gap-2 ${card.stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {card.stats.map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-muted/50 p-2.5 text-center">
                      <p className="text-sm font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground/60">{relativeTime(card.timestamp)}</span>
        <span className="text-xs text-muted-foreground/60">
          {expanded ? "↑ collapse" : "↓ details"}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AIInsights() {
  const navigate = useNavigate();
  const { loading: subLoading, hasFeature } = useSubscription();
  const { appMode } = useAppMode();
  const isDemo = appMode === 'DEMO';
  usePaymentSuccess();

  const [storedTrades,   setStoredTrades]   = useState<any[]>([]);
  const [engineInsights, setEngineInsights] = useState<AIInsight[]>([]);
  const [cycleDay,       setCycleDay]       = useState<number | null>(null);
  const [avgCycleLen,    setAvgCycleLen]    = useState(28);
  const [periodLen,      setPeriodLen]      = useState(5);
  const [isRunning,      setIsRunning]      = useState(false);

  // Effective trade list
  const trades = useMemo(
    () => (isDemo ? generateDemoTrades() : storedTrades),
    [isDemo, storedTrades]
  );

  const analysisInsights = useAIInsightsAnalysis(trades);

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDemo) setStoredTrades(loadTradesFromLocalStorage());

    const cycleInfo = getCurrentCycleInfo();
    if (cycleInfo?.cycleDay) setCycleDay(cycleInfo.cycleDay);

    const { avgCycleLength, periodLength } = loadCycleSettings();
    if (avgCycleLength) setAvgCycleLen(avgCycleLength);
    if (periodLength)   setPeriodLen(periodLength);

    const stored = loadInsights();
    setEngineInsights(stored);
    markInsightsAsRead();
  }, [isDemo]);

  // ── Daily analysis trigger ────────────────────────────────────────────────
  useEffect(() => {
    const closed = trades.filter((t) => t.status === "closed");
    if (closed.length < 10) return;

    const lastRun   = localStorage.getItem("cw_last_daily_insight");
    const now       = Date.now();
    const shouldRun = !lastRun || now - Number(lastRun) > 23 * 60 * 60 * 1000;
    if (!shouldRun) return;

    setIsRunning(true);
    setTimeout(() => {
      try {
        const engine = new AIInsightsEngine(closed as any);
        if (engine.shouldRunWeeklyAnalysis()) {
          const fresh    = engine.generateInsights();
          const existing = loadInsights();
          const merged   = [
            ...fresh,
            ...existing.filter((e) => !fresh.find((n) => n.id === e.id)),
          ].slice(0, 60);
          localStorage.setItem("cw_ai_insights", JSON.stringify(merged));
          setEngineInsights(merged);
        }
      } finally {
        localStorage.setItem("cw_last_daily_insight", String(now));
        setIsRunning(false);
      }
    }, 1500);
  }, [trades]);

  // ── Build feed ────────────────────────────────────────────────────────────
  const feed = useMemo<FeedCard[]>(() => {
    const now = Date.now();
    const all: FeedCard[] = [];

    // 1. Phase alerts (freshest)
    all.push(...buildPhaseCards(cycleDay, avgCycleLen, periodLen, now));

    // 2. Engine insights (weekly deep analysis)
    engineInsights.forEach((ins) => all.push(engineToFeedCard(ins)));

    // 3. Inline pattern analysis
    all.push(...buildPatternCards(trades, now));

    // 4. useAIInsightsAnalysis (priority ≥ 3)
    analysisInsights
      .filter((ins) => ins.priority >= 3)
      .forEach((ins) => {
        const impactMap: Record<string, string> = {
          critical:       "Critical",
          warning:        "High",
          recommendation: "Medium",
          success:        "positive",
        };
        const impact = impactMap[ins.type] || "Medium";
        all.push({
          id:         `analysis_${ins.category}_${ins.priority}`,
          emoji:      ins.type === "critical" ? "🚨" : ins.type === "warning" ? "⚠️" : ins.type === "success" ? "✅" : "💡",
          category:   ins.category || "Analysis",
          title:      ins.category,
          message:    ins.message,
          gradient:   IMPACT_GRADIENT[impact],
          badgeColor: IMPACT_BADGE[impact],
          isNew:      false,
          timestamp:  now - 3 * 60 * 60 * 1000,
        });
      });

    // Deduplicate by id
    const seen   = new Set<string>();
    const unique = all.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    // Sort: NEW first, then newest timestamp
    return unique.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [cycleDay, avgCycleLen, periodLen, engineInsights, trades, analysisInsights]);

  const closedTrades  = trades.filter((t) => t.status === "closed");
  const hasEnoughData = closedTrades.length >= 10;
  const newCount      = feed.filter((c) => c.isNew).length;
  const lastAnalysis  = localStorage.getItem("cw_last_daily_insight");

  // ── Premium gate ──────────────────────────────────────────────────────────
  const isPremium = hasFeature('ai_insights_weekly');

  if (!subLoading && !isPremium && !isDemo) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <div className="text-center max-w-sm">
          <Sparkles className="mx-auto h-10 w-10 text-primary mb-4" />
          <h2 className="text-xl font-bold text-foreground">AI Insights</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Unlock personalised AI-powered pattern detection, cycle intelligence, and daily trading
            insights with a Premium subscription.
          </p>
          <Button className="mt-6" onClick={() => navigate("/pricing")}>
            Upgrade to Premium <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="mx-auto max-w-4xl px-4 py-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Personalised analysis · Updated daily
            </p>
          </div>
          {isRunning && (
            <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-card">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Analysing…
            </div>
          )}
        </motion.div>

        {/* Summary strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 grid grid-cols-3 gap-3"
        >
          {[
            { label: "Total Insights", value: feed.length > 0 ? String(feed.length) : "—" },
            { label: "New",            value: newCount > 0 ? `${newCount} new` : "All read" },
            {
              label: "Last Analysis",
              value: lastAnalysis ? relativeTime(Number(lastAnalysis)) : "Not yet",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-card p-4 shadow-card text-center border border-border/50"
            >
              <p className="text-base font-bold text-foreground leading-tight">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Not-enough-data banner */}
        {!hasEnoughData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 border border-primary/20 p-5"
          >
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {closedTrades.length < 10
                    ? `Log ${10 - closedTrades.length} more trade${
                        10 - closedTrades.length !== 1 ? "s" : ""
                      } to activate AI analysis`
                    : "Keep logging to improve accuracy"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  AI analysis runs automatically once you have 10+ closed trades. The more you log,
                  the more precise your insights become.
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (closedTrades.length / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {closedTrades.length} / 10 closed trades
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate("/journal")}
                >
                  Log a Trade <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Insight feed */}
        {feed.length > 0 ? (
          <div className="space-y-4">
            {feed.map((card, i) => (
              <InsightFeedCard key={card.id} card={card} index={i} />
            ))}
          </div>
        ) : hasEnoughData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center gap-4 py-20 text-center"
          >
            <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <h3 className="font-semibold text-foreground">No insights yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI analysis runs daily. Check back tomorrow for your personalised insights.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsRunning(true);
                setTimeout(() => {
                  const engine = new AIInsightsEngine(closedTrades as any);
                  const fresh  = engine.generateInsights();
                  localStorage.setItem("cw_ai_insights", JSON.stringify(fresh));
                  localStorage.setItem("cw_last_daily_insight", String(Date.now()));
                  setEngineInsights(fresh);
                  setIsRunning(false);
                }, 1000);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Now
            </Button>
          </motion.div>
        ) : null}

        {/* Footer */}
        {hasEnoughData && feed.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>
              Based on {closedTrades.length} closed trades · New patterns detected automatically
            </span>
          </motion.div>
        )}
      </div>
    </main>
  );
}
