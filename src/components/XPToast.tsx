import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

export interface XPNotification {
  amount: number;
  reason: string;
  reasons?: string[];
  timestamp: number;
}

let listeners: ((notification: XPNotification) => void)[] = [];

export function showXPNotification(notification: Omit<XPNotification, 'timestamp'>) {
  const fullNotification = { ...notification, timestamp: Date.now() };
  listeners.forEach(listener => listener(fullNotification));
}

export function XPToastContainer() {
  const [notifications, setNotifications] = useState<XPNotification[]>([]);

  useEffect(() => {
    const listener = (notification: XPNotification) => {
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.timestamp !== notification.timestamp));
      }, 4000);
    };

    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <XPToast key={notification.timestamp} notification={notification} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function XPToast({ notification }: { notification: XPNotification }) {
  const isPositive = notification.amount > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`relative overflow-hidden rounded-xl border-2 bg-card p-4 shadow-2xl pointer-events-auto min-w-[280px] ${
        isPositive 
          ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-yellow-400/10' 
          : 'border-red-500/50 bg-gradient-to-br from-red-500/10 to-orange-400/10'
      }`}
    >
      {/* Sparkle animation background */}
      {isPositive && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-gradient-radial from-amber-400/30 to-transparent"
        />
      )}

      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <motion.div
          animate={{ 
            rotate: isPositive ? [0, -10, 10, -10, 0] : 0,
            scale: isPositive ? [1, 1.2, 1] : 1
          }}
          transition={{ duration: 0.5 }}
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isPositive 
              ? 'bg-gradient-to-br from-amber-400 to-yellow-500' 
              : 'bg-gradient-to-br from-red-400 to-orange-500'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-6 w-6 text-white" />
          ) : (
            <TrendingDown className="h-6 w-6 text-white" />
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
            className="flex items-center gap-2"
          >
            <Zap className={`h-5 w-5 ${isPositive ? 'text-accent-foreground' : 'text-destructive'}`} />
            <span className={`text-base font-semibold ${
              isPositive ? 'text-accent-foreground' : 'text-destructive'
            }`}>
              {isPositive ? '+' : ''}{notification.amount} XP
            </span>
          </motion.div>

          {/* Reasons */}
          {notification.reasons && notification.reasons.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {notification.reasons.map((reason, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-xs text-muted-foreground"
                >
                  {reason}
                </motion.p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 4, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-1 origin-left ${
          isPositive ? 'bg-accent' : 'bg-destructive'
        }`}
        style={{ width: '100%' }}
      />
    </motion.div>
  );
}
