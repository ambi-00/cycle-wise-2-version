import { motion } from "framer-motion";
import {
  Sparkles, TrendingUp, TrendingDown, Target, Brain, ArrowRight, Lock,
  Moon, BookOpen, BarChart2, Lightbulb, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import IntelligentAIInsights from "@/components/IntelligentAIInsights";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import { usePaymentSuccess } from "@/hooks/use-payment-success";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";
import { useAppMode } from "@/hooks/use-app-mode";
import { generateDemoTrades } from "@/data/demo-data";
import { getCurrentCycleInfo } from "@/lib/demoDataLoaders";
import { AIInsightsEngine, AIInsight } from "@/lib/aiInsightsEngine";

// ─── Cycle Phase Science ─────────────────────────────────────────────────────

type PhaseKey = "menstruation" | "follicular" | "ovulation" | "luteal";

const CYCLE_PHASE_INFO: Record<
  PhaseKey,
  {
    emoji: string;
    name: string;
    days: string;
    borderColor: string;
    bgColor: string;
    badgeColor: string;
    hormone: string;
    mental: string;
    trading: string;
    tip: string;
  }
> = {
  menstruation: {
    emoji: "🌑",
    name: "Menstruation",
    days: "Days 1–5",
    borderColor: "border-red-400",
    bgColor: "bg-red-500/5",
    badgeColor: "bg-red-500/10 text-red-500",
    hormone: "Estrogen & progesterone are at their lowest levels",
    mental:
      "Introspection, detail-focus, lower physical energy, heightened self-awareness. Emotionally you may feel more sensitive or withdrawn.",
    trading:
      "Risk tolerance often decreases naturally. This can actually protect you from impulsive trades — analytical clarity can be sharp, but emotional resilience is lower. Ideal for reviewing trades and preparing watchlists rather than heavy trading.",
    tip: "Pre-plan setups during this phase. Prioritise quality over quantity, and use this time to journal past trades.",
  },
  follicular: {
    emoji: "🌱",
    name: "Follicular",
    days: "Days 6–13",
    borderColor: "border-emerald-400",
    bgColor: "bg-emerald-500/5",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    hormone: "Estrogen is rising steadily",
    mental:
      "Energy and optimism increase, sharper focus, better memory and creativity. Confidence builds gradually. You feel more curious and motivated to learn.",
    trading:
      "Cognitively your best phase. Great for learning new strategies, backtesting, and making important long-term decisions. Decision-making quality is high.",
    tip: "Leverage this phase — dig into statistics, study new setups, and set your trading intentions for the cycle ahead.",
  },
  ovulation: {
    emoji: "🌕",
    name: "Ovulation",
    days: "Days 14–16",
    borderColor: "border-amber-400",
    bgColor: "bg-amber-500/5",
    badgeColor: "bg-amber-500/10 text-amber-600",
    hormone: "Estrogen peaks + LH surge",
    mental:
      "Peak confidence, high energy, competitive drive, heightened communication. You feel at your most capable — and you often are.",
    trading:
      "Risk tolerance is at its highest. Your confidence can work in your favour — but watch for overconfidence, oversizing, and overtrading. The market doesn't respond to your mood.",
    tip: "Stick strictly to your risk rules. Pre-set your max daily loss limit before you start trading to guard against overconfidence.",
  },
  luteal: {
    emoji: "🌘",
    name: "Luteal",
    days: "Days 17–28",
    borderColor: "border-violet-400",
    bgColor: "bg-violet-500/5",
    badgeColor: "bg-violet-500/10 text-violet-600",
    hormone: "Progesterone rises then falls with estrogen",
    mental:
      "Early luteal can feel calm and focused. Late luteal often brings anxiety, irritability, lower serotonin, and emotional sensitivity (PMS). Decision fatigue increases.",
    trading:
      "Higher emotional reactivity is possible in late luteal. Fear of loss and revenge-trading risk both elevate. However, some traders actually perform better early in this phase due to natural caution.",
    tip: "Consider reducing position sizes in late luteal (days 22–28). Journal your emotional state before each trade and pause if you feel reactive.",
  },
};

function normalizePhase(raw?: string): PhaseKey | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("menstr")) return "menstruation";
  if (lower.includes("follic")) return "follicular";
  if (lower.includes("ovul")) return "ovulation";
  if (lower.includes("luteal") || lower.includes("lutein")) return "luteal";
  return null;
}

// ─── Per-phase trade stats ────────────────────────────────────────────────────
interface PhaseStats {
  phase: PhaseKey;
  count: number;
  winRate: number;
  avgR: number;
  hasData: boolean;
}

