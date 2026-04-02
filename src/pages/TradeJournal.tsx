import { motion } from "framer-motion";
import { Plus, Filter, Download, Upload, TrendingUp, TrendingDown, Search, CheckCircle, AlertCircle, Lightbulb, X, Zap, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { deleteTradeEverywhere } from "@/lib/tradeLoaders";
import { loadCycleSettings, loadPeriodDates } from "@/lib/demoDataLoaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, lazy, Suspense, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { MTTradeEnrichmentDialog } from "@/components/MTTradeEnrichmentDialog";
import { usePaymentSuccess } from "@/hooks/use-payment-success";
const QuickTradeEntry = lazy(() => import("@/components/QuickTradeEntry").then((m) => ({ default: m.QuickTradeEntry })));
import { useLocation, Link, useNavigate } from "react-router-dom";

// Load trades from localStorage keys `cw_journal_{YYYY-MM-DD}`
const loadStoredTrades = (dateFilter: string) => {
  try {
    if (dateFilter) {
      const raw = localStorage.getItem(`cw_journal_${dateFilter}`);
      if (!raw) return [];
      const data = JSON.parse(raw);
      // Map cycle_phase (from Supabase) to cyclePhase (camelCase for UI)
      return (data.trades || []).map((t: any) => ({ 
        ...t,
        cyclePhase: t.cyclePhase || t.cycle_phase || t.phase,
        tfSmall: t.tfSmall || t.timeframe_small || t.timeframe || null,
        tfLarge: t.tfLarge || t.timeframe_large || t.higher_timeframe || null,
        rMultiple: t.rMultiple ?? t.closed_rrr ?? t.r_multiple ?? null,
      })).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    const trades: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (key.startsWith("cw_journal_")) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw);
          // Map cycle_phase (from Supabase) to cyclePhase (camelCase for UI)
          (data.trades || []).forEach((t: any) => trades.push({ 
            ...t,
            cyclePhase: t.cyclePhase || t.cycle_phase || t.phase,
            tfSmall: t.tfSmall || t.timeframe_small || t.timeframe || null,
            tfLarge: t.tfLarge || t.timeframe_large || t.higher_timeframe || null,
            rMultiple: t.rMultiple ?? t.closed_rrr ?? t.r_multiple ?? null,
          }));
        } catch (e) {
          // ignore parse errors
        }
      }
    }
    // fill missing cycle info for older entries
    try {
      const cycleSettings = loadCycleSettings();
      const last = cycleSettings.lastPeriodStart;
      const avg = cycleSettings.avgCycleLength;
      const per = cycleSettings.periodLength;
      const msPerDay = 1000 * 60 * 60 * 24;
      if (last) {
        for (const t of trades) {
          try {
            if (!t.date) continue;
            if (!t.cyclePhase || t.cycleDay == null) {
              const d = new Date(t.date);
              const l = new Date(last);
              const diff = Math.floor((d.getTime() - l.getTime()) / msPerDay);
              const cd = (((diff % avg) + avg) % avg) + 1;
              const follicularEnd = Math.min(per + 7, avg);
              const ovulationEnd = Math.min(per + 11, avg);
              t.cycleDay = cd;
              t.cyclePhase = cd <= per ? 'menstruation' : cd <= follicularEnd ? 'follicular' : cd <= ovulationEnd ? 'ovulation' : 'luteal';
            }
          } catch (e) {
            // ignore per-item
          }
        }
      }
    } catch (e) {
      // ignore
    }

    return trades.sort((a, b) => {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  } catch (e) {
    return [];
  }
};

