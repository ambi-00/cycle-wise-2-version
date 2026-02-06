import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, CheckCircle, Edit, Trash2, BarChart3, Plus, Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const mockStrategies = [
  {
    id: "1",
    name: "ICT Silver Bullet",
    description: "High-probability setups focusing on institutional order flow and liquidity grabs during kill zones",
    markets: ["Forex", "Indices"],
    timeframes: ["1H", "15M"],
    winRate: 72,
    avgR: 2.1,
    tradesCount: 45,
    profitFactor: 2.4,
    maxDrawdown: 8.5,
    confirmations: [
      "Market structure shift",
      "FVG/OB mitigation",
      "Kill zone timing (London/NY)",
      "Volume confirmation",
      "Higher timeframe bias",
      "Liquidity sweep complete",
      "Price in premium/discount"
    ],
    rules: [
      "Only trade during London or New York kill zones (2am-5am or 7am-10am EST)",
      "Must have clear market structure shift on higher timeframe",
      "Wait for price to fill FVG or react at order block",
      "Volume must confirm the move",
      "Risk no more than 1% per trade"
    ],
    score: 87,
  },
  {
    id: "2",
    name: "SMC Sweep & Grab",
    description: "Smart Money Concepts strategy targeting liquidity sweeps followed by strong reversals",
    markets: ["Forex"],
    timeframes: ["4H", "1H"],
    winRate: 65,
    avgR: 1.8,
    tradesCount: 32,
    profitFactor: 2.1,
    maxDrawdown: 12.3,
    confirmations: [
      "Liquidity sweep (stop hunt)",
      "Order block reaction",
      "Break of structure",
      "Displacement candle",
      "Change of character confirmed",
      "Market maker pattern identified"
    ],
    rules: [
      "Identify clear liquidity pools on charts",
      "Wait for sweep and immediate reversal",
      "Entry only after break of structure",
      "Stop loss below/above swept liquidity",
      "Target previous high/low or FVG"
    ],
    score: 74,
  },
  {
    id: "3",
    name: "Supply & Demand Zones",
    description: "Classic supply and demand strategy focusing on fresh zones with strong reactions",
    markets: ["Crypto", "Indices"],
    timeframes: ["Daily", "4H"],
    winRate: 58,
    avgR: 1.5,
    tradesCount: 28,
    profitFactor: 1.8,
    maxDrawdown: 15.7,
    confirmations: [
      "Fresh zone (untested)",
      "Trend alignment",
      "Multiple timeframe confirmation",
      "Volume spike at origin",
      "Strong departure from zone",
      "Clean zone without overlap"
    ],
    rules: [
      "Only trade fresh, untested zones",
      "Must align with higher timeframe trend",
      "Enter on first touch of zone",
      "Set stop loss beyond the zone",
      "Take profit at next major level"
    ],
    score: 62,
  },
];

