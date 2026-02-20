import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WidgetSize, getColSpan, getColSpanMobile } from "@/lib/dashboardWidgets";

interface DailyGoalWidgetProps {
  size: WidgetSize;
}

export function DailyGoalWidget({ size }: DailyGoalWidgetProps) {
  // This is a placeholder - would be expanded to allow setting daily goals
  const goals = [
    { id: 1, text: 'Complete 2 quality trades', completed: false },
    { id: 2, text: 'Journal review', completed: true },
    { id: 3, text: 'Risk check daily', completed: false },
  ];

  const completedCount = goals.filter(g => g.completed).length;
  const progressPercent = (completedCount / goals.length) * 100;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`${getColSpanMobile()} sm:${getColSpan(size)}`}
    >
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span>🎯</span> Daily Goals
        </h3>
        <div className="space-y-2 mb-4">
          {goals.map(goal => (
            <div key={goal.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={goal.completed}
                readOnly
                className="rounded"
              />
              <span className={goal.completed ? 'line-through text-muted-foreground' : ''}>
                {goal.text}
              </span>
            </div>
          ))}
        </div>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Progress: {completedCount}/{goals.length}</div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full text-xs">
          Edit Goals
        </Button>
      </div>
    </motion.div>
  );
}