function computePhaseStats(trades: any[]): PhaseStats[] {
  return (["menstruation", "follicular", "ovulation", "luteal"] as PhaseKey[]).map(
    (phase) => {
      const phaseTrades = trades.filter(
        (t) => normalizePhase(t.cyclePhase || t.cycle_phase) === phase
      );
      const wins = phaseTrades.filter((t) => t.result === "win").length;
      const totalR = phaseTrades.reduce((sum, t) => {
        const r = t.closed_rrr ?? t.r_multiple ?? t.rMultiple ?? 0;
        return sum + Number(r);
      }, 0);
      return {
        phase,
        count: phaseTrades.length,
        winRate: phaseTrades.length ? (wins / phaseTrades.length) * 100 : 0,
        avgR: phaseTrades.length ? totalR / phaseTrades.length : 0,
        hasData: phaseTrades.length >= 3,
      };
    }
  );
}

// ─── Profitability Analysis ──────────────────────────────────────────────────
interface ProfitabilityItem {
  id: string;
  type: "loss_pattern" | "strength";
  severity: "critical" | "warning" | "positive";
  emoji: string;
  category: string;
  title: string;
  detail: string;
  tip: string;
  stats?: { label: string; value: string }[];
}

function getR(t: any): number {
  const r = t.closed_rrr ?? t.r_multiple ?? t.rMultiple ?? 0;
  return Number(r) || 0;
}

