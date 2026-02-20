import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";
import { getWidgetHeightClass, getWidgetLabelClass, getWidgetDescriptionClass } from "@/lib/widgetSizing";
import { useNavigate } from "react-router-dom";

interface JournalEntryWidgetProps {
  size: WidgetSize;
}

export function JournalEntryWidget({ size }: JournalEntryWidgetProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      <div className={`${getWidgetHeightClass(size)} rounded-2xl bg-card p-5 shadow-card border border-border flex flex-col justify-between`}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <span className="text-2xl">📔</span>
          </div>
          <h3 className={getWidgetLabelClass(size)}>Journal Entry</h3>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <p className={`${getWidgetDescriptionClass(size)} max-w-md leading-relaxed`}>
            Reflect on your cycle, symptoms, and trading day. Journaling helps you discover patterns and improve your performance.
          </p>
          <Button
            className="w-full py-3 text-base font-semibold mt-4"
            size="lg"
            onClick={() => {
              const today = new Date();
              const iso = today.toISOString().slice(0, 10);
              navigate(`/day/${iso}`);
            }}
          >
            Add Journal Entry
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
