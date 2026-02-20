import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface PropFirmAccount {
  id: string;
  propFirm: string;
  accountNumber: string;
  initialCost?: number;
  payoutHistory?: Array<{ date: string; amount: number }>;
  balance?: number;
  [key: string]: any;
}

export function PropFirmSummary() {
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [accountCount, setAccountCount] = useState(0);

  useEffect(() => {
    // Load all prop firm accounts from localStorage
    try {
      const accounts: PropFirmAccount[] = JSON.parse(
        localStorage.getItem("cw_propfirm_accounts") || "[]"
      );

      let totalExpensesSum = 0;
      let totalPayoutsSum = 0;

      accounts.forEach((account) => {
        // Add initial cost (subscription/challenge fee)
        if (account.initialCost) {
          totalExpensesSum += account.initialCost;
        }

        // Add all payouts
        if (account.payoutHistory && Array.isArray(account.payoutHistory)) {
          account.payoutHistory.forEach((payout) => {
            totalPayoutsSum += payout.amount || 0;
          });
        }
      });

      setTotalExpenses(totalExpensesSum);
      setTotalPayouts(totalPayoutsSum);
      setAccountCount(accounts.length);
    } catch (error) {
      console.error("Error loading prop firm accounts:", error);
    }
  }, []);

  const netProfit = totalPayouts - totalExpenses;
  const roi =
    totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : "0";
  const isProfit = netProfit >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-secondary/50 to-accent/30 p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-card p-2.5">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Prop Firm Summary</h3>
            <p className="text-xs text-muted-foreground">
              {accountCount} {accountCount === 1 ? "account" : "accounts"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowDownLeft className="h-3 w-3" />
            Expenses
          </div>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            ${totalExpenses.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpRight className="h-3 w-3" />
            Payouts
          </div>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            ${totalPayouts.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Net Profit</p>
            <p
              className={`text-2xl font-bold tabular-nums ${
                isProfit ? "text-accent-foreground" : "text-destructive"
              }`}
            >
              {isProfit ? "+" : "-"}${Math.abs(netProfit).toLocaleString()}
            </p>
          </div>
          <div
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 tabular-nums ${
              isProfit
                ? "bg-accent/50 text-accent-foreground"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">{roi}% ROI</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}