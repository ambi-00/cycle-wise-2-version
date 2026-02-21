import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StrategyDef = {
  name: string;
  minConfirmations?: number;
  confirmations?: string[];
  markets?: string[];
  timeframes?: string[];
  winRate?: number;
  avgR?: number;
  tradesCount?: number;
  score?: number;
};

export default function StrategyList() {
  const [strategies, setStrategies] = useState<StrategyDef[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cw_strategies');
      if (!raw) return setStrategies([]);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const list: StrategyDef[] = parsed.map((p: any) => (typeof p === 'string' ? { name: p } : p));
        setStrategies(list);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const remove = (name: string) => {
    const filtered = strategies.filter((s) => s.name !== name);
    setStrategies(filtered);
    localStorage.setItem('cw_strategies', JSON.stringify(filtered));
  };

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="mx-auto max-w-7xl p-4 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Strategy Manager</h1>
            <p className="text-sm text-muted-foreground">Create and manage strategies and minimum confirmations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/strategies/new')}>New Strategy</Button>
          </div>
        </div>

        <div className="grid gap-4">
          {strategies.length === 0 && (
            <Card className="p-6">No strategies yet. Click "New Strategy" to add one.</Card>
          )}

          {strategies.map((s) => (
            <Card key={s.name} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg font-semibold">{s.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(s.markets || []).map((m) => (
                      <span key={m} className="rounded-lg bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{m}</span>
                    ))}
                    {(s.timeframes || []).map((t) => (
                      <span key={t} className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                    <div className="font-bold">{s.winRate ?? 0}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Avg R</div>
                    <div className="font-bold">{s.avgR ?? 0}R</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Trades</div>
                    <div className="font-bold">{s.tradesCount ?? 0}</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary">
                    <span className="text-lg font-bold text-primary">{s.score ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmation Checklist</p>
                <div className="mt-3 space-y-2">
                  {(s.confirmations || []).slice(0, 4).map((conf, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-accent-foreground">•</span>
                      {conf}
                    </div>
                  ))}
                  {(s.confirmations || []).length > 4 && (
                    <p className="text-xs text-muted-foreground">+{(s.confirmations || []).length - 4} more confirmations</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link to={`/strategies/edit/${encodeURIComponent(s.name)}`} className="">
                  <Button variant="outline">Edit</Button>
                </Link>
                <Button variant="destructive" onClick={() => remove(s.name)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
