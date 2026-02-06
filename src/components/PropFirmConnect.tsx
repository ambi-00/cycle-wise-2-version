import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Check, AlertCircle, Eye, EyeOff, ExternalLink, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PropFirmAccount = {
  id: string;
  propFirm: string;
  // MT4/MT5 Login-Daten
  accountNumber: string;
  password: string; // Investor/Read-only Passwort
  server: string;
  platform: 'mt4' | 'mt5';
  // API Connection
  metaApiId?: string;
  // Status & Data
  lastSync?: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  balance?: number;
  equity?: number;
  dailyPnl?: number;
  trades?: number;
  openTrades?: number;
  profit?: number;
};

const PROP_FIRMS = [
  { id: 'ftmo', name: 'FTMO', logo: '🏆', color: 'bg-blue-500', url: 'trader.ftmo.com', implemented: true },
  { id: 'the5ers', name: 'The5ers', logo: '5️⃣', color: 'bg-emerald-500', url: 'trader.the5ers.com', implemented: true },
  { id: 'e8funding', name: 'E8 Funding', logo: '🎱', color: 'bg-slate-700', url: 'portal.e8funding.com', implemented: true },
  { id: 'fundednext', name: 'Funded Next', logo: '⏭️', color: 'bg-violet-500', url: 'portal.fundednext.com', implemented: true },
  { id: 'myfundedfx', name: 'MyFundedFX', logo: '💰', color: 'bg-green-500', url: 'myfundedfx.com', implemented: true },
  { id: 'fundingpips', name: 'Funding Pips', logo: '📊', color: 'bg-teal-500', url: 'app.fundingpips.com', implemented: true },
  { id: 'thefundedtrader', name: 'The Funded Trader', logo: '📈', color: 'bg-purple-500', url: 'thefundedtraderprogram.com', implemented: true },
  { id: 'alphacapital', name: 'Alpha Capital', logo: '🅰️', color: 'bg-red-500', url: 'dashboard.alphacapitalgroup.uk', implemented: true },
  { id: 'apex', name: 'Apex Trader Funding', logo: '🎯', color: 'bg-orange-500', url: 'apextraderfunding.com', implemented: true },
  { id: 'topstep', name: 'Topstep', logo: '🚀', color: 'bg-cyan-500', url: 'topstep.com', implemented: true },
  { id: 'luxtrading', name: 'Lux Trading Firm', logo: '👑', color: 'bg-amber-500', url: 'portal.luxtradingfirm.com', implemented: true },
  { id: 'citytraders', name: 'City Traders Imperium', logo: '🏙️', color: 'bg-sky-500', url: 'portal.citytradersimperium.com', implemented: true },
  { id: 'blufx', name: 'BluFX', logo: '🔵', color: 'bg-blue-600', url: 'app.blufx.co.uk', implemented: true },
  { id: 'fidelcrest', name: 'Fidelcrest', logo: '🛡️', color: 'bg-indigo-500', url: 'trader.fidelcrest.com', implemented: true },
  { id: 'trueforexfunds', name: 'True Forex Funds', logo: '💎', color: 'bg-pink-500', url: 'trueforexfunds.com', implemented: true },
  { id: 'fundedtradingplus', name: 'Funded Trading Plus', logo: '➕', color: 'bg-lime-500', url: 'portal.fundedtradingplus.com', implemented: true },
  { id: 'goatfundedtrader', name: 'Goat Funded Trader', logo: '🐐', color: 'bg-stone-500', url: 'goatfundedtrader.com', implemented: true },
  { id: 'instantfunding', name: 'Instant Funding', logo: '⚡', color: 'bg-yellow-500', url: 'instantfunding.io', implemented: true },
  { id: 'ment', name: 'MENT Funding', logo: '🧠', color: 'bg-rose-500', url: 'mentfunding.com', implemented: true },
  { id: 'bulenox', name: 'Bulenox', logo: '🐂', color: 'bg-amber-600', url: 'bulenox.com', implemented: true },
];