export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const strategy = mockStrategies.find(s => s.id === id);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setExampleTrade(prev => ({
        ...prev,
        screenshots: [...prev.screenshots, ...newFiles]
      }));
    }
  };

  const removeScreenshot = (index: number) => {
    setExampleTrade(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const handleSaveExample = () => {
    // TODO: Save to Supabase
    toast({
      title: "Example trade added",
      description: "Your example trade has been saved to this strategy",
    });
    setShowExampleDialog(false);
    setExampleTrade({
      pair: "",
      direction: "",
      entryPrice: "",
      exitPrice: "",
      stopLoss: "",
      takeProfit: "",
      riskReward: "",
      outcome: "",
      notes: "",
      screenshots: [],
    });
  };

  
  const [showExampleDialog, setShowExampleDialog] = useState(false);
  const [exampleTrade, setExampleTrade] = useState({
    pair: "",
    direction: "",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    riskReward: "",
    outcome: "",
    notes: "",
    screenshots: [] as File[],
  });

  if (!strategy) {
    return (
      <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          <p>Strategy not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl p-4 lg:p-8"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/strategies")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Strategies
        </Button>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold text-foreground">{strategy.name}</h1>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary">
                <span className="text-lg font-bold text-primary">{strategy.score}</span>
              </div>
            </div>
            <p className="mt-3 text-muted-foreground leading-relaxed">{strategy.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {strategy.markets.map(market => (
                <span key={market} className="rounded-lg bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                  {market}
                </span>
              ))}
              {strategy.timeframes.map(tf => (
                <span key={tf} className="rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  {tf}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{strategy.winRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Avg R</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{strategy.avgR}R</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{strategy.tradesCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Profit Factor</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{strategy.profitFactor}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Max DD</p>
              <p className="mt-2 text-3xl font-bold text-destructive">{strategy.maxDrawdown}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Confirmations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent-foreground" />
                Confirmation Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strategy.confirmations.map((conf, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-foreground" />
                    <span className="text-sm text-foreground">{conf}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        {/* Add Example Trade Button */}
        <div className="mt-8 flex justify-center">
          <Dialog open={showExampleDialog} onOpenChange={setShowExampleDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Example Trade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Example Trade</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Trade Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="pair">Trading Pair</Label>
                    <Input
                      id="pair"
                      placeholder="e.g., EUR/USD"
                      value={exampleTrade.pair}
                      onChange={(e) => setExampleTrade({...exampleTrade, pair: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="direction">Direction</Label>
                    <Select value={exampleTrade.direction} onValueChange={(value) => setExampleTrade({...exampleTrade, direction: value})}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Entry/Exit/SL/TP */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="entry">Entry Price</Label>
                    <Input
                      id="entry"
                      type="number"
                      step="0.00001"
                      placeholder="1.08500"
                      value={exampleTrade.entryPrice}
                      onChange={(e) => setExampleTrade({...exampleTrade, entryPrice: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exit">Exit Price</Label>
                    <Input
                      id="exit"
                      type="number"
                      step="0.00001"
                      placeholder="1.08900"
                      value={exampleTrade.exitPrice}
                      onChange={(e) => setExampleTrade({...exampleTrade, exitPrice: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sl">Stop Loss</Label>
                    <Input
                      id="sl"
                      type="number"
                      step="0.00001"
                      placeholder="1.08300"
                      value={exampleTrade.stopLoss}
                      onChange={(e) => setExampleTrade({...exampleTrade, stopLoss: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tp">Take Profit</Label>
                    <Input
                      id="tp"
                      type="number"
                      step="0.00001"
                      placeholder="1.09000"
                      value={exampleTrade.takeProfit}
                      onChange={(e) => setExampleTrade({...exampleTrade, takeProfit: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* R:R and Outcome */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="rr">Risk:Reward Ratio</Label>
                    <Input
                      id="rr"
                      placeholder="e.g., 1:2"
                      value={exampleTrade.riskReward}
                      onChange={(e) => setExampleTrade({...exampleTrade, riskReward: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="outcome">Outcome</Label>
                    <Select value={exampleTrade.outcome} onValueChange={(value) => setExampleTrade({...exampleTrade, outcome: value})}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="win">Win</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                        <SelectItem value="breakeven">Break Even</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Trade Notes & Analysis</Label>
                  <Textarea
                    id="notes"
                    placeholder="Describe what you saw, why you entered, what confirmations were present..."
                    value={exampleTrade.notes}
                    onChange={(e) => setExampleTrade({...exampleTrade, notes: e.target.value})}
                    rows={5}
                    className="mt-1.5"
                  />
                </div>

                {/* Screenshots Upload */}
                <div>
                  <Label>TradingView Screenshots</Label>
                  <div className="mt-2 rounded-lg border-2 border-dashed border-muted p-6 text-center">
                    <input
                      type="file"
                      id="screenshots"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="screenshots" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Click to upload screenshots or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG up to 10MB each
                      </p>
                    </label>
                  </div>

                  {/* Screenshot Previews */}
                  {exampleTrade.screenshots.length > 0 && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {exampleTrade.screenshots.map((file, index) => (
                        <div key={index} className="relative rounded-lg border bg-muted/30 p-3">
                          <div className="flex items-center gap-3">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScreenshot(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowExampleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveExample}>
                    Save Example Trade
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trading Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strategy.rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-primary/5 p-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{rule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Analytics */}
        <Card className="mt-6 bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Performance Analytics
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  View detailed analytics for this strategy - Win/Loss breakdown, time analysis, common mistakes, and improvement suggestions
                </p>
              </div>
              <Button 
                size="lg"
                onClick={() => navigate(`/strategies/${id}/analytics`)}
              >
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
