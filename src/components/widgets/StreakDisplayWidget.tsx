import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { getWidgetHeightClass } from "@/lib/widgetSizing";
import { StreakDisplay } from "@/components/StreakDisplay";

interface StreakDisplayWidgetProps {
  size: WidgetSize;
}

export function StreakDisplayWidget({ size }: StreakDisplayWidgetProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      <div className={`${getWidgetHeightClass(size)} rounded-2xl shadow-card border border-border overflow-hidden`}>
        <StreakDisplay />
      </div>
    </motion.div>
  );
}