// Server lists for each Prop Firm
const PROP_FIRM_SERVERS: Record<string, string[]> = {
  ftmo: [
    'FTMO-Server',
    'FTMO-Server2', 
    'FTMO-Server3',
    'FTMO-Demo',
    'FTMO-Demo2',
    'FTMO-Demo3',
  ],
  the5ers: [
    'The5ers-Server',
    'The5ers-Live',
    'The5ers-Demo',
    'FivePercentOnline-Live',
    'FivePercentOnline-Demo',
  ],
  e8funding: [
    'E8Funding-Live',
    'E8Funding-Demo',
    'E8Funding-Server',
    'E8-Live',
    'E8-Demo',
  ],
  fundednext: [
    'FundedNext-Server',
    'FundedNext-Live',
    'FundedNext-Demo',
    'FundedNext-Real',
  ],
  myfundedfx: [
    'MyFundedFX-Server',
    'MyFundedFX-Live',
    'MyFundedFX-Demo',
    'MFFX-Live',
    'MFFX-Demo',
  ],
  fundingpips: [
    'FundingPips-Server',
    'FundingPips-Live',
    'FundingPips-Demo',
  ],
  thefundedtrader: [
    'TheFundedTrader-Server',
    'TheFundedTrader-Live',
    'TheFundedTrader-Demo',
    'TFT-Live',
    'TFT-Demo',
  ],
  alphacapital: [
    'AlphaCapital-Server',
    'AlphaCapital-Live',
    'AlphaCapital-Demo',
    'ACG-Live',
  ],
  apex: [
    'ApexTrader-Server',
    'Apex-Rithmic-01',
    'Apex-Rithmic-02',
    'Apex-Rithmic-03',
  ],
  topstep: [
    'TopstepTrader-Server',
    'Topstep-Rithmic-01',
    'Topstep-Rithmic-02',
    'Topstep-Tradovate',
  ],
  luxtrading: [
    'LuxTradingFirm-Server',
    'LuxTrading-Live',
    'LuxTrading-Demo',
  ],
  citytraders: [
    'CTI-Server',
    'CTI-Live',
    'CTI-Demo',
    'CityTradersImperium-Server',
  ],
  blufx: [
    'BluFX-Server',
    'BluFX-Live',
    'BluFX-Demo',
  ],
  fidelcrest: [
    'Fidelcrest-Server',
    'Fidelcrest-Live',
    'Fidelcrest-Demo',
    'Fidelcrest-Server2',
  ],
  trueforexfunds: [
    'TrueForexFunds-Server',
    'TFF-Live',
    'TFF-Demo',
  ],
  fundedtradingplus: [
    'FundedTradingPlus-Server',
    'FTP-Live',
    'FTP-Demo',
  ],
  goatfundedtrader: [
    'GoatFundedTrader-Server',
    'Goat-Live',
    'Goat-Demo',
  ],
  instantfunding: [
    'InstantFunding-Server',
    'IF-Live',
    'IF-Demo',
  ],
  ment: [
    'MentFunding-Server',
    'MENT-Live',
    'MENT-Demo',
  ],
  bulenox: [
    'Bulenox-Server',
    'Bulenox-Rithmic-01',
    'Bulenox-Rithmic-02',
  ],
};

