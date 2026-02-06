import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldOff, AlertTriangle, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

interface SafetyModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  suggested?: boolean;
}

export function SafetyModeToggle({ enabled, onToggle, suggested }: SafetyModeToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [tradingPlatformUrl, setTradingPlatformUrl] = useState('');

  useEffect(() => {
    const url = localStorage.getItem('cw_trading_platform_url') || '';
    setTradingPlatformUrl(url);
  }, []);

  const handleToggle = (checked: boolean) => {
    if (enabled && !checked) {
      setShowConfirm(true);
    } else {
      onToggle(checked);
    }
  };

  return (
    <div className="relative">
      <motion.div
        layout
        className={`rounded-2xl p-5 transition-all duration-300 ${
          enabled
            ? "bg-gradient-to-br from-primary/20 to-secondary/30 border-2 border-primary/30"
            : "bg-card shadow-card"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              animate={enabled ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: enabled ? Infinity : 0 }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {enabled ? <Shield className="h-6 w-6" /> : <ShieldOff className="h-6 w-6" />}
            </motion.div>
            <div>
              <h4 className="font-semibold text-foreground">Safety Mode</h4>
              <p className="text-sm text-muted-foreground">
                {enabled ? "Trading features blocked" : "Trading features active"}
              </p>
            </div>
          </div>
          
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <AnimatePresence>
          {suggested && !enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-center gap-2 rounded-xl bg-secondary/70 p-3 text-secondary-foreground"
            >
          
          {enabled && tradingPlatformUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3"
            >
              <Globe className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Trading Platform Blocked</p>
                <p className="text-xs text-destructive/80 mt-1">
                  {tradingPlatformUrl} should be avoided while Safety Mode is active.
                </p>
              </div>
            </motion.div>
          )}
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm">
                Based on your cycle phase, we recommend activating Safety Mode
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/95 backdrop-blur-sm"
          >
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
              <p className="mt-3 font-medium text-foreground">Are you sure?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Disabling Safety Mode allows trading during sensitive phases
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onToggle(false);
                    setShowConfirm(false);
                  }}
                  className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                >
                  Disable
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}