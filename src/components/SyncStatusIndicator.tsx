/**
 * Sync Status Indicator
 * Zeigt Online/Offline Status und pending Syncs
 */

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSyncStatus, SYNC_STATUS_CHANGED, type SyncStatus } from '@/lib/syncManager';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());

  useEffect(() => {
    // Initial status
    setStatus(getSyncStatus());

    // Listen for status changes
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<SyncStatus>;
      setStatus(customEvent.detail);
    };

    window.addEventListener(SYNC_STATUS_CHANGED, handleStatusChange);
    
    return () => {
      window.removeEventListener(SYNC_STATUS_CHANGED, handleStatusChange);
    };
  }, []);

  // Icon und Color basierend auf Status
  const getStatusDisplay = () => {
    if (!status.isOnline) {
      return {
        icon: <CloudOff className="h-4 w-4" />,
        color: 'text-muted-foreground',
        label: 'Offline',
        description: 'You are offline. Data is saved locally and will sync later.',
      };
    }

    if (status.isSyncing) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        color: 'text-primary',
        label: 'Synchronizing...',
        description: `Uploading ${status.pendingCount} changes...`,
      };
    }

    if (status.pendingCount > 0) {
      return {
        icon: <Cloud className="h-4 w-4" />,
        color: 'text-muted-foreground',
        label: `${status.pendingCount} Pending`,
        description: `${status.pendingCount} changes waiting to sync.`,
      };
    }

    if (status.errors.length > 0) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-destructive',
        label: 'Sync Error',
        description: status.errors.join(', '),
      };
    }

    return {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'text-accent-foreground',
      label: 'Online & Synced',
      description: status.lastSyncTime 
        ? `Last synced: ${new Date(status.lastSyncTime).toLocaleTimeString('en-US')}`
        : 'All data is synchronized.',
    };
  };

  const display = getStatusDisplay();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${display.color}`}
          >
            {display.icon}
            <span className="text-xs hidden sm:inline">{display.label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">{display.label}</p>
            <p className="text-muted-foreground">{display.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
