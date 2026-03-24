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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // Markets & Timeframes
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  
  // 1. Setup Confirmations (MERGED: Confirmations + Entry Triggers)
  const [setupConfirmations, setSetupConfirmations] = useState<string[]>([]);
  const [minConfirmations, setMinConfirmations] = useState<number>(1);
  
  // 2. Entry Trigger (SINGULAR - one specific trigger)
  const [entryTrigger, setEntryTrigger] = useState("");
  
  // 3. Stop Loss Rules (MERGED: SL Criteria + SL Type)
  const [slType, setSlType] = useState(""); // Dropdown: Fixed Pips, ATR-based, Structure-based, Order Block
  const [slDistance, setSlDistance] = useState(""); // e.g., "50 pips", "1.5x ATR"
  
  // 4. Exit Strategy (MERGED: Exit Criteria + Exit Rules + TP Type)
  const [tpType, setTpType] = useState(""); // Dropdown: Fixed RR, Next Level, Trailing, Manual
  const [exitOptions, setExitOptions] = useState<string[]>([]); // Multi-select: options user will choose from when closing trade
  
  // Risk Management (SIMPLIFIED)
  const [riskPerTrade, setRiskPerTrade] = useState("1");
  const [riskRewardRatio, setRiskRewardRatio] = useState("2");
  
  // Input states
  const [newSetupConfirmation, setNewSetupConfirmation] = useState("");
  const [newExitOption, setNewExitOption] = useState("");

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

  const addSetupConfirmation = () => {
    if (newSetupConfirmation.trim()) {
      setSetupConfirmations([...setupConfirmations, newSetupConfirmation.trim()]);
      setNewSetupConfirmation("");
    }
  };

  const removeSetupConfirmation = (index: number) => {
    setSetupConfirmations(setupConfirmations.filter((_, i) => i !== index));
  };

  const addExitOption = () => {
    if (newExitOption.trim()) {
      setExitOptions([...exitOptions, newExitOption.trim()]);
      setNewExitOption("");
    }
  };

  const removeExitOption = (index: number) => {
    setExitOptions(exitOptions.filter((_, i) => i !== index));
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
      setupConfirmations, // NEW: Merged confirmations
      minConfirmations, // Min required confirmations
      entryTrigger, // NEW: Single trigger
      slType, // NEW: SL type dropdown
      slDistance, // NEW: SL distance
      tpType, // NEW: TP type dropdown
      exitOptions, // NEW: Exit options for dropdown in trade
      riskPerTrade: parseFloat(riskPerTrade),
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

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('strategies-updated'));

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

        {/* 1. Setup Confirmations (MERGED) */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Confirmations ✅</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              What must be present BEFORE entering a trade? These will appear as checkboxes when logging trades.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., HTF Trend Alignment, FVG Present, Market Structure Shift"
                value={newSetupConfirmation}
                onChange={(e) => setNewSetupConfirmation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSetupConfirmation()}
              />
              <Button onClick={addSetupConfirmation}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {setupConfirmations.map((confirmation, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-primary/10 p-3"
                >
                  <span className="text-sm text-foreground">{confirmation}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSetupConfirmation(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {setupConfirmations.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No setup confirmations added yet
                </p>
              )}
            </div>

            {setupConfirmations.length > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Minimum required to enter a trade</p>
                  <p className="text-xs text-muted-foreground">How many of the {setupConfirmations.length} confirmations must be checked before you can log the trade?</p>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={setupConfirmations.length}
                  value={minConfirmations}
                  onChange={(e) => setMinConfirmations(Math.min(setupConfirmations.length, Math.max(1, Number(e.target.value))))}
                  className="w-20 text-center font-semibold text-base"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Entry Trigger (SINGULAR) */}
        <Card>
          <CardHeader>
            <CardTitle>Entry Trigger 🎯</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              The ONE specific signal that triggers you to enter this trade
            </p>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., Price taps Order Block + Volume spike"
              value={entryTrigger}
              onChange={(e) => setEntryTrigger(e.target.value)}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* 3. Stop Loss Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Stop Loss Rules 🛑</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slType">SL Type</Label>
              <Select value={slType} onValueChange={setSlType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select SL type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed-pips">Fixed Pips</SelectItem>
                  <SelectItem value="atr-based">ATR-based</SelectItem>
                  <SelectItem value="structure-based">Structure-based (Swing/Break)</SelectItem>
                  <SelectItem value="order-block">Below/Above Order Block</SelectItem>
                  <SelectItem value="percentage">Percentage-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="slDistance">SL Distance/Rule</Label>
              <Input
                id="slDistance"
                placeholder="e.g., '50 pips', '1.5x ATR', 'Below last swing low'"
                value={slDistance}
                onChange={(e) => setSlDistance(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Take Profit / Exit Strategy */}
        <Card>
          <CardHeader>
            <CardTitle>Take Profit / Exit Strategy 🎯</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tpType">TP Type</Label>
              <Select value={tpType} onValueChange={setTpType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select TP type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed-rr">Fixed Risk:Reward Ratio</SelectItem>
                  <SelectItem value="next-level">Next Major Level</SelectItem>
                  <SelectItem value="trailing">Trailing Stop</SelectItem>
                  <SelectItem value="manual">Manual Exit</SelectItem>
                  <SelectItem value="time-based">Time-based Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Exit Options (when closing trade)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                These will appear in the dropdown when you close a trade with this strategy
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Hit TP at 2:1 RR, Last High/Low, Liquidity Zone, Break of Structure"
                  value={newExitOption}
                  onChange={(e) => setNewExitOption(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addExitOption()}
                />
                <Button onClick={addExitOption}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 mt-3">
                {exitOptions.map((option, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-primary/10 p-3"
                  >
                    <span className="text-sm text-foreground">{option}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExitOption(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {exitOptions.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No exit options added yet. Common examples: "Hit TP at 2:1", "Last High/Low", "Liquidity Zone Hit"
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Management (SIMPLIFIED) */}
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
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
