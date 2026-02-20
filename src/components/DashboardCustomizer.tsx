import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, RotateCcw, Check, Plus, ArrowLeft, GripVertical, Trash2, LayoutGrid, ListOrdered } from 'lucide-react';
import {
  DashboardConfig,
  WIDGET_REGISTRY,
  saveDashboardConfig,
  DEFAULT_DASHBOARD_CONFIG,
} from '@/lib/dashboardWidgets';
import * as Widgets from "@/components/widgets";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardCustomizerProps {
  config: DashboardConfig;
  onClose: () => void;
  onSave: (config: DashboardConfig) => void;
  isEditMode?: boolean;
  onEditModeToggle?: (enabled: boolean) => void;
}

const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ size: any }>> = {
  'cycle-phase': Widgets.CyclePhaseWidget,
  'performance-cards': Widgets.PerformanceCardsWidget,
  'ai-insight': Widgets.AIInsightWidget,
  'recent-trades': Widgets.RecentTradesWidget,
  'strategy-performance': Widgets.StrategyPerformanceWidget,
  'hot-instruments': Widgets.HotInstrumentsWidget,
  'xp-bar': Widgets.XPBarWidget,
  'streak-display': Widgets.StreakDisplayWidget,
  'journal-entry': Widgets.JournalEntryWidget,
  'prop-firm-summary': Widgets.PropFirmWidget,
  'leaderboard-preview': Widgets.LeaderboardWidget,
  'discipline-meter': Widgets.DisciplineMeterWidget,
  'daily-goal': Widgets.DailyGoalWidget,
  'win-rate-meter': Widgets.WinRateMeterWidget,
  'best-worst-trades': Widgets.BestWorstTradesWidget,
  'cycle-phase-performance': Widgets.CyclePhasePerformanceWidget,
  'monthly-stats': Widgets.MonthlyStatsWidget,
  'trade-frequency': Widgets.TradeFrequencyWidget,
  'risk-assessment': Widgets.RiskAssessmentWidget,
  'pnl-meter': Widgets.PnLMeterWidget,
  'trade-ratio': Widgets.TradeRatioWidget,
  'streak-meter': Widgets.StreakMeterWidget,
  'profit-factor': Widgets.ProfitFactorWidget,
  'drawdown-meter': Widgets.DrawdownMeterWidget,
  'strategy-comparison': Widgets.StrategyComparisonWidget,
  'best-worst-days': Widgets.BestWorstDaysWidget,
  'instrument-heatmap': Widgets.InstrumentHeatmapWidget,
  'weekly-summary': Widgets.WeeklySummaryWidget,
  'trading-performance-comparison': Widgets.TradingPerformanceComparisonWidget,
  // Note: monthly-checkin-insights and monthly-checkin-goals are placeholders
  // They will be implemented when the monthly check-in feature is added
};

const CATEGORY_INFO: Record<string, { icon: string; label: string }> = {
  'performance': { icon: '📊', label: 'Performance' },
  'cycle': { icon: '🔄', label: 'Cycle' },
  'social': { icon: '🏆', label: 'Social' },
  'planning': { icon: '🎯', label: 'Planning' },
  'system': { icon: '⭐', label: 'System' },
};

