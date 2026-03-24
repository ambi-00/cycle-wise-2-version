import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, CheckCircle, Link2, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight, Download, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetaTraderAccount {
  id: string;
  user_id: string;
  account_number: string;
  server: string;
  platform: 'mt4' | 'mt5';
  account_type: 'demo' | 'challenge' | 'live';
  prop_firm: string | null;
  connected_at: string;
  last_sync: string | null;
  is_active: boolean;
  include_in_analytics: boolean;
}

const MT_SERVERS = {
  mt4: [
    { name: 'ICMarkets (Demo)', value: 'ICMarketsDemo' },
    { name: 'ICMarkets (Live)', value: 'ICMarketsLive' },
    { name: 'FinProMax (Demo)', value: 'FinProMaxDemo' },
    { name: 'FinProMax (Live)', value: 'FinProMaxLive' },
    { name: 'TopTradersTraining (Demo)', value: 'TopTradersDemo' },
    { name: 'TopTradersTraining (Live)', value: 'TopTradersLive' },
    { name: 'Custom', value: 'custom' },
  ],
  mt5: [
    { name: 'ICMarkets MT5 (Demo)', value: 'ICMarketsDemo' },
    { name: 'ICMarkets MT5 (Live)', value: 'ICMarketsLive' },
    { name: 'Custom', value: 'custom' },
  ],
};

