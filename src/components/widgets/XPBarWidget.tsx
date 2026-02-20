import { motion } from "framer-motion";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { getWidgetHeightClass } from "@/lib/widgetSizing";
import { XPBar } from "@/components/XPBar";

interface XPBarWidgetProps {
  size: WidgetSize;
}

export function XPBarWidget({ size }: XPBarWidgetProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      <div className={`${getWidgetHeightClass(size)} rounded-2xl shadow-card border border-border overflow-hidden`}>
        <XPBar />
      </div>
    </motion.div>
  );
}
