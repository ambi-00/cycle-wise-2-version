import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export default function StrategyEdit() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<StrategyDef>({ name: '', minConfirmations: 0, confirmations: [], markets: [], timeframes: [], winRate: 0, avgR: 0, tradesCount: 0, score: 0 });
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cw_strategies');
      if (!raw) {
        setNotFound(true);
        return;
      }
      const parsed = JSON.parse(raw);
      const list: StrategyDef[] = Array.isArray(parsed) ? parsed.map((p: any) => (typeof p === 'string' ? { name: p } : p)) : [];
      if (name) {
        const decodedName = decodeURIComponent(name);
        const found = list.find((s) => s.name === decodedName);
        if (found) {
          setStrategy(found);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      }
    } catch (e) {
      console.error('Error loading strategy:', e);
      setNotFound(true);
    }
  }, [name]);

  const save = () => {
    try {
      const raw = localStorage.getItem('cw_strategies');
      const parsed = raw ? JSON.parse(raw) : [];
      const list: StrategyDef[] = Array.isArray(parsed) ? parsed.map((p: any) => (typeof p === 'string' ? { name: p } : p)) : [];
      // remove old with same name
      const filtered = list.filter((s) => s.name !== strategy.name);
      // normalize fields
      const toSave: StrategyDef = {
        ...strategy,
        markets: strategy.markets?.map((m) => m.trim()).filter(Boolean) || [],
        timeframes: strategy.timeframes?.map((t) => t.trim()).filter(Boolean) || [],
        confirmations: strategy.confirmations || [],
        minConfirmations: Number(strategy.minConfirmations) || 0,
        winRate: Number(strategy.winRate) || 0,
        avgR: Number(strategy.avgR) || 0,
        tradesCount: Number(strategy.tradesCount) || 0,
        score: Number(strategy.score) || 0,
      };
      filtered.unshift(toSave);
      localStorage.setItem('cw_strategies', JSON.stringify(filtered));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('strategies-updated'));
      
      navigate('/strategies');
    } catch (e) {
      console.error(e);
    }
  };

  if (notFound) {
    return (
      <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
        <div className="mx-auto max-w-4xl p-4 lg:p-8">
          <Card>
            <div className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2 text-destructive">Strategy Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The strategy "{name ? decodeURIComponent(name) : ''}" could not be found.
              </p>
              <Button onClick={() => navigate('/strategies')}>
                Back to Strategies
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="mx-auto max-w-4xl p-4 lg:p-8">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">{name ? 'Edit Strategy' : 'New Strategy'}</h2>
            <div className="grid gap-3">
              <Input value={strategy.name} onChange={(e) => setStrategy({ ...strategy, name: e.target.value })} placeholder="Strategy name" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={(strategy.markets || []).join(', ')} onChange={(e) => setStrategy({ ...strategy, markets: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Markets (comma separated) e.g. Forex, Indices" />
                <Input value={(strategy.timeframes || []).join(', ')} onChange={(e) => setStrategy({ ...strategy, timeframes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Timeframes e.g. 1H,15M" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Input type="number" value={String(strategy.winRate ?? 0)} onChange={(e) => setStrategy({ ...strategy, winRate: Number(e.target.value) })} placeholder="Win Rate %" />
                <Input type="number" value={String(strategy.avgR ?? 0)} onChange={(e) => setStrategy({ ...strategy, avgR: Number(e.target.value) })} placeholder="Avg R" />
                <Input type="number" value={String(strategy.tradesCount ?? 0)} onChange={(e) => setStrategy({ ...strategy, tradesCount: Number(e.target.value) })} placeholder="Trades Count" />
                <Input type="number" value={String(strategy.score ?? 0)} onChange={(e) => setStrategy({ ...strategy, score: Number(e.target.value) })} placeholder="Score" />
              </div>

              <Input type="number" value={String(strategy.minConfirmations ?? 0)} onChange={(e) => setStrategy({ ...strategy, minConfirmations: Number(e.target.value) || 0 })} placeholder="Minimum confirmations" />

              <div>
                <label className="text-sm font-medium">Entry Signals / Confirmations</label>
                <div className="mt-2 space-y-2">
                  {(strategy.confirmations || []).map((conf, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input value={conf} onChange={(e) => {
                        const copy = [...(strategy.confirmations || [])];
                        copy[idx] = e.target.value;
                        setStrategy({ ...strategy, confirmations: copy });
                      }} />
                      <Button variant="outline" size="sm" onClick={() => {
                        const copy = [...(strategy.confirmations || [])];
                        copy.splice(idx, 1);
                        setStrategy({ ...strategy, confirmations: copy });
                      }}>Remove</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (idx === 0) return;
                        const copy = [...(strategy.confirmations || [])];
                        const tmp = copy[idx - 1];
                        copy[idx - 1] = copy[idx];
                        copy[idx] = tmp;
                        setStrategy({ ...strategy, confirmations: copy });
                      }}>↑</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (idx === (strategy.confirmations || []).length - 1) return;
                        const copy = [...(strategy.confirmations || [])];
                        const tmp = copy[idx + 1];
                        copy[idx + 1] = copy[idx];
                        copy[idx] = tmp;
                        setStrategy({ ...strategy, confirmations: copy });
                      }}>↓</Button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Input id="new-confirmation" placeholder="New confirmation" />
                    <Button onClick={() => {
                      const el = document.getElementById('new-confirmation') as HTMLInputElement | null;
                      const v = el?.value?.trim();
                      if (v) {
                        setStrategy({ ...strategy, confirmations: [...(strategy.confirmations || []), v] });
                        if (el) el.value = '';
                      }
                    }}>Add</Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={save}>Save Strategy</Button>
                <Button variant="ghost" onClick={() => navigate('/strategies')}>Cancel</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