// Parse MT4/MT5 CSV export
const parseCSV = (content: string): any[] => {
  const lines = content.split('\n').filter(l => l.trim());
  const trades: any[] = [];
  
  // Detect format: MT4 HTML report or CSV
  const isHTML = content.includes('<table') || content.includes('<tr');
  
  if (isHTML) {
    // Parse MT4 HTML report
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const rows = doc.querySelectorAll('tr');
    
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 8) {
        const ticket = cells[0]?.textContent?.trim();
        const openTime = cells[1]?.textContent?.trim();
        const type = cells[2]?.textContent?.trim()?.toLowerCase();
        const size = cells[3]?.textContent?.trim();
        const symbol = cells[4]?.textContent?.trim();
        const openPrice = cells[5]?.textContent?.trim();
        const closePrice = cells[8]?.textContent?.trim();
        const profit = cells[cells.length - 1]?.textContent?.trim();
        
        if (ticket && !isNaN(Number(ticket)) && (type === 'buy' || type === 'sell')) {
          const pnl = parseFloat(profit?.replace(/[^\d.-]/g, '') || '0');
          trades.push({
            id: `mt4-${ticket}-${Date.now()}`,
            instrument: symbol || 'Unknown',
            direction: type,
            entryPrice: parseFloat(openPrice || '0'),
            exitPrice: parseFloat(closePrice || '0'),
            positionSize: parseFloat(size || '0'),
            pnl: pnl,
            result: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
            date: openTime?.split(' ')[0]?.replace(/\./g, '-') || new Date().toISOString().split('T')[0],
            strategy: 'Imported',
            notes: `MT4 Ticket #${ticket}`,
            createdAt: Date.now(),
          });
        }
      }
    });
  } else {
    // Parse CSV format
    const delimiter = lines[0]?.includes(';') ? ';' : ',';
    const header = lines[0]?.toLowerCase() || '';
    
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 4) continue;
      
      // Try to detect columns
      let symbol = '', type = '', pnl = 0, date = '', size = 0, openPrice = 0, closePrice = 0;
      
      if (header.includes('symbol') || header.includes('ticket')) {
        // Standard MT4/MT5 CSV
        const headerCols = lines[0].split(delimiter).map(c => c.trim().toLowerCase().replace(/^"|"$/g, ''));
        const symIdx = headerCols.findIndex(h => h.includes('symbol') || h.includes('item'));
        const typeIdx = headerCols.findIndex(h => h.includes('type') || h.includes('direction'));
        const profitIdx = headerCols.findIndex(h => h.includes('profit') || h.includes('pnl') || h.includes('p/l'));
        const dateIdx = headerCols.findIndex(h => h.includes('time') || h.includes('date') || h.includes('open'));
        const sizeIdx = headerCols.findIndex(h => h.includes('volume') || h.includes('lots') || h.includes('size'));
        const openIdx = headerCols.findIndex(h => h.includes('open') && h.includes('price'));
        const closeIdx = headerCols.findIndex(h => h.includes('close') && h.includes('price'));
        
        symbol = cols[symIdx] || cols[0] || 'Unknown';
        type = (cols[typeIdx] || '').toLowerCase();
        pnl = parseFloat(cols[profitIdx]?.replace(/[^\d.-]/g, '') || '0');
        date = cols[dateIdx]?.split(' ')[0]?.replace(/\./g, '-') || new Date().toISOString().split('T')[0];
        size = parseFloat(cols[sizeIdx] || '0');
        openPrice = parseFloat(cols[openIdx] || '0');
        closePrice = parseFloat(cols[closeIdx] || '0');
      } else {
        // Generic CSV - assume first few columns
        symbol = cols[0] || 'Unknown';
        type = (cols[1] || 'buy').toLowerCase();
        pnl = parseFloat(cols[cols.length - 1]?.replace(/[^\d.-]/g, '') || '0');
        date = new Date().toISOString().split('T')[0];
      }
      
      if (symbol && (type.includes('buy') || type.includes('sell') || type.includes('long') || type.includes('short'))) {
        trades.push({
          id: `csv-${i}-${Date.now()}`,
          instrument: symbol,
          direction: type.includes('buy') || type.includes('long') ? 'buy' : 'sell',
          entryPrice: openPrice,
          exitPrice: closePrice,
          positionSize: size,
          pnl: pnl,
          result: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
          date: date,
          strategy: 'Imported',
          notes: 'CSV Import',
          createdAt: Date.now() + i,
        });
      }
    }
  }
  
  return trades;
};