// Sortable Widget Item Component
function SortableWidgetItem({ widget, onRemove }: { widget: any; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const widgetInfo = WIDGET_REGISTRY[widget.id as keyof typeof WIDGET_REGISTRY];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary/50 transition"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded transition"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Widget Info */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-2xl">{widgetInfo?.icon}</span>
        <div>
          <h4 className="font-semibold text-foreground">{widget.title}</h4>
          <p className="text-xs text-muted-foreground">{widgetInfo?.description}</p>
        </div>
      </div>

      {/* Size Badge */}
      <div className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
        {widget.size}
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function DashboardCustomizer({ 
  config, 
  onClose, 
  onSave
}: DashboardCustomizerProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'reorder'>('add');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const categories = ['performance', 'cycle', 'social', 'planning', 'system'] as const;

  const enabledWidgets = localConfig.widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  const getCategoryWidgets = (category: string) => {
    return localConfig.widgets.filter(
      w => !w.enabled && WIDGET_REGISTRY[w.id as keyof typeof WIDGET_REGISTRY]?.category === category
    );
  };

  const handleAddWidget = (widgetId: string) => {
    const newOrder = Math.max(...localConfig.widgets.map(w => w.order), 0) + 1;
    const updated = {
      ...localConfig,
      widgets: localConfig.widgets.map(w =>
        w.id === widgetId ? { ...w, enabled: true, order: newOrder } : w
      ),
    };
    setLocalConfig(updated);
  };

  const handleRemoveWidget = (widgetId: string) => {
    const updated = {
      ...localConfig,
      widgets: localConfig.widgets.map(w =>
        w.id === widgetId ? { ...w, enabled: false } : w
      ),
    };
    setLocalConfig(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = enabledWidgets.findIndex(w => w.id === active.id);
      const newIndex = enabledWidgets.findIndex(w => w.id === over.id);
      
      const reordered = arrayMove(enabledWidgets, oldIndex, newIndex);
      
      const updated = {
        ...localConfig,
        widgets: localConfig.widgets.map(w => {
          const newOrderIndex = reordered.findIndex(rw => rw.id === w.id);
          if (newOrderIndex !== -1) {
            return { ...w, order: newOrderIndex };
          }
          return w;
        }),
      };
      setLocalConfig(updated);
    }
  };

  const handleReset = () => {
    if (confirm('Reset dashboard to default layout?')) {
      const defaultConfig = JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_CONFIG));
      setLocalConfig(defaultConfig);
    }
  };

  const handleSave = () => {
    saveDashboardConfig(localConfig);
    onSave(localConfig);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Customize Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'add' ? 'Browse and add widgets' : 'Drag to reorder your widgets'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6">
            <button
              onClick={() => {
                setActiveTab('add');
                setSelectedCategory(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition ${
                activeTab === 'add'
                  ? 'bg-background text-foreground border-t border-x border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Add Widgets
            </button>
            <button
              onClick={() => {
                setActiveTab('reorder');
                setSelectedCategory(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition ${
                activeTab === 'reorder'
                  ? 'bg-background text-foreground border-t border-x border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Reorder ({enabledWidgets.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'reorder' ? (
              /* Reorder Tab */
              <motion.div
                key="reorder"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-y-auto p-6"
              >
                {enabledWidgets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <LayoutGrid className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Widgets Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add widgets from the "Add Widgets" tab to get started
                    </p>
                    <Button onClick={() => setActiveTab('add')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Widgets
                    </Button>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm text-foreground">
                        <strong>Tip:</strong> Drag the <GripVertical className="w-4 h-4 inline mx-1" /> handle to reorder your widgets. 
                        The order here determines how they appear on your dashboard.
                      </p>
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={enabledWidgets.map(w => w.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {enabledWidgets.map((widget) => (
                            <SortableWidgetItem
                              key={widget.id}
                              widget={widget}
                              onRemove={() => handleRemoveWidget(widget.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </motion.div>
            ) : selectedCategory === null ? (
              /* Category Selection View */
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-y-auto p-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => {
                    const info = CATEGORY_INFO[cat];
                    const widgetCount = getCategoryWidgets(cat).length;
                    
                    return (
                      <motion.button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-card border border-border hover:border-primary/50 rounded-lg p-6 shadow-sm hover:shadow-md transition text-left"
                      >
                        <div className="text-3xl mb-3">{info.icon}</div>
                        <h3 className="text-lg font-bold text-foreground mb-1">{info.label}</h3>
                        <p className="text-sm text-muted-foreground">{widgetCount} widgets</p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              /* Category Detail View */
              <motion.div
                key={`category-${selectedCategory}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-y-auto p-6 flex flex-col"
              >
                {/* Back Button */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2 text-foreground hover:text-primary mb-6 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Categories
                </button>

                {/* Category Title */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <span className="text-3xl">{CATEGORY_INFO[selectedCategory].icon}</span>
                    {CATEGORY_INFO[selectedCategory].label}
                  </h3>
                </div>

                {/* Widgets Grid */}
                {getCategoryWidgets(selectedCategory).length === 0 ? (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-muted-foreground text-center">No available widgets in this category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCategoryWidgets(selectedCategory).map((widget) => {
                      const WidgetComponent = WIDGET_COMPONENTS[widget.id];
                      return (
                        <motion.div
                          key={widget.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition flex flex-col"
                        >
                          {/* Widget Preview */}
                          <div className="bg-muted/30 p-4 flex-1 border-b border-border overflow-hidden">
                            {WidgetComponent ? (
                              <WidgetComponent size={widget.size} />
                            ) : (
                              <div className="bg-muted rounded p-4 h-32 text-xs text-muted-foreground flex items-center justify-center">
                                Preview unavailable
                              </div>
                            )}
                          </div>

                          {/* Widget Info */}
                          <div className="p-4 space-y-3">
                            <div>
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-2xl flex-shrink-0">{WIDGET_REGISTRY[widget.id as keyof typeof WIDGET_REGISTRY]?.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-foreground">{widget.title}</h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{widget.description}</p>
                                </div>
                              </div>
                            </div>

                            {/* Add Button */}
                            <Button
                              onClick={() => handleAddWidget(widget.id)}
                              className="w-full gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Widget
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-card">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Check className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
