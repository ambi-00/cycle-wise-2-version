/**
 * Migration UI Component
 * Zeigt Migration-Dialog beim ersten Login
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { 
  migrateLocalStorageToSupabase, 
  checkMigrationStatus, 
  isMigrationMarkedComplete,
  markMigrationComplete,
  type MigrationResult 
} from '@/lib/migrateToSupabase';

export default function MigrationDialog() {
  const [showDialog, setShowDialog] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    checkIfMigrationNeeded();
  }, []);

  async function checkIfMigrationNeeded() {
    // Check if already migrated
    if (isMigrationMarkedComplete()) {
      return;
    }

    // Check if data exists in localStorage
    const hasLocalData = hasLocalStorageData();
    if (!hasLocalData) {
      markMigrationComplete();
      return;
    }

    // Check if data already exists in DB
    const hasDbData = await checkMigrationStatus();
    if (hasDbData) {
      markMigrationComplete();
      return;
    }

    // Automatisch migrieren (kein Dialog mehr)
    await handleMigrate();
  }

  function hasLocalStorageData(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('cw_journal_')) {
        return true;
      }
    }
    return false;
  }

  async function handleMigrate() {
    setMigrating(true);
    setShowDialog(true); // Zeige Fortschritt an
    try {
      const migrationResult = await migrateLocalStorageToSupabase();
      setResult(migrationResult);
      
      if (migrationResult.success) {
        markMigrationComplete();
        // Close dialog after 3 seconds
        setTimeout(() => {
          setShowDialog(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        tradesImported: 0,
        cycleLogsImported: 0,
        strategiesImported: 0,
        propFirmAccountsImported: 0,
        aiInsightsImported: 0,
        profileUpdated: false,
        settingsUpdated: false,
        errors: ['Migration failed'],
      });
    } finally {
      setMigrating(false);
    }
  }

  if (!showDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-4"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-primary/20 p-2.5">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>
                {migrating ? 'Migrating Data...' : 'Migration Complete'}
              </CardTitle>
            </div>
            <CardDescription>
              {migrating 
                ? 'Your local data is being automatically transferred to the cloud.' 
                : 'All data has been successfully migrated.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {migrating && !result ? (
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Migration in Progress...</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span>Transferring Trades</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span>Transferring Cycle Logs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span>Synchronizing Settings</span>
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {result.success ? (
                  <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-accent-foreground">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Migration erfolgreich!</span>
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>✓ {result.tradesImported} Trades importiert</p>
                      <p>✓ {result.cycleLogsImported} Cycle Logs importiert</p>
                      {result.strategiesImported > 0 && <p>✓ {result.strategiesImported} Strategien importiert</p>}
                      {result.propFirmAccountsImported > 0 && <p>✓ {result.propFirmAccountsImported} PropFirm Accounts importiert</p>}
                      {result.aiInsightsImported > 0 && <p>✓ {result.aiInsightsImported} AI Insights importiert</p>}
                      {result.profileUpdated && <p>✓ Profil-Einstellungen aktualisiert</p>}
                      {result.settingsUpdated && <p>✓ User-Einstellungen aktualisiert</p>}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">Migration fehlgeschlagen</span>
                    </div>
                    {result.errors.length > 0 && (
                      <div className="text-sm space-y-1 text-muted-foreground">
                        {result.errors.map((error, i) => (
                          <p key={i}>• {error}</p>
                        ))}
                      </div>
                    )}
                    <Button
                      onClick={handleMigrate}
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {result.success && (
                  <Button
                    onClick={() => setShowDialog(false)}
                    className="w-full"
                  >
                    Weiter
                  </Button>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
