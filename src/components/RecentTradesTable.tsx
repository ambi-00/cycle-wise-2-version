import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MoreHorizontal, Lightbulb, Plus, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { deleteTradeFromLocalStorage } from "@/lib/tradeLoaders";

interface Trade {
  id: string;
  date: string;
  instrument: string;
  direction: "long" | "short";
  result: "win" | "loss" | "breakeven";
  rMultiple: number;
  strategy: string;
  cyclePhase: string;
}

interface RecentTradesTableProps {
  trades: Trade[];
  onDelete?: (tradeId: string) => void;
}

export function RecentTradesTable({ trades, onDelete }: RecentTradesTableProps) {
  const navigate = useNavigate();
  const [deleteDialog, setDeleteDialog] = useState<{ tradeId: string; tradeLabel: string } | null>(null);

  const handleDeleteTrade = (tradeId: string) => {
    const deleted = deleteTradeFromLocalStorage(tradeId);
    if (deleted) {
      onDelete?.(tradeId);
      window.dispatchEvent(new Event('trades-updated'));
    }
    setDeleteDialog(null);
  };
  const getResultStyles = (result: Trade["result"]) => {
    switch (result) {
      case "win":
        return "bg-accent/50 text-accent-foreground";
      case "loss":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Empty state when no trades
  if (trades.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card p-8 shadow-card text-center"
      >
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
          <Lightbulb className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">No Trades Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Start logging your trades to build your trading journal and unlock AI insights.
        </p>
        <Button onClick={() => navigate('/trade/new')} className="mt-4 gap-2">
          <Plus className="h-4 w-4" />
          Log Your First Trade
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-foreground">Recent Trades</h3>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="pb-3">Date</th>
              <th className="pb-3">Instrument</th>
              <th className="pb-3">Dir.</th>
              <th className="pb-3">Result</th>
              <th className="pb-3">R</th>
              <th className="pb-3 hidden sm:table-cell">Phase</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <motion.tr
                key={trade.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => navigate(`/trade/new?id=${trade.id}&date=${trade.date}`)}
              >
                <td className="py-3 text-sm text-foreground">
                  {trade.iso ? (
                    <Link to={`/day/${trade.iso}?journal=1`} className="text-primary underline">{trade.date}</Link>
                  ) : (
                    trade.date
                  )}
                </td>
                <td className="py-3 text-sm font-medium text-foreground">{trade.instrument}</td>
                <td className="py-3">
                  {trade.direction === "long" ? (
                    <TrendingUp className="h-4 w-4 text-accent-foreground" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                </td>
                <td className="py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getResultStyles(trade.result)}`}>
                    {trade.result}
                  </span>
                </td>
                <td className={`py-3 text-sm font-semibold ${
                  trade.rMultiple > 0 ? "text-accent-foreground" : trade.rMultiple < 0 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {trade.rMultiple > 0 ? "+" : ""}{trade.rMultiple}R
                </td>
                <td className="py-3 hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground">{trade.cyclePhase}</span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/trade/new?id=${trade.id}&date=${trade.date}`); }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      title="Edit trade"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteDialog({ tradeId: trade.id, tradeLabel: `${trade.instrument} on ${trade.date}` }); }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete trade"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteDialog(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl border max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">Delete Trade?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteDialog.tradeLabel}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteDialog(null)} className="rounded-full px-4">
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteTrade(deleteDialog.tradeId)}
                className="rounded-full px-4 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}