const ACCOUNT_TYPES = [
  { value: 'demo', label: '📚 Demo Account', color: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100' },
  { value: 'challenge', label: '🎯 Challenge Account', color: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100' },
  { value: 'live', label: '💰 Live Account', color: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100' },
];

export default function MetaTraderConnect() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<MetaTraderAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [platform, setPlatform] = useState<'mt4' | 'mt5'>('mt4');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [customServer, setCustomServer] = useState('');
  const [propFirm, setPropFirm] = useState('');
  const [accountType, setAccountType] = useState<'demo' | 'challenge' | 'live'>('demo');
  
  // Sync Dialog
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncOption, setSyncOption] = useState<'none' | 'all' | 'date'>('none');
  const [syncDate, setSyncDate] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from('metatrader_accounts') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Accounts:', error);
      toast({ title: 'Fehler', description: 'Konnte Accounts nicht laden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !password || !server) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht authentifiziert');

      // Teste Verbindung mit MT API
      const testResponse = await fetch(`${import.meta.env.VITE_MT_API_URL || 'http://localhost:3001'}/api/mt/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          password,
          server: server === 'custom' ? customServer : server,
          platform,
          propFirm: propFirm || null,
        }),
      });

      if (!testResponse.ok) {
        throw new Error('MT API Verbindung fehlgeschlagen');
      }

      const testData = await testResponse.json();
      if (!testData.success) {
        throw new Error(testData.error || 'Konnte Account nicht verbinden');
      }

      // Speichere in Supabase
      const { data, error } = await (supabase
        .from('metatrader_accounts') as any)
        .insert({
          user_id: user.id,
          account_number: accountNumber,
          server: server === 'custom' ? customServer : server,
          platform,
          account_type: accountType,
          prop_firm: propFirm || null,
          is_active: true,
          include_in_analytics: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Reset Form
      setAccountNumber('');
      setPassword('');
      setServer('');
      setCustomServer('');
      setPropFirm('');
      setAccountType('demo');
      
      toast({
        title: 'Erfolg',
        description: `MetaTrader ${platform.toUpperCase()} Account verbunden!`,
      });

      loadAccounts();
    } catch (error: any) {
      console.error('Fehler:', error);
      toast({
        title: 'Verbindungsfehler',
        description: error.message || 'Account konnte nicht verbunden werden',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggleAnalytics = async (accountId: string, currentValue: boolean) => {
    try {
      const { error } = await (supabase
        .from('metatrader_accounts') as any)
        .update({ include_in_analytics: !currentValue })
        .eq('id', accountId);

      if (error) throw error;
      loadAccounts();
      toast({
        title: 'Erfolg',
        description: !currentValue ? 'Account added to analytics' : 'Account removed from analytics',
      });
    } catch (error) {
      toast({ title: 'Fehler', description: 'Konnte Setting nicht aktualisieren', variant: 'destructive' });
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Account wirklich trennen?')) return;

    try {
      const { error } = await (supabase
        .from('metatrader_accounts') as any)
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({ title: 'Erfolg', description: 'Account getrennt' });
      loadAccounts();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Konnte Account nicht trennen', variant: 'destructive' });
    }
  };

  const handleSync = async () => {
    if (syncOption === 'none') {
      toast({ title: 'Info', description: 'Please select a sync option', variant: 'destructive' });
      return;
    }

    setIsSyncing(true);
    try {
      // TODO: Implementiere Sync-API
      console.log('Syncing:', { syncOption, syncDate });
      toast({
        title: 'Sync gestartet',
        description: `Synchronisiere Trades (${syncOption})...`,
      });
      setShowSyncDialog(false);
    } catch (error) {
      toast({ title: 'Fehler', description: 'Sync fehlgeschlagen', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">MetaTrader Connection</h1>
          <p className="text-muted-foreground">
            Connect your MetaTrader 4 & 5 accounts for automatic trade synchronization
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Verbindungsformular */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle>Neuen Account</CardTitle>
                <CardDescription>MT4 oder MT5 verbinden</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConnect} className="space-y-4">
                  {/* Platform */}
                  <div>
                    <label className="text-sm font-medium">Plattform *</label>
                    <div className="mt-1.5 flex gap-2">
                      <Button
                        type="button"
                        variant={platform === 'mt4' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setPlatform('mt4')}
                      >
                        MT4
                      </Button>
                      <Button
                        type="button"
                        variant={platform === 'mt5' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setPlatform('mt5')}
                      >
                        MT5
                      </Button>
                    </div>
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="text-sm font-medium">Account Type *</label>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      {ACCOUNT_TYPES.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={accountType === type.value ? 'default' : 'outline'}
                          className="text-xs"
                          onClick={() => setAccountType(type.value as any)}
                        >
                          {type.label.split(' ')[0]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="text-sm font-medium">Kontonummer *</label>
                    <Input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="z.B. 12345678"
                      className="mt-1.5"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-sm font-medium">Investor-Passwort *</label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Server */}
                  <div>
                    <label className="text-sm font-medium">Server *</label>
                    <select
                      value={server}
                      onChange={(e) => {
                        setServer(e.target.value);
                        if (e.target.value !== 'custom') setCustomServer('');
                      }}
                      className="w-full mt-1.5 px-3 py-2 rounded-md border border-input bg-background"
                    >
                      <option value="">Select a server</option>
                      {MT_SERVERS[platform]?.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {server === 'custom' && (
                    <div>
                      <Input
                        value={customServer}
                        onChange={(e) => setCustomServer(e.target.value)}
                        placeholder="z.B. trading.example.com"
                        className="mt-1.5"
                      />
                    </div>
                  )}

                  {/* Prop Firm (optional) */}
                  <div>
                    <label className="text-sm font-medium">Prop Firm (optional)</label>
                    <Input
                      value={propFirm}
                      onChange={(e) => setPropFirm(e.target.value)}
                      placeholder="z.B. FinProMax"
                      className="mt-1.5"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isConnecting}>
                    <Link2 className="h-4 w-4 mr-2" />
                    {isConnecting ? 'Verbinde...' : 'Verbinden'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Verbundene Accounts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Verbundene Accounts ({accounts.length})</CardTitle>
                  <CardDescription>Deine verwalteten Trading Konten</CardDescription>
                </div>
                {accounts.length > 0 && (
                  <Button
                    onClick={() => setShowSyncDialog(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Sync
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Lade Accounts...</div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Accounts verbunden</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((account) => {
                      const accountTypeData = ACCOUNT_TYPES.find(t => t.value === account.account_type);
                      return (
                        <motion.div
                          key={account.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Link2 className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="font-semibold">
                                    {account.platform.toUpperCase()} • {account.account_number}
                                  </div>
                                  <Badge className={accountTypeData?.color}>
                                    {accountTypeData?.label.split(' ')[1]}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {account.server}
                                  {account.prop_firm && ` • ${account.prop_firm}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {account.is_active && (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Aktiv
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDisconnect(account.id)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Analytics Toggle */}
                          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md mb-2">
                            <span className="text-sm font-medium">In Analysen einbeziehen</span>
                            <button
                              onClick={() => handleToggleAnalytics(account.id, account.include_in_analytics)}
                              className="flex items-center"
                            >
                              {account.include_in_analytics ? (
                                <ToggleRight className="h-5 w-5 text-primary" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                          </div>

                          {/* Last Sync */}
                          {account.last_sync && (
                            <p className="text-xs text-muted-foreground">
                              Letzte Sync: {new Date(account.last_sync).toLocaleString('de-DE')}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">How to Connect</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p>
                  <strong>1. Account Nummer:</strong> Login-ID deines Trading-Kontos
                </p>
                <p>
                  <strong>2. Investor-Passwort:</strong> Read-Only Passwort (kein Master-Passwort!)
                </p>
                <p>
                  <strong>3. Account Type:</strong> Demo, Challenge oder Live
                </p>
                <p className="pt-2 border-t border-blue-200 dark:border-blue-800">
                  ✅ Nach der Verbindung synchronisieren wir deine Trades automatisch
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sync Dialog */}
        {showSyncDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Trades Synchronisieren</CardTitle>
                <CardDescription>Choose which trades you want to load</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setSyncOption('none')}>
                    <input type="radio" name="sync" value="none" checked={syncOption === 'none'} onChange={() => setSyncOption('none')} />
                    <div>
                      <p className="font-medium text-sm">Keine alten Daten</p>
                      <p className="text-xs text-muted-foreground">Starte ab heute</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setSyncOption('date')}>
                    <input type="radio" name="sync" value="date" checked={syncOption === 'date'} onChange={() => setSyncOption('date')} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Trades bis Datum</p>
                      {syncOption === 'date' && (
                        <Input
                          type="date"
                          value={syncDate}
                          onChange={(e) => setSyncDate(e.target.value)}
                          className="mt-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setSyncOption('all')}>
                    <input type="radio" name="sync" value="all" checked={syncOption === 'all'} onChange={() => setSyncOption('all')} />
                    <div>
                      <p className="font-medium text-sm">Alle Trades</p>
                      <p className="text-xs text-muted-foreground">Komplette Historie</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowSyncDialog(false)}>
                    Abbrechen
                  </Button>
                  <Button className="flex-1" onClick={handleSync} disabled={isSyncing || syncOption === 'none'}>
                    {isSyncing ? 'Loading...' : 'Synchronize'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </main>
  );
}
