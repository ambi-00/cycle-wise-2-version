import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, X, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { hasAnyTrades } from "@/lib/tradeLoaders";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  action: string;
  route?: string;
  checkFunction: () => boolean;
}

export default function QuickStartChecklist() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const checklistItems: ChecklistItem[] = [
    {
      id: "first-period",
      title: "Track Your First Period 🩸",
      description: "Start tracking your cycle to unlock personalized insights",
      action: "Track Period",
      route: "/cycle",
      checkFunction: () => {
        // Check if any period has been logged
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('cw_journal_')) {
            try {
              const journal = JSON.parse(localStorage.getItem(key) || '{}');
              if (journal.hasPeriod) return true;
            } catch {}
          }
        }
        return false;
      },
    },
    {
      id: "first-trade",
      title: "Log Your First Trade 📝",
      description: "Record a trade to start building your journal",
      action: "Add Trade",
      route: `/trade/new?date=${new Date().toISOString().slice(0, 10)}`,
      checkFunction: () => hasAnyTrades(),
    },
    {
      id: "first-strategy",
      title: "Create a Strategy 🎯",
      description: "Build your first strategy checklist for disciplined trading",
      action: "Create Strategy",
      route: "/strategies",
      checkFunction: () => {
        try {
          const strategies = JSON.parse(localStorage.getItem('cw_strategies') || '[]');
          return strategies.length > 0;
        } catch {
          return false;
        }
      },
    },
    {
      id: "join-challenge",
      title: "Check Out Challenges 🏆",
      description: "See weekly leaderboards and badges you can earn",
      action: "View Challenges",
      route: "/challenges",
      checkFunction: () => {
        return localStorage.getItem('cw_visited_challenges') === 'true';
      },
    },
    {
      id: "view-insights",
      title: "Explore AI Insights 🤖",
      description: "See what personalized recommendations await you",
      action: "View Insights",
      route: "/insights",
      checkFunction: () => {
        return localStorage.getItem('cw_visited_insights') === 'true';
      },
    },
  ];

  useEffect(() => {
    // Check if user has dismissed checklist
    const dismissed = localStorage.getItem("cw_checklist_dismissed");
    
    if (!dismissed) {
      // Show checklist on first login (unless user dismissed it)
      setIsOpen(true);
    }

    // Update checked items
    updateCheckedItems();
  }, []);

  useEffect(() => {
    // Auto-dismiss when all items are complete
    if (isOpen && checkedItems.size === checklistItems.length) {
      localStorage.setItem("cw_checklist_dismissed", "true");
      setIsOpen(false);
    }
  }, [checkedItems, checklistItems.length, isOpen]);

  const updateCheckedItems = () => {
    const checked = new Set<string>();
    checklistItems.forEach((item) => {
      if (item.checkFunction()) {
        checked.add(item.id);
      }
    });
    setCheckedItems(checked);
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (item.route) {
      // Mark as visited for challenge/insights pages
      if (item.id === 'join-challenge') {
        localStorage.setItem('cw_visited_challenges', 'true');
      }
      if (item.id === 'view-insights') {
        localStorage.setItem('cw_visited_insights', 'true');
      }
      navigate(item.route);
      // Recheck after navigation
      setTimeout(updateCheckedItems, 500);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("cw_checklist_dismissed", "true");
    setIsOpen(false);
  };

  const completedCount = checkedItems.size;
  const totalCount = checklistItems.length;
  const progress = (completedCount / totalCount) * 100;
  const isAllComplete = completedCount === totalCount;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="mb-6"
      >
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Start Guide</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAllComplete 
                      ? "🎉 All done! You're ready to trade like a pro!"
                      : `${completedCount} of ${totalCount} completed`
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="mt-3 h-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {checklistItems.map((item, index) => {
              const isChecked = checkedItems.has(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isChecked && handleItemClick(item)}
                  className={`flex items-start gap-3 rounded-xl p-3 transition-all ${
                    isChecked
                      ? "bg-accent/50 opacity-60"
                      : "hover:bg-muted cursor-pointer"
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-accent-foreground flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isChecked ? "line-through" : ""}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {!isChecked && (
                    <Button size="sm" variant="ghost" className="flex-shrink-0">
                      {item.action}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