// Save imported trades to localStorage
const saveImportedTrades = (newTrades: any[]) => {
  // Group by date
  const byDate: Record<string, any[]> = {};
  newTrades.forEach(t => {
    const d = t.date || new Date().toISOString().split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(t);
  });
  
  // Merge with existing trades for each date
  Object.entries(byDate).forEach(([date, trades]) => {
    const key = `cw_journal_${date}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{"trades":[]}');
    existing.trades = [...(existing.trades || []), ...trades];
    localStorage.setItem(key, JSON.stringify(existing));
  });
};

export default function TradeJournal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasFeature } = useSubscription();
  const params = new URLSearchParams(location.search);
  const dateFilter = params.get("date") || "";
  const newOpen = params.get("new") === "1";
  const strategyFilter = params.get("strategy") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [trades, setTrades] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ tradeId: string; tradeLabel: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loadingMTTrades, setLoadingMTTrades] = useState(false);
  const [enrichmentDialog, setEnrichmentDialog] = useState<{
    isOpen: boolean;
    tradeId?: string;
    symbol?: string;
    openTime?: string;
  }>({ isOpen: false });
  
  // Filter states
  const [resultFilter, setResultFilter] = useState<string>("");
  const [directionFilter, setDirectionFilter] = useState<string>("");
  const [cyclePhaseFilter, setCyclePhaseFilter] = useState<string>("");
  const [minR, setMinR] = useState<string>("");
  const [maxR, setMaxR] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Show success message if user was redirected from Stripe
  usePaymentSuccess();

  // Get today's date for display
  const today = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayLabel = `${weekDayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  // Delete a trade from localStorage and Supabase
  const handleDeleteTrade = async (tradeId: string) => {
    const deleted = await deleteTradeEverywhere(tradeId);
    if (deleted) {
      setTrades(prev => prev.filter(t =>
        t.id ? t.id !== tradeId : String(t.createdAt || '') !== tradeId
      ));
      window.dispatchEvent(new Event('trades-updated'));
      toast({ title: 'Trade deleted', description: 'The trade has been removed from your journal.' });
    }
    setDeleteDialog(null);
  };

  // Export trades as CSV
  const handleExport = () => {
    if (trades.length === 0) {
      toast({
        title: "No trades yet",
        description: "Add some trades first before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    const headers = ['Date', 'Instrument', 'Direction', 'Entry Price', 'Exit Price', 'Position Size', 'P&L', 'Result', 'Strategy', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...trades.map(t => [
        t.date || '',
        t.symbol || t.instrument || '',
        t.direction || '',
        t.entryPrice || '',
        t.exitPrice || '',
        t.positionSize || '',
        t.pnl || 0,
        t.result || '',
        t.strategy || '',
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cyclewise-trades-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const loadTrades = () => setTrades(loadStoredTrades(dateFilter));
    loadTrades();
    // reload on storage events (works cross-tab and same-tab with custom event)
    window.addEventListener('storage', loadTrades);
    // Also listen for focus to catch any changes
    window.addEventListener('focus', loadTrades);
    // Listen for trades-updated custom event (same-tab saves via saveTrade/updateTrade)
    window.addEventListener('trades-updated', loadTrades);
    return () => {
      window.removeEventListener('storage', loadTrades);
      window.removeEventListener('focus', loadTrades);
      window.removeEventListener('trades-updated', loadTrades);
    };
  }, [dateFilter]);

  // Auto-scroll to trades table when date filter is active
  useEffect(() => {
    if (dateFilter && trades.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const tradesSection = document.querySelector('.trades-table-section');
        if (tradesSection) {
          tradesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [dateFilter, trades.length]);

  // Load MT Trades from Supabase
  useEffect(() => {
    const loadMTTrades = async () => {
      setLoadingMTTrades(true);
      try {
        const { data: mtTrades, error } = await (supabase
          .from('mt_trades') as any)
          .select('*')
          .order('open_time', { ascending: false });

        if (error) throw error;

        if (mtTrades && mtTrades.length > 0) {
          const convertedTrades = mtTrades.map((t: any) => ({
            id: `mt-${t.id}`,
            mtTradeId: t.id, // Store original ID for enrichment
            instrument: t.symbol,
            direction: t.cmd === 'buy' || t.cmd === '0' ? 'long' : 'short',
            entryPrice: parseFloat(t.open_price || 0),
            exitPrice: parseFloat(t.close_price || 0),
            positionSize: parseFloat(t.volume || 0),
            pnl: parseFloat(t.profit || 0),
            result: parseFloat(t.profit || 0) > 0 ? 'win' : parseFloat(t.profit || 0) < 0 ? 'loss' : 'breakeven',
            date: t.open_time ? new Date(t.open_time).toISOString().split('T')[0] : '',
            time: t.open_time ? new Date(t.open_time).toLocaleTimeString() : '',
            strategy: 'MetaTrader',
            notes: `Ticket #${t.ticket}`,
            isMTTrade: true,
            mtData: {
              ticket: t.ticket,
              screenshot_url: t.screenshot_url,
              entry_reason: t.entry_reason,
              rrr: t.rrr,
              position_size: t.position_size,
              is_enriched: t.is_enriched,
            },
            createdAt: new Date(t.open_time).getTime(),
          }));

          setTrades((prev) => {
            // Remove old MT trades and add new ones
            const nonMTTrades = prev.filter((t: any) => !t.isMTTrade);
            return [...nonMTTrades, ...convertedTrades].sort(
              (a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)
            );
          });
        }
      } catch (err: any) {
        console.error('Error loading MT trades:', err);
      } finally {
        setLoadingMTTrades(false);
      }
    };

    loadMTTrades();
  }, []);

  const filteredTrades = trades
    .filter((trade: any) =>
      (trade.instrument || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trade.strategy || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((trade: any) => (strategyFilter ? trade.strategy === strategyFilter : true))
    .filter((trade: any) => (dateFilter ? trade.date === dateFilter : true))
    .filter((trade: any) => (resultFilter ? trade.result === resultFilter : true))
    .filter((trade: any) => (directionFilter ? trade.direction === directionFilter : true))
    .filter((trade: any) => (cyclePhaseFilter ? trade.cyclePhase === cyclePhaseFilter : true))
    .filter((trade: any) => {
      // Handle closed_rrr (from Supabase), r_multiple, or rMultiple (from localStorage)
      const rValue = trade.closed_rrr !== undefined ? trade.closed_rrr : (trade.r_multiple !== undefined ? trade.r_multiple : trade.rMultiple);
      if (minR && rValue != null) return rValue >= parseFloat(minR);
      return true;
    })
    .filter((trade: any) => {
      // Handle closed_rrr (from Supabase), r_multiple, or rMultiple (from localStorage)
      const rValue = trade.closed_rrr !== undefined ? trade.closed_rrr : (trade.r_multiple !== undefined ? trade.r_multiple : trade.rMultiple);
      if (maxR && rValue != null) return rValue <= parseFloat(maxR);
      return true;
    })
    .filter((trade: any) => {
      if (dateFrom && trade.date) return trade.date >= dateFrom;
      return true;
    })
    .filter((trade: any) => {
      if (dateTo && trade.date) return trade.date <= dateTo;
      return true;
    })
    .sort((a: any, b: any) => {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  
  const activeFiltersCount = [resultFilter, directionFilter, cyclePhaseFilter, minR, maxR, dateFrom, dateTo].filter(Boolean).length;

  const getResultBadge = (result: string, pnl: number) => {
    const styles = {
      win: "bg-accent/50 text-accent-foreground",
      loss: "bg-destructive/10 text-destructive",
      breakeven: "bg-muted text-muted-foreground",
    };
    return (
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[result as keyof typeof styles]}`}>
          {result}
        </span>
        <span className={`text-sm font-semibold ${pnl > 0 ? "text-accent-foreground" : pnl < 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {pnl > 0 ? "+" : ""}{pnl > 0 ? "$" : "-$"}{Math.abs(pnl)}
        </span>
      </div>
    );
  };

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl p-4 lg:p-8"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">Trade Journal</h1>
            <p className="mt-1 text-muted-foreground">Track and analyze your trading performance</p>
            <p className="mt-2 text-sm font-medium text-primary">{currentDayLabel}</p>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.htm,.html,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImporting(true);
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const content = event.target?.result as string;
                    const parsed = parseCSV(content);
                    if (parsed.length > 0) {
                      saveImportedTrades(parsed);
                      setTrades(loadStoredTrades(dateFilter));
                      toast({
                        title: "Import successful",
                        description: `${parsed.length} trades added to your journal.`,
                      });
                    } else {
                      toast({
                        title: "No trades found",
                        description: "The file doesn't contain any recognizable trades.",
                        variant: "destructive",
                      });
                    }
                  } catch (err) {
                    toast({
                      title: "Import failed",
                      description: "Couldn't read the file. Please try another format.",
                      variant: "destructive",
                    });
                  }
                  setImporting(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                };
                reader.readAsText(file);
              }}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import CSV'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="hero" size="sm" onClick={() => navigate('/trade/new')}>
              <Plus className="h-4 w-4" />
              New Trade
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {(() => {
            const totalTrades = trades.length;
            const wins = trades.filter(t => t.result === 'win').length;
            const losses = trades.filter(t => t.result === 'loss').length;
            const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(0) : 0;
            const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            // Handle closed_rrr (from Supabase), r_multiple, or rMultiple (from localStorage)
            const bestR = trades.reduce((max, t) => {
              const rValue = t.closed_rrr !== undefined ? t.closed_rrr : (t.r_multiple !== undefined ? t.r_multiple : t.rMultiple);
              return Math.max(max, rValue || 0);
            }, 0);
            const bestRTrade = trades.find(t => {
              const rValue = t.closed_rrr !== undefined ? t.closed_rrr : (t.r_multiple !== undefined ? t.r_multiple : t.rMultiple);
              return rValue === bestR;
            });
            const bestRStrategy = bestRTrade?.strategy || '—';
            
            const stats = [
              { label: "Total Trades", value: totalTrades.toString(), trend: `${wins}W / ${losses}L` },
              { label: "Win Rate", value: `${winRate}%`, trend: totalTrades > 0 ? `${wins} wins of ${totalTrades} trades` : 'No trades yet' },
              { label: "Total P&L", value: `$${totalPnL.toLocaleString()}`, trend: totalPnL >= 0 ? '↑ Profit' : '↓ Loss' },
              { label: "Best R-Multiple", value: bestR > 0 ? `${bestR.toFixed(1)}R` : '—', trend: bestR > 0 ? bestRStrategy : 'No R data' },
            ];
            
            return stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-card p-5 shadow-card"
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.trend}</p>
              </motion.div>
            ));
          })()}
        </div>

        {newOpen && (
          <div className="mb-6">
            <div className="rounded-2xl bg-card p-6">
              <h3 className="font-semibold text-foreground">New Trade</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add a quick trade for {dateFilter || 'selected date'}</p>
              <div className="mt-4">
                <Suspense fallback={<div className="rounded-2xl bg-card p-4 shadow-card" />}>
                  <QuickTradeEntry
                    safetyModeEnabled={false}
                    onNewTrade={(t) => {
                    if (dateFilter) {
                      try {
                        const key = `cw_journal_${dateFilter}`;
                        const raw = localStorage.getItem(key);
                        let curr: any = { quickNote: "", trades: [], mood: 5, confidence: 5, lessons: "", attachments: [] };
                        if (raw) curr = JSON.parse(raw);
                        // compute cycle info for this date
                        const msPerDay = 1000 * 60 * 60 * 24;
                        const last = localStorage.getItem('cw_lastPeriodStart');
                        const avg = Number(localStorage.getItem('cw_avgCycleLength') || 28);
                        const per = Number(localStorage.getItem('cw_periodLength') || 5);
                        let cycleDay: number | null = null;
                        let cyclePhase: string | null = null;
                        try {
                          if (last) {
                            const d = new Date(dateFilter);
                            const l = new Date(last);
                            const diff = Math.floor((d.getTime() - l.getTime()) / msPerDay);
                            const cd = (((diff % avg) + avg) % avg) + 1;
                            cycleDay = cd;
                            const follicularEnd = Math.min(per + 7, avg);
                            const ovulationEnd = Math.min(per + 11, avg);
                            cyclePhase = cd <= per ? 'menstruation' : cd <= follicularEnd ? 'follicular' : cd <= ovulationEnd ? 'ovulation' : 'luteal';
                          }
                        } catch (e) {
                          // ignore
                        }

                        const newT = {
                          id: Date.now().toString(),
                          instrument: t.instrument || 'Unknown',
                          direction: t.direction,
                          rMultiple: t.rMultiple ?? null,
                          pnl: t.pnl ?? null,
                          strategy: t.strategy ?? '',
                          date: dateFilter,
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          cycleDay,
                          cyclePhase,
                        };
                        curr.trades = [...(curr.trades || []), newT];
                        localStorage.setItem(key, JSON.stringify(curr));
                        window.dispatchEvent(new CustomEvent('trades-updated'));
                        navigate(`/journal?date=${dateFilter}`);
                      } catch (e) {
                        console.error(e);
                      }
                    } else {
                      window.dispatchEvent(new CustomEvent('trades-updated'));
                      navigate('/journal');
                    }
                  }}
                />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search trades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {dateFilter && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
              {/* Previous Day Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const currentDate = new Date(dateFilter);
                  currentDate.setDate(currentDate.getDate() - 1);
                  const newDate = currentDate.toISOString().slice(0, 10);
                  navigate(`/journal?date=${newDate}`);
                }}
                title="Vorheriger Tag"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="rounded-lg bg-primary/10 border-2 border-primary/30 p-3 shadow-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Filtered by date</p>
                <p className="text-lg font-bold text-primary mt-0.5">{new Date(dateFilter).toLocaleDateString('de-DE', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</p>
              </div>

              {/* Next Day Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const currentDate = new Date(dateFilter);
                  currentDate.setDate(currentDate.getDate() + 1);
                  const today = new Date().toISOString().slice(0, 10);
                  const newDate = currentDate.toISOString().slice(0, 10);
                  // Don't allow future dates
                  if (newDate <= today) {
                    navigate(`/journal?date=${newDate}`);
                  }
                }}
                disabled={dateFilter >= new Date().toISOString().slice(0, 10)}
                title="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Link to="/journal">
                <Button variant="outline" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  Clear filter
                </Button>
              </Link>
            </div>
          )}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Filter Trades</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResultFilter("");
                        setDirectionFilter("");
                        setCyclePhaseFilter("");
                        setMinR("");
                        setMaxR("");
                        setDateFrom("");
                        setDateTo("");
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Result</Label>
                  <Select value={resultFilter} onValueChange={setResultFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All results" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All results</SelectItem>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                      <SelectItem value="breakeven">Breakeven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select value={directionFilter} onValueChange={setDirectionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All directions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All directions</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasFeature('advanced_filters') && (
                  <>
                <div className="space-y-2">
                  <Label>Cycle Phase</Label>
                  <Select value={cyclePhaseFilter} onValueChange={setCyclePhaseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All phases" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All phases</SelectItem>
                      <SelectItem value="menstruation">Menstruation</SelectItem>
                      <SelectItem value="follicular">Follicular</SelectItem>
                      <SelectItem value="ovulation">Ovulation</SelectItem>
                      <SelectItem value="luteal">Luteal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>R-Multiple Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min R"
                      value={minR}
                      onChange={(e) => setMinR(e.target.value)}
                      step="0.1"
                    />
                    <Input
                      type="number"
                      placeholder="Max R"
                      value={maxR}
                      onChange={(e) => setMaxR(e.target.value)}
                      step="0.1"
                    />
                  </div>
                </div>
                  </>
                )}

                {!hasFeature('advanced_filters') && (
                  <div className="col-span-2 p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">
                      Unlock Cycle Phase and R-Multiple filters with <button type="button" className="underline font-medium" onClick={() => navigate(`/checkout?tier=premium&returnTo=${window.location.pathname}`)}>Premium</button>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Trades Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="trades-table-section rounded-2xl bg-card shadow-card overflow-hidden"
        >
          <div className="bg-muted/30 px-6 py-4 border-b">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              {dateFilter ? `Trades on ${new Date(dateFilter).toLocaleDateString('de-DE', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : 'All Trades'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'} found
              {dateFilter && <span className="ml-1 font-semibold text-primary">• Date filter active</span>}
            </p>
          </div>
          {filteredTrades.length === 0 ? (
            <div className="text-center p-12">
              <div className="mx-auto w-fit rounded-full bg-primary/10 p-6">
                <Lightbulb className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">No Trades Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery ? "No trades match your search criteria. Try a different search term." : "Start building your trading journal by logging your first trade."}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/new-trade')} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Log Your First Trade
                </Button>
              )}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instrument</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direction</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Timeframes</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">R</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Strategy</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Phase</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Rating</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade, index) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/trade/new?id=${trade.id}&date=${trade.date}`)}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{trade.date}</p>
                        <p className="text-xs text-muted-foreground">{trade.time}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{trade.instrument}</span>
                        {trade.isMTTrade && (
                          <Badge variant="outline" className="text-xs gap-1 flex items-center">
                            <Zap className="h-3 w-3" />
                            MT4/MT5
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                        trade.direction === "long" ? "bg-accent/30 text-accent-foreground" : "bg-destructive/10 text-destructive"
                      }`}>
                        {trade.direction === "long" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trade.direction}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {trade.isMTTrade ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Entry</span>
                          <span className="text-sm font-medium">${trade.entryPrice?.toFixed(5)}</span>
                          <span className="text-xs text-muted-foreground">Exit</span>
                          <span className="text-sm font-medium">${trade.exitPrice?.toFixed(5)}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Small</span>
                          <span className="text-sm font-medium">{trade.tfSmall || trade.tf || '—'}</span>
                          <span className="text-xs text-muted-foreground">Context</span>
                          <span className="text-sm font-medium">{trade.tfLarge || '—'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">{getResultBadge(trade.result, trade.pnl)}</td>
                    <td className={`px-4 py-4 text-sm font-bold ${
                      (trade.rMultiple ?? 0) > 0 ? "text-accent-foreground" : (trade.rMultiple ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {trade.isMTTrade && trade.mtData?.rrr ? (
                        <>1:{trade.mtData.rrr}</>
                      ) : trade.rMultiple != null ? (
                        <>{trade.rMultiple > 0 ? "+" : ""}{Number(trade.rMultiple).toFixed(1)}R</>
                      ) : (
                        <span className="text-muted-foreground font-normal">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground hidden lg:table-cell">{trade.strategy}</td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{trade.cyclePhase || '—'}</span>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      {trade.rating ? (
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <span key={star} className={`text-base ${star <= trade.rating ? 'text-yellow-400' : 'text-muted/30'}`}>★</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/trade/new?id=${trade.id}&date=${trade.date}`); }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Edit trade"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ tradeId: trade.id, tradeLabel: `${trade.instrument || 'Trade'} on ${trade.date}` }); }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Delete trade"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </motion.div>

        {/* Delete Trade Confirmation Dialog */}
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

        {/* MT Trade Enrichment Dialog */}
        <MTTradeEnrichmentDialog
          isOpen={enrichmentDialog.isOpen}
          onClose={() => setEnrichmentDialog({ isOpen: false })}
          tradeId={enrichmentDialog.tradeId || ''}
          symbol={enrichmentDialog.symbol || ''}
          openTime={enrichmentDialog.openTime || ''}
          onSuccess={() => {
            // Reload MT trades after enrichment
            window.location.reload();
          }}
        />
      </motion.div>
    </main>
  );
}