function analyzeProfitability(trades: any[]): ProfitabilityItem[] {
  const closed = trades.filter((t) => t.result === "win" || t.result === "loss");
  if (closed.length < 10) return [];
  const items: ProfitabilityItem[] = [];

  const wins = closed.filter((t) => t.result === "win").length;
  const losses = closed.filter((t) => t.result === "loss").length;
  const winRate = (wins / closed.length) * 100;
  const totalR = closed.reduce((sum, t) => sum + getR(t), 0);
  const avgR = totalR / closed.length;

  // ── 1. Overall profitability ──────────────────────────────────────────────
  if (avgR >= 0.3 && winRate >= 50) {
    items.push({
      id: "overall_positive",
      type: "strength",
      severity: "positive",
      emoji: "🏆",
      category: "Overall",
      title: "Overall Performance is Profitable",
      detail: `${winRate.toFixed(0)}% win rate with an average of +${avgR.toFixed(2)}R per trade across ${closed.length} trades. You're on the right track.`,
      tip: "Keep your current approach consistent. Don't change what's working — protect your edge.",
      stats: [
        { label: "Win Rate", value: `${winRate.toFixed(0)}%` },
        { label: "Avg R", value: `+${avgR.toFixed(2)}R` },
        { label: "Trades", value: `${closed.length}` },
      ],
    });
  } else if (avgR < 0) {
    items.push({
      id: "overall_negative",
      type: "loss_pattern",
      severity: "critical",
      emoji: "🚨",
      category: "Overall",
      title: "Net Negative R — Trades Are Costing You",
      detail: `Your average R per trade is ${avgR.toFixed(2)}R across ${closed.length} trades. Over time this is unsustainable. Review all patterns below.`,
      tip: "Stop trading at normal size until you identify and fix the root cause. Review every losing trade for common factors.",
      stats: [
        { label: "Avg R", value: `${avgR.toFixed(2)}R` },
        { label: "Win Rate", value: `${winRate.toFixed(0)}%` },
        { label: "Losses", value: `${losses}` },
      ],
    });
  }

  // ── 2. Instrument analysis ────────────────────────────────────────────────
  const byInstrument: Record<string, { wins: number; losses: number; totalR: number }> = {};
  closed.forEach((t) => {
    const inst = (t.symbol || t.instrument || "Unknown").toUpperCase();
    if (!byInstrument[inst]) byInstrument[inst] = { wins: 0, losses: 0, totalR: 0 };
    if (t.result === "win") byInstrument[inst].wins++;
    else byInstrument[inst].losses++;
    byInstrument[inst].totalR += getR(t);
  });
  const instrumentStats = Object.entries(byInstrument)
    .filter(([_, s]) => s.wins + s.losses >= 3)
    .map(([name, s]) => ({
      name,
      total: s.wins + s.losses,
      winRate: (s.wins / (s.wins + s.losses)) * 100,
      avgR: s.totalR / (s.wins + s.losses),
    }));
  const worstInstr = [...instrumentStats].sort((a, b) => a.winRate - b.winRate)[0];
  const bestInstr = [...instrumentStats].sort((a, b) => b.winRate - a.winRate)[0];

  if (worstInstr && worstInstr.winRate < 40) {
    items.push({
      id: `instr_loss_${worstInstr.name}`,
      type: "loss_pattern",
      severity: worstInstr.winRate < 30 ? "critical" : "warning",
      emoji: "📉",
      category: "Instrument",
      title: `${worstInstr.name}: Consistent Losses`,
      detail: `Only ${worstInstr.winRate.toFixed(0)}% win rate across ${worstInstr.total} trades on ${worstInstr.name} (avg ${worstInstr.avgR.toFixed(2)}R). This instrument is a significant drag on your results.`,
      tip: `Pause ${worstInstr.name} and analyse your approach: Is this setup valid for this instrument? Does its volatility or spread affect your strategy? Consider removing it from your watchlist temporarily.`,
      stats: [
        { label: "Win Rate", value: `${worstInstr.winRate.toFixed(0)}%` },
        { label: "Avg R", value: `${worstInstr.avgR.toFixed(2)}R` },
        { label: "Trades", value: `${worstInstr.total}` },
      ],
    });
  }
  if (bestInstr && bestInstr.winRate >= 65 && bestInstr.total >= 4 && bestInstr.name !== worstInstr?.name) {
    items.push({
      id: `instr_strength_${bestInstr.name}`,
      type: "strength",
      severity: "positive",
      emoji: "💎",
      category: "Instrument",
      title: `${bestInstr.name}: Your Best Instrument`,
      detail: `${bestInstr.winRate.toFixed(0)}% win rate across ${bestInstr.total} trades — this is where your proven edge lives.`,
      tip: `Prioritise ${bestInstr.name} in your trading sessions. Your edge here is real and statistically confirmed.`,
      stats: [
        { label: "Win Rate", value: `${bestInstr.winRate.toFixed(0)}%` },
        { label: "Avg R", value: `+${bestInstr.avgR.toFixed(2)}R` },
        { label: "Trades", value: `${bestInstr.total}` },
      ],
    });
  }

  // ── 3. Strategy analysis ──────────────────────────────────────────────────
  const byStrategy: Record<string, { wins: number; losses: number; totalR: number }> = {};
  closed.forEach((t) => {
    const strat = t.strategy || "No Strategy";
    if (!byStrategy[strat]) byStrategy[strat] = { wins: 0, losses: 0, totalR: 0 };
    if (t.result === "win") byStrategy[strat].wins++;
    else byStrategy[strat].losses++;
    byStrategy[strat].totalR += getR(t);
  });
  const stratStats = Object.entries(byStrategy)
    .filter(([_, s]) => s.wins + s.losses >= 3)
    .map(([name, s]) => ({
      name,
      total: s.wins + s.losses,
      winRate: (s.wins / (s.wins + s.losses)) * 100,
      avgR: s.totalR / (s.wins + s.losses),
    }));
  const worstStrat = [...stratStats].sort((a, b) => a.winRate - b.winRate)[0];
  const bestStrat = [...stratStats].sort((a, b) => b.winRate - a.winRate)[0];

  if (worstStrat && worstStrat.winRate < 40 && stratStats.length >= 2) {
    items.push({
      id: `strat_loss_${worstStrat.name}`,
      type: "loss_pattern",
      severity: "warning",
      emoji: "⚙️",
      category: "Strategy",
      title: `"${worstStrat.name}" is Underperforming`,
      detail: `${worstStrat.winRate.toFixed(0)}% win rate on ${worstStrat.total} trades using this strategy (avg ${worstStrat.avgR.toFixed(2)}R). It is significantly below your average.`,
      tip: `Review your rules for "${worstStrat.name}". Are you following them precisely? Is this strategy suited to current market conditions? Compare your setups against your best-performing strategy.`,
      stats: [
        { label: "Win Rate", value: `${worstStrat.winRate.toFixed(0)}%` },
        { label: "Avg R", value: `${worstStrat.avgR.toFixed(2)}R` },
        { label: "Trades", value: `${worstStrat.total}` },
      ],
    });
  }
  if (bestStrat && bestStrat.winRate >= 60 && bestStrat.total >= 5) {
    items.push({
      id: `strat_strength_${bestStrat.name}`,
      type: "strength",
      severity: "positive",
      emoji: "⭐",
      category: "Strategy",
      title: `"${bestStrat.name}": Your Strongest Setup`,
      detail: `${bestStrat.winRate.toFixed(0)}% win rate across ${bestStrat.total} trades — your best-performing strategy.`,
      tip: `Stick to "${bestStrat.name}" during uncertain market conditions. Your edge here is statistically real — don't abandon it during drawdowns.`,
      stats: [
        { label: "Win Rate", value: `${bestStrat.winRate.toFixed(0)}%` },
        { label: "Avg R", value: `+${bestStrat.avgR.toFixed(2)}R` },
        { label: "Trades", value: `${bestStrat.total}` },
      ],
    });
  }

  // ── 4. Day of week analysis ───────────────────────────────────────────────
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
    .filter(([_, s]) => s.wins + s.losses >= 3)
    .map(([dayNum, s]) => ({
      day: DAY_NAMES[Number(dayNum)],
      total: s.wins + s.losses,
      winRate: (s.wins / (s.wins + s.losses)) * 100,
    }));
  const worstDay = [...dayStats].sort((a, b) => a.winRate - b.winRate)[0];
  const bestDay = [...dayStats].sort((a, b) => b.winRate - a.winRate)[0];

  if (worstDay && worstDay.winRate < 35 && worstDay.total >= 4) {
    items.push({
      id: `day_loss_${worstDay.day}`,
      type: "loss_pattern",
      severity: "warning",
      emoji: "📅",
      category: "Day of Week",
      title: `${worstDay.day}s: Your Worst Trading Day`,
      detail: `Only ${worstDay.winRate.toFixed(0)}% win rate across ${worstDay.total} ${worstDay.day} trades. This is a statistically poor day for your performance.`,
      tip: `Consider skipping or reducing size on ${worstDay.day}s. Market structure or your mental state may not align with your setups on this day.`,
      stats: [
        { label: "Win Rate", value: `${worstDay.winRate.toFixed(0)}%` },
        { label: "Trades", value: `${worstDay.total}` },
      ],
    });
  }
  if (bestDay && bestDay.winRate >= 65 && bestDay.total >= 4 && bestDay.day !== worstDay?.day) {
    items.push({
      id: `day_strength_${bestDay.day}`,
      type: "strength",
      severity: "positive",
      emoji: "✅",
      category: "Day of Week",
      title: `${bestDay.day}s: Your Peak Trading Day`,
      detail: `${bestDay.winRate.toFixed(0)}% win rate across ${bestDay.total} trades — ${bestDay.day}s consistently produce your best results.`,
      tip: `Prioritise high-quality setups on ${bestDay.day}s. Be more selective on other days of the week.`,
      stats: [
        { label: "Win Rate", value: `${bestDay.winRate.toFixed(0)}%` },
        { label: "Trades", value: `${bestDay.total}` },
      ],
    });
  }

  // ── 5. Consecutive loss behaviour (revenge trading) ───────────────────────
  const sortedTrades = [...closed].sort(
    (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
  );
  let consecutiveLosses = 0;
  let tradesAfterTwoLosses = 0;
  let winsAfterTwoLosses = 0;
  for (let i = 0; i < sortedTrades.length; i++) {
    if (sortedTrades[i].result === "loss") consecutiveLosses++;
    else consecutiveLosses = 0;
    if (consecutiveLosses >= 2 && i + 1 < sortedTrades.length) {
      tradesAfterTwoLosses++;
      if (sortedTrades[i + 1].result === "win") winsAfterTwoLosses++;
    }
  }
  if (tradesAfterTwoLosses >= 5) {
    const wr = (winsAfterTwoLosses / tradesAfterTwoLosses) * 100;
    if (wr < 40) {
      items.push({
        id: "consecutive_losses",
        type: "loss_pattern",
        severity: "critical",
        emoji: "🔁",
        category: "Behaviour",
        title: "Trading After 2 Consecutive Losses",
        detail: `When you've had 2 losses in a row, you continue trading — and those subsequent trades only win ${wr.toFixed(0)}% of the time. This is likely emotion-driven (revenge) trading.`,
        tip: "Create a hard rule: after 2 losses in any session, close your platform. Your data shows your edge is gone at this point. Come back the next day.",
        stats: [
          { label: "Win Rate After 2 Losses", value: `${wr.toFixed(0)}%` },
          { label: "Times Detected", value: `${tradesAfterTwoLosses}x` },
        ],
      });
    }
  }

  // ── 6. Post-win streak overconfidence ─────────────────────────────────────
  let winStreak = 0;
  let tradesAfterStreak = 0;
  let winsAfterStreak = 0;
  for (let i = 0; i < sortedTrades.length - 1; i++) {
    winStreak = sortedTrades[i].result === "win" ? winStreak + 1 : 0;
    if (winStreak >= 3) {
      tradesAfterStreak++;
      if (sortedTrades[i + 1].result === "win") winsAfterStreak++;
    }
  }
  if (tradesAfterStreak >= 5) {
    const wrStreak = (winsAfterStreak / tradesAfterStreak) * 100;
    if (wrStreak < winRate - 15) {
      items.push({
        id: "post_win_streak",
        type: "loss_pattern",
        severity: "warning",
        emoji: "🎯",
        category: "Behaviour",
        title: "Win Streak → Drop in Performance",
        detail: `After 3+ consecutive wins, your next trade wins only ${wrStreak.toFixed(0)}% of the time (vs your ${winRate.toFixed(0)}% overall). Overconfidence after winning streaks is costing you.`,
        tip: "After 3 wins in a row, take an extra 30 minutes before the next trade. Review the setup with fresh eyes — you may be forcing setups that aren't really there.",
        stats: [
          { label: "Win Rate After Streak", value: `${wrStreak.toFixed(0)}%` },
          { label: "Overall Win Rate", value: `${winRate.toFixed(0)}%` },
          { label: "Times Detected", value: `${tradesAfterStreak}x` },
        ],
      });
    }
  }

  // ── 7. Risk/Reward ratio strength ─────────────────────────────────────────
  const winTrades = closed.filter((t) => t.result === "win");
  const lossTrades = closed.filter((t) => t.result === "loss");
  const avgWinR = winTrades.length
    ? winTrades.reduce((sum, t) => sum + Math.abs(getR(t)), 0) / winTrades.length
    : 0;
  const avgLossR = lossTrades.length
    ? Math.abs(lossTrades.reduce((sum, t) => sum + getR(t), 0) / lossTrades.length)
    : 1;
  if (avgWinR > 0 && avgLossR > 0 && avgWinR / avgLossR >= 1.8) {
    items.push({
      id: "rrr_strength",
      type: "strength",
      severity: "positive",
      emoji: "⚖️",
      category: "Risk/Reward",
      title: "Excellent Risk/Reward Asymmetry",
      detail: `Your wins average +${avgWinR.toFixed(2)}R while losses average only -${avgLossR.toFixed(2)}R — a ${(avgWinR / avgLossR).toFixed(1)}:1 ratio. This asymmetry is a real professional edge.`,
      tip: "Protect this ratio at all costs. Never widen your stop out of fear and never cut winners early. This R:R discipline is what makes traders consistently profitable.",
      stats: [
        { label: "Avg Win", value: `+${avgWinR.toFixed(2)}R` },
        { label: "Avg Loss", value: `-${avgLossR.toFixed(2)}R` },
        { label: "Ratio", value: `${(avgWinR / avgLossR).toFixed(1)}:1` },
      ],
    });
  }

  // ── 8. All clear ─────────────────────────────────────────────────────────
  const lossPatternCount = items.filter((i) => i.type === "loss_pattern").length;
  if (lossPatternCount === 0 && closed.length >= 10) {
    items.push({
      id: "all_clear",
      type: "strength",
      severity: "positive",
      emoji: "🌟",
      category: "Overall",
      title: "No Significant Loss Patterns Detected",
      detail: `Across all ${closed.length} analysed trades, no major recurring loss patterns were found — no problem instruments, no problem days, no revenge-trading signals. This is excellent discipline.`,
      tip: "Keep your current rules and risk management strict. Your consistency is your biggest asset right now — don't change what's working.",
      stats: [
        { label: "Win Rate", value: `${winRate.toFixed(0)}%` },
        { label: "Avg R", value: `${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R` },
        { label: "Trades Checked", value: `${closed.length}` },
      ],
    });
  }

  // Sort: critical loss patterns first → warnings → strengths
  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "loss_pattern" ? -1 : 1;
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (b.severity === "critical" && a.severity !== "critical") return 1;
    return 0;
  });
}

