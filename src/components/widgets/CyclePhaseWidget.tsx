import { motion } from "framer-motion";
import { CyclePhaseIndicator } from "@/components/CyclePhaseIndicator";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { getWidgetHeightClass } from "@/lib/widgetSizing";
import { generateSimpleCalendarData } from "@/lib/cycleHelpers";

interface CyclePhaseWidgetProps {
  size: WidgetSize;
}

export function CyclePhaseWidget({ size }: CyclePhaseWidgetProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      {(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const avg = Number(localStorage.getItem("cw_avgCycleLength") || 28);
        const per = Number(localStorage.getItem("cw_periodLength") || 5);
        const lastPeriodStart = localStorage.getItem("cw_lastPeriodStart") || null;

        const calendarData = generateSimpleCalendarData(year, month, avg, lastPeriodStart, per);
        const todayObj = calendarData.find(d => d.date.getDate() === today.getDate());

        if (!todayObj) {
          return (
            <div className={`${getWidgetHeightClass(size)} rounded-2xl bg-card p-6 shadow-card border border-border text-center flex flex-col items-center justify-center`}>
              <div className="text-lg font-semibold mb-2">No Period Data</div>
              <div className="text-muted-foreground text-sm">Please log your period data</div>
            </div>
          );
        }

        const recommendations: Record<string, string> = {
          menstruation: "Energy may be lower. Consider smaller position sizes or taking a break.",
          follicular: "Rising energy and focus. Good time for analytical trading.",
          ovulation: "Peak confidence and communication. Be mindful of overconfidence.",
          luteal: "Increased emotional sensitivity. Review decisions carefully before entering.",
        };

        return (
          <CyclePhaseIndicator
            phase={todayObj.phase}
            day={todayObj.cycleDay}
            recommendation={recommendations[todayObj.phase]}
          />
        );
      })()}
    </motion.div>
  );
}
