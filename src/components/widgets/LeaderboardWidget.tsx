import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { getWidgetHeightClass } from "@/lib/widgetSizing";

const LeaderboardPreview = lazy(() => import("@/components/LeaderboardPreview").then((m) => ({ default: m.LeaderboardPreview })));

const mockLeaderboard = [
  { rank: 1, name: "Sarah M.", avatar: "👩‍💼", score: 847, badge: "Miss Discipline" },
  { rank: 2, name: "Emma K.", avatar: "👩‍🎤", score: 792, badge: "Cycle Master" },
  { rank: 3, name: "Luna P.", avatar: "👩‍🔬", score: 756 },
];

interface LeaderboardWidgetProps {
  size: WidgetSize;
}

export function LeaderboardWidget({ size }: LeaderboardWidgetProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      <div className={`${getWidgetHeightClass(size)} rounded-2xl shadow-card border border-border overflow-hidden`}>
        <Suspense fallback={<div className="w-full h-full bg-card flex items-center justify-center text-muted-foreground">Loading...</div>}>
          <LeaderboardPreview entries={mockLeaderboard} type="discipline" currentUserRank={12} />
        </Suspense>
      </div>
    </motion.div>
  );
}