// ─── Engine Insight helpers ───────────────────────────────────────────────────
const IMPACT_COLOR: Record<string, string> = {
  Critical: "border-red-400 bg-red-500/5",
  High: "border-amber-400 bg-amber-500/5",
  Medium: "border-blue-400 bg-blue-500/5",
  Low: "border-green-400 bg-green-500/5",
};
const IMPACT_BADGE: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-500",
  High: "bg-amber-500/10 text-amber-600",
  Medium: "bg-blue-500/10 text-blue-600",
  Low: "bg-emerald-500/10 text-emerald-600",
};

// ─── Phase Card ───────────────────────────────────────────────────────────────
function PhaseCard({
  phaseKey,
  stats,
  isCurrent,
  delay = 0,
}: {
  phaseKey: PhaseKey;
  stats?: PhaseStats;
  isCurrent: boolean;
  delay?: number;
}) {
  const info = CYCLE_PHASE_INFO[phaseKey];
  const [expanded, setExpanded] = useState(isCurrent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border-2 ${info.bgColor} ${info.borderColor} p-5 shadow-soft cursor-pointer`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{info.name}</h3>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${info.badgeColor}`}>
                {info.days}
              </span>
              {isCurrent && (
                <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-primary/10 text-primary">
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{info.hormone}</p>
          </div>
        </div>
        {stats?.hasData ? (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-foreground">{stats.winRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{stats.count} trades</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0 mt-1">No data yet</span>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-card/70 p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Mental & Emotional
            </p>
            <p className="text-sm text-foreground leading-relaxed">{info.mental}</p>
          </div>
          <div className="rounded-lg bg-card/70 p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Trading Influence
            </p>
            <p className="text-sm text-foreground leading-relaxed">{info.trading}</p>
          </div>
          {stats?.hasData ? (
            <div className="rounded-lg bg-card/70 p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Your Data ({stats.count} trades)
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.winRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stats.avgR >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stats.avgR >= 0 ? "+" : ""}{stats.avgR.toFixed(2)}R
                  </p>
                  <p className="text-xs text-muted-foreground">Avg R</p>
                </div>
              </div>
              <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
                <p className="text-sm leading-relaxed text-foreground">
                  {stats.winRate >= 60 && stats.avgR >= 0.5 ? (
                    <>✅ You're performing <strong>above average</strong> in this phase. The hormonal environment here isn't negatively affecting you — keep your usual approach.</>
                  ) : stats.avgR < 0 || stats.winRate < 45 ? (
                    <>⚠️ Your numbers dip in this phase. Consider <strong>reducing position sizes or trading frequency</strong> during {info.name.toLowerCase()} and comparing results.</>
                  ) : (
                    <>📊 Your performance here is <strong>consistent with your overall average</strong>. No specific adjustments needed.</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-card/70 p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your Data</p>
              <p className="text-sm text-muted-foreground">
                No trades logged in this phase yet. Once you have 3+ trades in {info.name.toLowerCase()}, you'll see personalised performance data here.
              </p>
            </div>
          )}
          <div className={`rounded-lg p-3 border-l-4 ${info.borderColor} bg-card/50`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tip</p>
            <p className="text-sm text-foreground">{info.tip}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3 text-right">
        {expanded ? "Tap to collapse ▲" : "Tap to expand ▼"}
      </p>
    </motion.div>
  );
}

// ─── Engine Insight Card ──────────────────────────────────────────────────────
function EngineInsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border-2 p-5 shadow-soft ${IMPACT_COLOR[insight.impact] ?? IMPACT_COLOR.Medium}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-xl bg-card p-2.5 shrink-0">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div>
          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${IMPACT_BADGE[insight.impact] ?? ""}`}>
            {insight.impact} Impact
          </span>
          <h3 className="font-semibold text-foreground mt-1">{insight.title}</h3>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{insight.insight}</p>
      <div className="rounded-lg bg-muted/40 p-3 mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Action</p>
        <p className="text-sm text-foreground">{insight.actionable}</p>
      </div>
      <Button variant="outline" size="sm" className="group" onClick={() => navigate("/statistics")}>
        View Statistics
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </motion.div>
  );
}

// ─── Profitability Card ──────────────────────────────────────────────────────
function ProfitabilityCard({ item, index }: { item: ProfitabilityItem; index: number }) {
  const borderColor =
    item.severity === "critical"
      ? "border-red-400"
      : item.severity === "warning"
      ? "border-amber-400"
      : "border-emerald-400";
  const bgColor =
    item.severity === "critical"
      ? "bg-red-500/5"
      : item.severity === "warning"
      ? "bg-amber-500/5"
      : "bg-emerald-500/5";
  const badgeColor =
    item.severity === "critical"
      ? "bg-red-500/10 text-red-500"
      : item.severity === "warning"
      ? "bg-amber-500/10 text-amber-600"
      : "bg-emerald-500/10 text-emerald-600";
  const badgeLabel =
    item.severity === "critical"
      ? "Critical"
      : item.severity === "warning"
      ? "Warning"
      : item.type === "loss_pattern"
      ? "Area to improve"
      : "✓ Strength";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-2xl border-2 ${borderColor} ${bgColor} p-5 shadow-soft`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl shrink-0">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${badgeColor}`}>
              {badgeLabel}
            </span>
            <span className="text-xs text-muted-foreground">{item.category}</span>
          </div>
          <h3 className="font-semibold text-foreground">{item.title}</h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.detail}</p>

      {item.stats && item.stats.length > 0 && (
        <div className={`grid gap-2 mb-3 ${item.stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {item.stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-card/70 p-2 border border-border text-center">
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className={`rounded-lg p-3 border-l-4 ${borderColor} bg-card/50`}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {item.type === "loss_pattern" ? "What to do" : "Keep doing"}
        </p>
        <p className="text-sm text-foreground">{item.tip}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIInsights() {
  const navigate = useNavigate();
  const { hasFeature, loading: subLoading } = useSubscription();
  const { appMode } = useAppMode();
  const [trades, setTrades] = useState<any[]>([]);
  const [engineInsights, setEngineInsights] = useState<AIInsight[]>([]);
  const [currentPhaseKey, setCurrentPhaseKey] = useState<PhaseKey | null>(null);
  usePaymentSuccess();

  useEffect(() => {
    const loaded = appMode === "DEMO" ? generateDemoTrades() : loadTradesFromLocalStorage();
    setTrades(loaded);
  }, [appMode]);

  useEffect(() => {
    const info = getCurrentCycleInfo();
    if (info?.phase) setCurrentPhaseKey(normalizePhase(info.phase));
  }, []);

  useEffect(() => {
    if (trades.length >= 10) {
      try {
        const engine = new AIInsightsEngine(trades as any);
        setEngineInsights(engine.generateInsights());
      } catch {
        setEngineInsights([]);
      }
    }
  }, [trades]);

  const phaseStats = useMemo(() => computePhaseStats(trades), [trades]);
  const profitabilityItems = useMemo(() => analyzeProfitability(trades), [trades]);
  const hasEnoughData = trades.length >= 10;
  const currentPhaseStats = currentPhaseKey
    ? phaseStats.find((s) => s.phase === currentPhaseKey)
    : undefined;

  if (subLoading) return <div className="min-h-screen bg-background" />;

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl p-4 lg:p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> AI Insights
        </h1>
        <p className="mt-1 text-muted-foreground">
          Personalized analysis based on your trading data & cycle
        </p>
      </div>

      {/* Summary strip */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Trades Analysed",
            value: trades.length,
            icon: BarChart2,
            sub: trades.length < 10 ? `${10 - trades.length} more to unlock insights` : "Full analysis active",
          },
          {
            label: "AI Insights",
            value: engineInsights.length,
            icon: Brain,
            sub: hasEnoughData ? "Based on your real data" : "Unlocks at 10 trades",
          },
          {
            label: "Phases Tracked",
            value: phaseStats.filter((s) => s.hasData).length,
            icon: Activity,
            sub: "of 4 cycle phases",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Not enough data banner */}
      {!hasEnoughData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 shrink-0">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Keep logging — trading insights unlock at 10 trades
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You've logged <strong>{trades.length}</strong> trade{trades.length !== 1 ? "s" : ""} so far.
                Log {10 - trades.length} more to activate personalized AI analysis of your RRR, stop-loss patterns,
                overtrading detection, and strategy effectiveness.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                In the meantime, the Cycle Phase Intelligence below gives you proactive guidance for every phase.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/new-trade")}>
                Log a Trade <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══ CYCLE PHASE INTELLIGENCE — always visible ══ */}
      <section className="mb-10">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Moon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Cycle Phase Intelligence</h2>
            <p className="text-sm text-muted-foreground">
              What each phase means for your hormones, mind & trading — personalised with your data
            </p>
          </div>
        </div>

        {/* Current phase highlight */}
        {currentPhaseKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-2xl border-2 border-primary bg-primary/5 p-6"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> You're in this phase right now
            </p>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className="text-4xl">{CYCLE_PHASE_INFO[currentPhaseKey].emoji}</span>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {CYCLE_PHASE_INFO[currentPhaseKey].name} Phase
                </h3>
                <p className="text-sm text-muted-foreground">{CYCLE_PHASE_INFO[currentPhaseKey].days}</p>
              </div>
              {currentPhaseStats?.hasData && (
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {currentPhaseStats.winRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    your win rate · {currentPhaseStats.count} trades
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-card/70 p-3 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  What's happening in your body
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {CYCLE_PHASE_INFO[currentPhaseKey].hormone}
                </p>
              </div>
              <div className="rounded-lg bg-card/70 p-3 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Mental & Emotional
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {CYCLE_PHASE_INFO[currentPhaseKey].mental}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-card/70 p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Trading influence
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {CYCLE_PHASE_INFO[currentPhaseKey].trading}
              </p>
            </div>

            {/* Personalised vs general message */}
            {currentPhaseStats?.hasData ? (
              <div className="mt-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
                <p className="text-sm text-foreground leading-relaxed">
                  {currentPhaseStats.winRate >= 60 && currentPhaseStats.avgR >= 0 ? (
                    <>
                      ✅ <strong>Your data is reassuring.</strong> With a{" "}
                      {currentPhaseStats.winRate.toFixed(0)}% win rate and{" "}
                      {currentPhaseStats.avgR >= 0 ? "+" : ""}
                      {currentPhaseStats.avgR.toFixed(2)}R average across{" "}
                      {currentPhaseStats.count} trades, you've historically traded well in this phase.
                      Continue with your normal approach and risk rules.
                    </>
                  ) : currentPhaseStats.avgR < 0 || currentPhaseStats.winRate < 45 ? (
                    <>
                      ⚠️ <strong>Your data shows a performance dip here.</strong>{" "}
                      {currentPhaseStats.winRate.toFixed(0)}% win rate and{" "}
                      {currentPhaseStats.avgR.toFixed(2)}R average — consider reducing position
                      sizes or trading frequency today until you feel fully on form.
                    </>
                  ) : (
                    <>
                      📊 <strong>Consistent performance.</strong> Your{" "}
                      {currentPhaseStats.winRate.toFixed(0)}% win rate in this phase matches your
                      overall average — no specific adjustments needed. Trade as usual.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-muted/30 p-4 border border-border">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>General guidance applies.</strong> You don't have enough trades logged
                  in this phase yet for a personalised reading. Use the tip below as your starting
                  point and log more trades to unlock data-driven recommendations.
                </p>
              </div>
            )}

            <div className={`mt-3 rounded-lg p-3 border-l-4 ${CYCLE_PHASE_INFO[currentPhaseKey].borderColor} bg-card/50`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Today's Tip
              </p>
              <p className="text-sm text-foreground">{CYCLE_PHASE_INFO[currentPhaseKey].tip}</p>
            </div>
          </motion.div>
        )}

        {/* All 4 phases breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            All Phases — tap to expand
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["menstruation", "follicular", "ovulation", "luteal"] as PhaseKey[]).map((phase, i) => (
              <PhaseCard
                key={phase}
                phaseKey={phase}
                stats={phaseStats.find((s) => s.phase === phase)}
                isCurrent={currentPhaseKey === phase}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRADING ANALYSIS — requires 10+ trades ══ */}
      {hasEnoughData && (
        <>
          {/* Profitability Analysis */}
          {profitabilityItems.length > 0 && (
            <section className="mb-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <TrendingDown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Profitability Analysis</h2>
                  <p className="text-sm text-muted-foreground">
                    Loss patterns, root causes & what's actually working — based on your real data
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {profitabilityItems.map((item, i) => (
                  <ProfitabilityCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Pattern Analysis</h2>
                <p className="text-sm text-muted-foreground">
                  RRR optimisation, stop-loss health & overtrading detection
                </p>
              </div>
            </div>
            <IntelligentAIInsights trades={trades} />
          </section>

          {engineInsights.length > 0 && (
            <section className="mb-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Deep Insights</h2>
                  <p className="text-sm text-muted-foreground">
                    Strategy performance, entry timing, session patterns & more
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {engineInsights.map((insight, i) => (
                  <EngineInsightCard key={insight.id} insight={insight} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* AI Coach Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 p-6 border border-primary/20"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-card p-3 shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Your AI Coach Summary
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {trades.length < 30 ? (
                    <>
                      Based on your <strong>{trades.length} trades</strong>, patterns are starting to emerge. Keep logging consistently — at 30+ trades you'll unlock high-confidence cycle-phase correlation and strategy-specific analysis.
                    </>
                  ) : trades.length < 60 ? (
                    <>
                      Your <strong>{trades.length} trades</strong> are revealing meaningful patterns. The insights above are based on real statistical signals from your data. Focus on the highest-impact recommendations first.
                    </>
                  ) : (
                    <>
                      With <strong>{trades.length} trades</strong> logged, you have a statistically significant dataset. The insights here represent genuine edges and risks identified in your specific trading behaviour — treat them as your personal trading rules.
                    </>
                  )}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/trade-journal")}>
                  View All Trades <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="relative">
        {!subLoading && !hasFeature("ai_insights_weekly") && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-xl mb-2">Pro Feature</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Upgrade to Pro for AI-powered insights, personalized cycle recommendations, and full trading pattern analysis.
                </p>
                <Button
                  onClick={() => navigate(`/checkout?tier=pro&returnTo=${window.location.pathname}`)}
                  size="lg"
                  className="w-full"
                >
                  Upgrade to Pro — €19.99/mo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <div className={hasFeature("ai_insights_weekly") ? "" : "blur-sm pointer-events-none"}>
          {content}
        </div>
      </div>
    </main>
  );
}
