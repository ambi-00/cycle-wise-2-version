import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const marketOptions = ["Forex", "Indices", "Crypto", "Stocks", "Commodities"];
const timeframeOptions = [
  ["15S", "30S", "1M", "2M", "3M", "5M", "10M", "15M", "30M", "45M"],
  ["1H", "2H", "3H", "4H", "6H", "8H", "12H", "Daily", "Weekly", "Monthly"]
];

export default function NewStrategy() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Show AI tip on component mount
  useEffect(() => {
    toast({
      title: "💡 AI Tip",
      description: "The more detailed your strategy, the better you can track performance. Performance metrics (Win Rate, Avg R, etc.) will be calculated automatically as you log trades using this strategy.",
      duration: 8000,
    });
  }, []);

  // Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // Markets & Timeframes
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  
  // Strategy Details
  const [confirmations, setConfirmations] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [entryTriggers, setEntryTriggers] = useState<string[]>([]);
  const [exitRules, setExitRules] = useState<string[]>([]);
  const [exitCriteria, setExitCriteria] = useState<string[]>([]); // NEW: Dropdown exit criteria
  
  // Risk Management
  const [riskPerTrade, setRiskPerTrade] = useState("1");
  const [stopLossType, setStopLossType] = useState("");
  const [takeProfitType, setTakeProfitType] = useState("");
  const [riskRewardRatio, setRiskRewardRatio] = useState("2");
  
  // Input states
  const [newConfirmation, setNewConfirmation] = useState("");
  const [newRule, setNewRule] = useState("");
  const [newEntryTrigger, setNewEntryTrigger] = useState("");
  const [newExitRule, setNewExitRule] = useState("");
  const [newExitCriteria, setNewExitCriteria] = useState(""); // NEW

  // Example Trade Dialog
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

  const toggleMarket = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market]
    );
  };

  const toggleTimeframe = (tf: string) => {
    setSelectedTimeframes(prev =>
      prev.includes(tf) ? prev.filter(t => t !== tf) : [...prev, tf]
    );
  };

  const addConfirmation = () => {
    if (newConfirmation.trim()) {
      setConfirmations([...confirmations, newConfirmation.trim()]);
      setNewConfirmation("");
    }
  };

  const removeConfirmation = (index: number) => {
    setConfirmations(confirmations.filter((_, i) => i !== index));
  };

  const addRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const addEntryTrigger = () => {
    if (newEntryTrigger.trim()) {
      setEntryTriggers([...entryTriggers, newEntryTrigger.trim()]);
      setNewEntryTrigger("");
    }
  };

  const removeEntryTrigger = (index: number) => {
    setEntryTriggers(entryTriggers.filter((_, i) => i !== index));
  };

  const addExitRule = () => {
    if (newExitRule.trim()) {
      setExitRules([...exitRules, newExitRule.trim()]);
      setNewExitRule("");
    }
  };

  const removeExitRule = (index: number) => {
    setExitRules(exitRules.filter((_, i) => i !== index));
  };

  const addExitCriteria = () => {
    if (newExitCriteria.trim()) {
      setExitCriteria([...exitCriteria, newExitCriteria.trim()]);
      setNewExitCriteria("");
    }
  };

  const removeExitCriteria = (index: number) => {
    setExitCriteria(exitCriteria.filter((_, i) => i !== index));
  };

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

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a strategy name",
        variant: "destructive",
      });
      return;
    }

    if (selectedMarkets.length === 0) {
      toast({
        title: "Market required",
        description: "Please select at least one market",
        variant: "destructive",
      });
      return;
    }

    if (selectedTimeframes.length === 0) {
      toast({
        title: "Timeframe required",
        description: "Please select at least one timeframe",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    const newStrategy = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      markets: selectedMarkets,
      timeframes: selectedTimeframes,
      confirmations,
      entryTriggers,
      exitRules,
      exitCriteria, // NEW: Exit criteria dropdown options
      generalRules: rules,
      riskPerTrade: parseFloat(riskPerTrade),
      stopLossType,
      takeProfitType,
      riskRewardRatio: parseFloat(riskRewardRatio),
      winRate: 0,
      avgR: 0,
      tradesCount: 0,
      score: 0,
      createdAt: new Date().toISOString(),
    };

    const existingStrategies = JSON.parse(localStorage.getItem('cw_strategies') || '[]');
    existingStrategies.push(newStrategy);
    localStorage.setItem('cw_strategies', JSON.stringify(existingStrategies));

    toast({
      title: "Strategy created",
      description: "Your strategy has been saved successfully",
    });
    
    navigate("/strategies");
  };

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-4xl space-y-6 px-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/strategies")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">New Strategy</h1>
              <p className="text-muted-foreground">
                Create a new trading strategy
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/strategies")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Create Strategy</Button>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Strategy Name</Label>
              <Input
                id="name"
                placeholder="e.g., Order Block Breakout"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your strategy..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Markets & Timeframes */}
        <Card>
          <CardHeader>
            <CardTitle>Markets & Timeframes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Markets</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {marketOptions.map((market) => (
                  <Badge
                    key={market}
                    variant={selectedMarkets.includes(market) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMarket(market)}
                  >
                    {market}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Timeframes</Label>
              <div className="mt-2 space-y-2">
                {timeframeOptions.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex flex-wrap gap-2">
                    {row.map((tf) => (
                      <Badge
                        key={tf}
                        variant={selectedTimeframes.includes(tf) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTimeframe(tf)}
                      >
                        {tf}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entry Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Entry Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What confirmations must be present before entering a trade?
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Higher timeframe trend alignment"
                value={newConfirmation}
                onChange={(e) => setNewConfirmation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addConfirmation()}
              />
              <Button onClick={addConfirmation}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {confirmations.map((confirmation, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-primary/10 p-3"
                >
                  <span className="text-sm text-foreground">{confirmation}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeConfirmation(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {confirmations.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No confirmations added yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SL Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>SL Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What specific signals trigger you to enter this trade?
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Price breaks above order block with volume"
                value={newEntryTrigger}
                onChange={(e) => setNewEntryTrigger(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addEntryTrigger()}
              />
              <Button onClick={addEntryTrigger}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {entryTriggers.map((trigger, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-accent/20 p-3"
                >
                  <span className="text-sm text-foreground">{trigger}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntryTrigger(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {entryTriggers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No SL criteria added yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exit Criteria - NEW */}
        <Card>
          <CardHeader>
            <CardTitle>Exit/TP Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define your specific exit/take-profit criteria. You'll select from these when closing trades.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Last High/Low, Inducement, Support/Resistance, Fixed TP"
                value={newExitCriteria}
                onChange={(e) => setNewExitCriteria(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addExitCriteria()}
              />
              <Button onClick={addExitCriteria}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {exitCriteria.map((criteria, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-primary/10 p-3"
                >
                  <span className="text-sm text-foreground">{criteria}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExitCriteria(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {exitCriteria.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No exit criteria added yet. Common examples: Last High/Low, Inducement Level, 2:1 RR, Time-based Exit
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exit Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Exit Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When do you exit this trade? (Take profit & stop loss criteria)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Take profit at next major resistance"
                value={newExitRule}
                onChange={(e) => setNewExitRule(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addExitRule()}
              />
              <Button onClick={addExitRule}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {exitRules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-destructive/10 p-3"
                >
                  <span className="text-sm text-foreground">{rule}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExitRule(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {exitRules.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No exit rules added yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="risk">Risk per Trade (%)</Label>
                <Input
                  id="risk"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  placeholder="1"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="rr">Target Risk:Reward Ratio</Label>
                <Input
                  id="rr"
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.1"
                  placeholder="2"
                  value={riskRewardRatio}
                  onChange={(e) => setRiskRewardRatio(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stopLoss">Stop Loss Type</Label>
              <Input
                id="stopLoss"
                placeholder="e.g., Below order block, ATR-based, Fixed pips"
                value={stopLossType}
                onChange={(e) => setStopLossType(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="takeProfit">Take Profit Type</Label>
              <Input
                id="takeProfit"
                placeholder="e.g., Next major level, R:R target, Trailing stop"
                value={takeProfitType}
                onChange={(e) => setTakeProfitType(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* General Rules */}
        <Card>
          <CardHeader>
            <CardTitle>General Trading Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Any other important rules or conditions for this strategy
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Only trade during London kill zone"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addRule()}
              />
              <Button onClick={addRule}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-primary/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{rule}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {rules.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No general rules added yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Example Trade Section */}
        <Card>
          <CardHeader>
            <CardTitle>Example Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add example trades to document how this strategy works in practice
            </p>
            <Dialog open={showExampleDialog} onOpenChange={setShowExampleDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Example Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Example Trade</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Trade Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="pair">Currency Pair / Asset</Label>
                      <Input
                        id="pair"
                        placeholder="e.g., EURUSD, BTCUSD"
                        value={exampleTrade.pair}
                        onChange={(e) => setExampleTrade({...exampleTrade, pair: e.target.value})}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="direction">Direction</Label>
                      <Select
                        value={exampleTrade.direction}
                        onValueChange={(value) => setExampleTrade({...exampleTrade, direction: value})}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Long">Long</SelectItem>
                          <SelectItem value="Short">Short</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price Levels */}
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
                        placeholder="1.09000"
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
                        placeholder="1.08200"
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
                        placeholder="1.09500"
                        value={exampleTrade.takeProfit}
                        onChange={(e) => setExampleTrade({...exampleTrade, takeProfit: e.target.value})}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Trade Metadata */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="rr">Risk:Reward Ratio</Label>
                      <Input
                        id="rr"
                        placeholder="e.g., 1:2, 1:3"
                        value={exampleTrade.riskReward}
                        onChange={(e) => setExampleTrade({...exampleTrade, riskReward: e.target.value})}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="outcome">Outcome</Label>
                      <Select
                        value={exampleTrade.outcome}
                        onValueChange={(value) => setExampleTrade({...exampleTrade, outcome: value})}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Win">Win</SelectItem>
                          <SelectItem value="Loss">Loss</SelectItem>
                          <SelectItem value="Break Even">Break Even</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Trade Analysis / Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Describe what happened in this trade, what setups you saw, confirmations that were present, etc."
                      value={exampleTrade.notes}
                      onChange={(e) => setExampleTrade({...exampleTrade, notes: e.target.value})}
                      rows={4}
                      className="mt-1.5"
                    />
                  </div>

                  {/* Screenshots */}
                  <div>
                    <Label>Screenshots / Charts</Label>
                    <div className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center hover:border-muted-foreground/50 transition-colors">
                      <input
                        type="file"
                        id="screenshots"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
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
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