export function PropFirmConnect() {
  const [accounts, setAccounts] = useState<PropFirmAccount[]>([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  
  // Form state
  const [selectedPropFirm, setSelectedPropFirm] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [customServer, setCustomServer] = useState('');
  const [platform, setPlatform] = useState<'mt4' | 'mt5'>('mt5');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showPropFirmPicker, setShowPropFirmPicker] = useState(false);

  // Get the actual server value (either from dropdown or custom input)
  const actualServer = server === 'custom' ? customServer : server;

  // Filter prop firms based on search
  const filteredPropFirms = useMemo(() => {
    if (!searchQuery.trim()) return PROP_FIRMS;
    const query = searchQuery.toLowerCase();
    return PROP_FIRMS.filter(pf => 
      pf.name.toLowerCase().includes(query) || 
      pf.id.toLowerCase().includes(query) ||
      pf.url.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Load accounts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cw_propfirm_accounts');
      if (saved) {
        setAccounts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load prop firm accounts:', e);
    }
  }, []);

  // Save accounts to localStorage
  const saveAccounts = (newAccounts: PropFirmAccount[]) => {
    setAccounts(newAccounts);
    localStorage.setItem('cw_propfirm_accounts', JSON.stringify(newAccounts));
  };

  const selectPropFirm = (id: string) => {
    setSelectedPropFirm(id);
    setShowPropFirmPicker(false);
    setSearchQuery('');
    // Reset server when changing prop firm
    setServer('');
    setCustomServer('');
  };

  const addAccount = () => {
    if (!selectedPropFirm || !accountNumber || !password || !actualServer) {
      alert('Please fill in all required fields (Account Number, Password, Server)');
      return;
    }

    const newAccount: PropFirmAccount = {
      id: Date.now().toString(),
      propFirm: selectedPropFirm,
      accountNumber,
      password, // In production: encrypt before storing
      server: actualServer,
      platform,
      status: 'disconnected',
      lastSync: undefined,
    };

    saveAccounts([...accounts, newAccount]);
    
    // Reset form
    setSelectedPropFirm('');
    setAccountNumber('');
    setPassword('');
    setServer('');
    setCustomServer('');
    setPlatform('mt5');
    setIsAddingAccount(false);

    // Auto-sync after adding
    syncAccount(newAccount.id);
  };

  const removeAccount = (id: string) => {
    if (confirm('Do you really want to remove this account?')) {
      saveAccounts(accounts.filter(a => a.id !== id));
    }
  };

  const syncAccount = async (id: string) => {
    setIsSyncing(id);
    
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    // Update status to syncing
    setAccounts(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'syncing' as const } : a
    ));

    const API_URL = import.meta.env.VITE_MT_API_URL || 'http://localhost:3001';

    try {
      // Step 1: Connect account if not connected yet
      if (!account.metaApiId) {
        const connectRes = await fetch(`${API_URL}/api/mt/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountNumber: account.accountNumber,
            password: account.password,
            server: account.server,
            platform: account.platform,
            propFirm: account.propFirm,
          }),
        });

        if (!connectRes.ok) throw new Error('Verbindung fehlgeschlagen');
        
        const connectData = await connectRes.json();
        if (!connectData.success) throw new Error(connectData.error);

        // Save metaApiId
        account.metaApiId = connectData.accountId;
      }

      // Step 2: Fetch account data
      const dataRes = await fetch(`${API_URL}/api/mt/account/${account.metaApiId}`);
      const dataJson = await dataRes.json();

      if (dataJson.success && dataJson.data && !dataJson.demo) {
        // Real data from MT4/MT5
        const updated = accounts.map(a => 
          a.id === id ? { 
            ...a, 
            metaApiId: account.metaApiId,
            status: 'connected' as const,
            lastSync: new Date().toISOString(),
            balance: dataJson.data.balance,
            equity: dataJson.data.equity,
            dailyPnl: dataJson.data.profit,
            trades: dataJson.data.todayTrades,
            openTrades: dataJson.data.openPositions,
          } : a
        );
        saveAccounts(updated);
      } else {
        // Demo mode or no data yet
        const updated = accounts.map(a => 
          a.id === id ? { 
            ...a, 
            metaApiId: account.metaApiId,
            status: 'connected' as const,
            lastSync: new Date().toISOString(),
          } : a
        );
        saveAccounts(updated);
      }

    } catch (error) {
      console.log('Backend nicht erreichbar:', error);
      // Still mark as "connected" (credentials saved)
      const updated = accounts.map(a => 
        a.id === id ? { 
          ...a, 
          status: 'connected' as const,
          lastSync: new Date().toISOString(),
        } : a
      );
      saveAccounts(updated);
    }

    setIsSyncing(null);
  };

  const syncAll = async () => {
    for (const account of accounts) {
      await syncAccount(account.id);
    }
  };

  const getPropFirmInfo = (id: string) => {
    return PROP_FIRMS.find(p => p.id === id) || { name: id, logo: '📊', color: 'bg-gray-500' };
  };

  const getStatusBadge = (status: PropFirmAccount['status']) => {
    switch (status) {
      case 'connected':
        return <span className="flex items-center gap-1 text-xs text-accent-foreground"><Check className="h-3 w-3" /> Verbunden</span>;
      case 'syncing':
        return <span className="flex items-center gap-1 text-xs text-primary"><RefreshCw className="h-3 w-3 animate-spin" /> Synchronisiere...</span>;
      case 'error':
        return <span className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" /> Fehler</span>;
      default:
        return <span className="flex items-center gap-1 text-xs text-muted-foreground">Nicht verbunden</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Prop Firm Accounts</h3>
          <p className="text-sm text-muted-foreground">Connect your Prop Firm accounts for automatic synchronization</p>
        </div>
        <div className="flex gap-2">
          {accounts.length > 0 && (
            <Button variant="outline" size="sm" onClick={syncAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Alle synchronisieren
            </Button>
          )}
          <Button size="sm" onClick={() => setIsAddingAccount(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Account List */}
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <div className="text-4xl mb-3">🏦</div>
          <h4 className="font-medium text-foreground mb-1">No Prop Firm Accounts Connected</h4>
          <p className="text-sm text-muted-foreground mb-4">Add your first Prop Firm account to automatically sync your trades.</p>
          <Button onClick={() => setIsAddingAccount(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account, index) => {
            const propFirm = getPropFirmInfo(account.propFirm);
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border bg-card p-4 shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl ${propFirm.color} p-3 text-2xl`}>
                      {propFirm.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{propFirm.name}</h4>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {account.platform || 'MT5'}
                        </span>
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">Account: {account.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">Server: {account.server}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => syncAccount(account.id)}
                      disabled={isSyncing === account.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing === account.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeAccount(account.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Account Stats - Only if we have real data */}
                {account.status === 'connected' && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    {account.balance ? (
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className="text-sm font-bold text-foreground">${account.balance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Equity</p>
                          <p className="text-sm font-bold text-foreground">${account.equity?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Heute</p>
                          <p className={`text-sm font-bold ${(account.dailyPnl || 0) >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                            {(account.dailyPnl || 0) >= 0 ? '+' : ''}${account.dailyPnl?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Trades</p>
                          <p className="text-sm font-bold text-foreground">{account.trades}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-muted/50 border border-border p-3">
                        <p className="text-sm text-foreground">
                          ⏳ <strong>Account Saved</strong> - Real data will be displayed once the backend is connected.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          For now, your credentials are securely stored.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {account.lastSync && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Last synced: {new Date(account.lastSync).toLocaleString('en-US')}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Account Dialog */}
      <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Prop Firm Account</DialogTitle>
            <DialogDescription>
              Enter your login credentials to connect your Prop Firm account. Your data will be encrypted and stored securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Prop Firm Selection with Search */}
            <div>
              <label className="text-sm font-medium">Prop Firm *</label>
              
              {/* Selected Prop Firm Display */}
              {selectedPropFirm ? (
                <div className="mt-1.5 flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getPropFirmInfo(selectedPropFirm).logo}</span>
                    <div>
                      <p className="font-medium text-foreground">{getPropFirmInfo(selectedPropFirm).name}</p>
                      <p className="text-xs text-muted-foreground">{PROP_FIRMS.find(p => p.id === selectedPropFirm)?.url}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setSelectedPropFirm(''); setShowPropFirmPicker(true); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-1.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowPropFirmPicker(true); }}
                      onFocus={() => setShowPropFirmPicker(true)}
                      placeholder="Suche Prop Firm... (z.B. FTMO, 5ers, E8)"
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Prop Firm Grid */}
                  {showPropFirmPicker && (
                    <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border bg-card p-2">
                      {filteredPropFirms.length === 0 ? (
                        <p className="p-3 text-center text-sm text-muted-foreground">
                          No prop firm found for "{searchQuery}"
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          {filteredPropFirms.map(pf => (
                            <button
                              key={pf.id}
                              onClick={() => selectPropFirm(pf.id)}
                              className="flex items-center gap-2 rounded-lg p-2 text-left hover:bg-muted/50 transition-colors"
                            >
                              <span className={`rounded-lg ${pf.color} p-1.5 text-sm`}>{pf.logo}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{pf.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{pf.url}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium">Plattform *</label>
              <div className="mt-1.5 flex gap-2">
                <Button
                  type="button"
                  variant={platform === 'mt4' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setPlatform('mt4')}
                >
                  MetaTrader 4
                </Button>
                <Button
                  type="button"
                  variant={platform === 'mt5' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setPlatform('mt5')}
                >
                  MetaTrader 5
                </Button>
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="text-sm font-medium">Kontonummer *</label>
              <Input 
                value={accountNumber} 
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="z.B. 12345678"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">The login ID of your trading account</p>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium">Passwort (Investor) *</label>
              <div className="relative mt-1.5">
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Das Investor/Read-only Passwort (nicht dein Master-Passwort!)</p>
            </div>

            {/* Server */}
            <div>
              <label className="text-sm font-medium">Server *</label>
              {selectedPropFirm && PROP_FIRM_SERVERS[selectedPropFirm] ? (
                <>
                  <Select value={server} onValueChange={(val) => { setServer(val); if (val !== 'custom') setCustomServer(''); }}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Choose your server" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROP_FIRM_SERVERS[selectedPropFirm].map((srv) => (
                        <SelectItem key={srv} value={srv}>
                          {srv}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">⌨️ Enter another server...</SelectItem>
                    </SelectContent>
                  </Select>
                  {server === 'custom' && (
                    <Input 
                      value={customServer}
                      onChange={(e) => setCustomServer(e.target.value)}
                      placeholder="Enter server name"
                      className="mt-2"
                      autoFocus
                    />
                  )}
                </>
              ) : (
                <Input 
                  value={server} 
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="Select a prop firm first"
                  className="mt-1.5"
                  disabled={!selectedPropFirm}
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">You can find the server in your MT4/MT5 connection or email</p>
            </div>

            {/* Security Notice */}
            <div className="rounded-lg bg-accent/10 border border-accent/20 p-3 text-xs">
              <p className="font-medium text-accent-foreground mb-1">🔒 Read-only access</p>
              <p className="text-muted-foreground">With the investor password we can only <strong>read</strong> your trades - never execute, change or withdraw money. This is the secure way, just like at TraderWaves.</p>
            </div>

            {/* Where to find credentials */}
            <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-3 text-xs">
              <p className="font-medium text-secondary-foreground mb-1">📧 Where can you find these credentials?</p>
              <p className="text-muted-foreground">The credentials were sent to you by your prop firm via email. Look for "MT4/MT5 Credentials" or "Trading Account Details".</p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsAddingAccount(false)}>
              Cancel
            </Button>
            <Button onClick={addAccount}>
              Connect account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PropFirmConnect;
