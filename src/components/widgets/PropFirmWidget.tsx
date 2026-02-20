import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { getWidgetHeightClass } from "@/lib/widgetSizing";

const PropFirmSummary = lazy(() => import("@/components/PropFirmSummary").then((m) => ({ default: m.PropFirmSummary })));

interface PropFirmWidgetProps {
  size: WidgetSize;
}

export function PropFirmWidget({ size }: PropFirmWidgetProps) {
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
          <PropFirmSummary />
        </Suspense>
      </div>
    </motion.div>
  );
}
