import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Achievement } from '@/lib/achievements';

// ─── Listener pattern (same as XPToast) ──────────────────────────────────────

type AchievementNotification = Achievement & { instanceId: number };
type Listener = (n: AchievementNotification) => void;

let _listeners: Listener[] = [];
let _counter = 0;

export function showAchievementNotification(achievement: Achievement) {
  const notification: AchievementNotification = { ...achievement, instanceId: ++_counter };
  _listeners.forEach(l => l(notification));
}

// ─── Single toast card ────────────────────────────────────────────────────────

function AchievementToastCard({
  notification,
  onDismiss,
}: {
  notification: AchievementNotification;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="pointer-events-auto w-80 rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-background to-background backdrop-blur-sm shadow-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Medal className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Achievement Unlocked!</span>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex items-center gap-3">
        <div className="text-3xl leading-none">{notification.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{notification.description}</p>
        </div>
      </div>

      {/* View button */}
      <button
        onClick={() => { navigate('/challenges?tab=achievements'); onDismiss(); }}
        className="mt-3 w-full text-xs font-medium text-amber-400 hover:text-amber-300 border border-amber-500/40 hover:border-amber-400/60 rounded-lg py-1.5 transition-colors"
      >
        View Achievements
      </button>
    </motion.div>
  );
}

// ─── Container (mount once in App.tsx) ───────────────────────────────────────

export function AchievementToastContainer() {
  const [toasts, setToasts] = useState<AchievementNotification[]>([]);

  useEffect(() => {
    const listener: Listener = n => setToasts(prev => [...prev, n]);
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  const dismiss = (instanceId: number) =>
    setToasts(prev => prev.filter(t => t.instanceId !== instanceId));

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <AchievementToastCard
            key={t.instanceId}
            notification={t}
            onDismiss={() => dismiss(t.instanceId)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
