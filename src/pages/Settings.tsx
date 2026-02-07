import { motion } from "framer-motion";
import { User, Bell, Shield, Download, Trash2, Calendar, Sun, Moon, Building2, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import ThemeCustomizer from "@/components/ThemeCustomizer";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const [tradingPlatformUrl, setTradingPlatformUrl] = useState(() => {
    return localStorage.getItem('cw_trading_platform_url') || '';
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (tradingPlatformUrl) {
      localStorage.setItem('cw_trading_platform_url', tradingPlatformUrl);
    } else {
      localStorage.removeItem('cw_trading_platform_url');
    }
  }, [tradingPlatformUrl]);

  const isDark = mounted ? theme === "dark" : false;

  const toggleTheme = (val: boolean) => {
    setTheme(val ? "dark" : "light");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-3xl p-4 lg:p-8"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile moved to dedicated Profile page (top-right avatar) */}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-2xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-cycle-follicular/30 p-2.5">
              <Calendar className="h-5 w-5 text-cycle-follicular" />
            </div>
            <h2 className="font-semibold text-foreground">Cycle Settings & Safety Mode</h2>
          </div>
          <p className="text-sm text-muted-foreground">These controls moved to the Cycle Tracker for quicker access while trading.</p>
          <div className="mt-4">
            <Link to="/cycle-tracker">
              <Button variant="outline">Open Cycle Tracker</Button>
            </Link>
          </div>
        </motion.section>

        {/* Theme */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 rounded-2xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-muted p-2.5">
              <Sun className="h-5 w-5 text-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Theme</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Appearance</p>
              <p className="text-sm text-muted-foreground">Choose between Light and Dark modes</p>
            </div>
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <Switch checked={isDark} onCheckedChange={(v) => toggleTheme(Boolean(v))} />
              <Sun className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Accent Color Selection */}
          <div className="mt-6 pt-6 border-t border-border">
            <ThemeCustomizer />
          </div>
        </motion.section>

        {/* Prop Firm Integrations - Link to dedicated page */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 rounded-2xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-blue-500/20 p-2.5">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="font-semibold text-foreground">Prop Firm Accounts</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect and sync your prop firm trading accounts.
          </p>
        </motion.section>

        {/* Safety Mode - Trading Platform Blocker */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8 rounded-2xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-destructive/20 p-2.5">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="font-semibold text-foreground">Safety Mode - Website Blocker</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Add your trading platform URL to receive warnings when Safety Mode is active.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Trading Platform URL</label>
              <Input
                type="url"
                placeholder="https://trading.com or https://metatrader.com"
                value={tradingPlatformUrl}
                onChange={(e) => setTradingPlatformUrl(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Example: https://www.tradingview.com, https://trader.ftmo.com, etc.
              </p>
            </div>

            {tradingPlatformUrl && (
              <div className="rounded-xl bg-accent/10 border border-accent/20 p-3">
                <p className="text-sm text-accent-foreground">
                  ✓ Wenn Safety Mode aktiv ist, wirst du gewarnt, bevor du tradest.
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/*  className="text-sm text-muted-foreground">Connect your MT4/MT5 Prop Firm accounts for automatic trade synchronization.</p>
          <div className="mt-4">
            <Link to="/prop-firms">
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Prop Firms
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 rounded-2xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-accent/50 p-2.5">
              <Bell className="h-5 w-5 text-accent-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Daily trading reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about optimal trading windows</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Cycle phase alerts</p>
                <p className="text-sm text-muted-foreground">Know when you enter a new phase</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Challenge updates</p>
                <p className="text-sm text-muted-foreground">Leaderboard changes and achievements</p>
              </div>
              <Switch />
            </div>
          </div>
        </motion.section>

        {/* Data & Privacy */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-muted p-2.5">
              <Download className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Data & Privacy</h2>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export All Data (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Generate Monthly Report (PDF)
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </motion.section>

        {/* Logout */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8 rounded-2xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-destructive/10 p-2.5">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="font-semibold text-foreground">Account</h2>
          </div>

          <Button 
            onClick={handleLogout}
            className="w-full justify-start bg-destructive hover:bg-destructive/90"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </motion.section>
      </motion.div>
    </main>
  );
}