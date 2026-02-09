import { motion } from "framer-motion";
import { Building2, Plus, TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, Lock, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PropFirmConnect from "@/components/PropFirmConnect";
import { useSubscription } from "@/hooks/use-subscription";
import { usePaymentSuccess } from "@/hooks/use-payment-success";

type PropFirmAccount = {
  id: string;
  propFirm: string;
  accountNumber: string;
  password: string;
  server: string;
  platform: 'mt4' | 'mt5';
  lastSync?: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  balance?: number;
  equity?: number;
  dailyPnl?: number;
  trades?: number;
  openTrades?: number;
  profit?: number;
};

export default function PropFirmAccounts() {
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<PropFirmAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  usePaymentSuccess();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cw_propfirm_accounts');
      if (saved) {
        setAccounts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load prop firm accounts:', e);
    }
    setIsLoading(false);
  }, []);

  // Listen for storage changes (when accounts are added/synced)
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('cw_propfirm_accounts');
      if (saved) {
        setAccounts(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorage);
    
    // Also poll for changes every second (for same-tab updates)
    const interval = setInterval(() => {
      const saved = localStorage.getItem('cw_propfirm_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (JSON.stringify(parsed) !== JSON.stringify(accounts)) {
          setAccounts(parsed);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [accounts]);

  // Calculate totals - only count accounts with actual data
  const totals = accounts.reduce((acc, account) => {
    if (account.status === 'connected' && account.balance) {
      acc.totalBalance += account.balance || 0;
      acc.totalEquity += account.equity || 0;
      acc.totalDailyPnl += account.dailyPnl || 0;
      acc.totalTrades += account.trades || 0;
      acc.accountsWithData += 1;
    }
    if (account.status === 'connected') {
      acc.connectedAccounts += 1;
    }
    return acc;
  }, {
    totalBalance: 0,
    totalEquity: 0,
    totalDailyPnl: 0,
    totalTrades: 0,
    connectedAccounts: 0,
    accountsWithData: 0,
  });

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      {!hasFeature('propfirm_integration') && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-xl mb-2">Pro Feature</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Upgrade to Pro for automatic prop firm account integration and real-time trading synchronization.
              </p>`/checkout?tier=pro&returnTo=${window.location.pathname}`
              <Button onClick={() => navigate('/checkout?tier=pro&returnTo=/propfirm')} size="lg" className="w-full">
                Upgrade to Pro - €19.99/mo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      <div className={hasFeature('propfirm_integration') ? '' : 'blur-sm pointer-events-none'}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-6xl p-4 lg:p-8"
        >
          {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              Prop Firm Accounts
            </h1>
            <p className="mt-1 text-muted-foreground">
              Connect and manage all your Prop Firm trading accounts
            </p>
          </div>
        </div>

        {/* Stats Overview - Only show if there are accounts with actual data */}
        {totals.accountsWithData > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Total Balance */}
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-xl bg-primary/20 p-2.5">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Gesamt Balance</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${totals.totalBalance.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totals.connectedAccounts} Account{totals.connectedAccounts !== 1 ? 's' : ''} verbunden
              </p>
            </div>

            {/* Total Equity */}
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-xl bg-secondary/20 p-2.5">
                  <Activity className="h-5 w-5 text-secondary-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Gesamt Equity</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${totals.totalEquity.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-xs mt-1 ${totals.totalEquity >= totals.totalBalance ? 'text-accent-foreground' : 'text-destructive'}`}>
                {totals.totalEquity >= totals.totalBalance ? '📈' : '📉'} {((totals.totalEquity / totals.totalBalance - 1) * 100).toFixed(2)}% vom Start
              </p>
            </div>

            {/* Daily P&L */}
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`rounded-xl p-2.5 ${totals.totalDailyPnl >= 0 ? 'bg-accent/20' : 'bg-destructive/20'}`}>
                  {totals.totalDailyPnl >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-accent-foreground" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">Heute</span>
              </div>
              <p className={`text-2xl font-bold ${totals.totalDailyPnl >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                {totals.totalDailyPnl >= 0 ? '+' : ''}${totals.totalDailyPnl.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tages-Performance
              </p>
            </div>

            {/* Total Trades */}
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-xl bg-muted/40 p-2.5">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Trades heute</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {totals.totalTrades}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                across all accounts
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card p-6 shadow-card"
        >
          <PropFirmConnect />
        </motion.div>

        {/* Info Section */}
        {accounts.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-6"
          >
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5" /> So funktioniert's</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">1. Choose Prop Firm</strong> - Find your prop firm in the list (FTMO, The5ers, E8, etc.)
              </p>
              <p>
                <strong className="text-foreground">2. Enter MT4/MT5 Data</strong> - Account number, investor password, and server from your prop firm email
              </p>
              <p>
                <strong className="text-foreground">3. Automatic Synchronization</strong> - Your trades will be automatically imported and analyzed
              </p>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-accent-foreground flex items-start gap-2">
                <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><strong>100% Secure:</strong> With the investor password we can only read - never trade or withdraw money.</span>
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
      </div>
    </main>
  );
}
