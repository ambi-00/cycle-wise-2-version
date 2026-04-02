/**
 * Offline-First Sync Manager
 * Handles automatic synchronization between localStorage and Supabase
 * 
 * Features:
 * - Automatic online/offline detection
 * - Queue for pending sync operations
 * - Background sync when connection restored
 * - Conflict resolution
 */

import { supabase } from '@/integrations/supabase/client';

// Sync Queue Types
interface PendingSyncItem {
  id: string;
  type: 'trade' | 'cycle_log' | 'journal_entry' | 'strategy' | 'ai_insight' | 'profile_update' | 'settings_update';
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  errors: string[];
}

// Sync Queue Key
const SYNC_QUEUE_KEY = 'cw_sync_queue';
const SYNC_STATUS_KEY = 'cw_sync_status';

// Event for sync status changes
export const SYNC_STATUS_CHANGED = 'syncStatusChanged';

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  const raw = localStorage.getItem(SYNC_STATUS_KEY);
  if (!raw) {
    return {
      isOnline: navigator.onLine,
      isSyncing: false,
      pendingCount: 0,
      lastSyncTime: null,
      errors: [],
    };
  }
  return JSON.parse(raw);
}

/**
 * Update sync status
 */
function updateSyncStatus(partial: Partial<SyncStatus>) {
  const current = getSyncStatus();
  const updated = { ...current, ...partial };
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(updated));
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent(SYNC_STATUS_CHANGED, { detail: updated }));
}

/**
 * Get pending sync queue
 */
function getSyncQueue(): PendingSyncItem[] {
  const raw = localStorage.getItem(SYNC_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Save sync queue
 */
function saveSyncQueue(queue: PendingSyncItem[]) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  updateSyncStatus({ pendingCount: queue.length });
}

/**
 * Add item to sync queue
 */
function addToSyncQueue(item: Omit<PendingSyncItem, 'retryCount' | 'timestamp'>) {
  const queue = getSyncQueue();
  queue.push({
    ...item,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  });
  saveSyncQueue(queue);
}

/**
 * Remove item from sync queue
 */
function removeFromSyncQueue(id: string) {
  const queue = getSyncQueue().filter(item => item.id !== id);
  saveSyncQueue(queue);
}

/**
 * Save data with offline-first strategy
 */
export async function syncSave<T>(options: {
  type: PendingSyncItem['type'];
  data: T;
  localStorageKey: string;
  supabaseTable: string;
  operation?: 'insert' | 'update';
  getId?: (data: T) => string;
}): Promise<{ success: boolean; error?: string }> {
  const { type, data, localStorageKey, supabaseTable, operation = 'insert', getId } = options;
  
  // 1. Save to localStorage immediately (always works)
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(data));
  } catch (err) {
    console.error('localStorage save failed:', err);
    return { success: false, error: 'Failed to save locally' };
  }

  // 2. Try to save to Supabase
  if (navigator.onLine) {
    try {
      const { error } = operation === 'insert'
        ? await (supabase as any).from(supabaseTable).insert(data as any)
        : await (supabase as any).from(supabaseTable).update(data as any).eq('id', getId ? getId(data) : (data as any).id);

      if (error) {
        console.error('Supabase save failed:', error);
        // Add to sync queue
        addToSyncQueue({
          id: getId ? getId(data) : (data as any).id || crypto.randomUUID(),
          type,
          operation,
          data,
        });
        return { success: true, error: 'Saved locally, will sync when online' };
      }

      return { success: true };
    } catch (err) {
      console.error('Supabase error:', err);
      addToSyncQueue({
        id: getId ? getId(data) : (data as any).id || crypto.randomUUID(),
        type,
        operation,
        data,
      });
      return { success: true, error: 'Saved locally, will sync when online' };
    }
  } else {
    // Offline - add to queue
    addToSyncQueue({
      id: getId ? getId(data) : (data as any).id || crypto.randomUUID(),
      type,
      operation,
      data,
    });
    return { success: true, error: 'Offline - will sync when online' };
  }
}

/**
 * Sync a single item from queue
 */
async function syncQueueItem(item: PendingSyncItem): Promise<boolean> {
  const tableMap: Record<PendingSyncItem['type'], string> = {
    trade: 'trades',
    cycle_log: 'cycle_logs',
    journal_entry: 'journal_entries',
    strategy: 'strategies',
    ai_insight: 'ai_insights',
    profile_update: 'profiles',
    settings_update: 'user_settings',
  };

  const table = tableMap[item.type];
  
  try {
    if (item.operation === 'insert') {
      const { error } = await (supabase as any).from(table).insert(item.data);
      if (error) throw error;
    } else if (item.operation === 'update') {
      const { error } = await (supabase as any).from(table).update(item.data).eq('id', item.data.id);
      if (error) throw error;
    } else if (item.operation === 'delete') {
      const { error } = await (supabase as any).from(table).delete().eq('id', item.data.id);
      if (error) throw error;
    }
    
    return true;
  } catch (err) {
    console.error(`Sync failed for ${item.type}:`, err);
    return false;
  }
}

/**
 * Sync all pending items
 */
export async function syncPendingChanges(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Offline - skipping sync');
    return;
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    console.log('No pending changes to sync');
    return;
  }

  updateSyncStatus({ isSyncing: true });
  console.log(`Syncing ${queue.length} pending changes...`);

  const failed: PendingSyncItem[] = [];
  const errors: string[] = [];

  for (const item of queue) {
    const success = await syncQueueItem(item);
    
    if (success) {
      removeFromSyncQueue(item.id);
    } else {
      // Increment retry count
      item.retryCount++;
      if (item.retryCount >= 3) {
        errors.push(`Failed to sync ${item.type} after 3 retries`);
        removeFromSyncQueue(item.id); // Remove after max retries
      } else {
        failed.push(item);
      }
    }
  }

  // Save remaining failed items
  if (failed.length > 0) {
    saveSyncQueue(failed);
  }

  updateSyncStatus({
    isSyncing: false,
    lastSyncTime: new Date().toISOString(),
    errors,
  });

  console.log(`Sync complete. ${queue.length - failed.length} synced, ${failed.length} failed`);
}

/**
 * Load data with fallback strategy
 * 1. Try Supabase first (fresh data)
 * 2. Fall back to localStorage if offline
 */
export async function syncLoad<T>(options: {
  supabaseTable: string;
  localStorageKey: string;
  query?: (builder: any) => any;
  parseLocal?: (raw: string) => T;
}): Promise<{ data: T | null; source: 'supabase' | 'localStorage' | 'none' }> {
  const { supabaseTable, localStorageKey, query, parseLocal } = options;

  // Try Supabase first if online
  if (navigator.onLine) {
    try {
      let builder = (supabase as any).from(supabaseTable).select('*');
      if (query) {
        builder = query(builder);
      }
      
      const { data, error } = await builder;
      
      if (!error && data) {
        // Update localStorage cache
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        return { data: data as T, source: 'supabase' };
      }
    } catch (err) {
      console.error('Supabase load failed:', err);
    }
  }

  // Fallback to localStorage
  const raw = localStorage.getItem(localStorageKey);
  if (raw) {
    try {
      const data = parseLocal ? parseLocal(raw) : JSON.parse(raw);
      return { data, source: 'localStorage' };
    } catch (err) {
      console.error('localStorage parse failed:', err);
    }
  }

  return { data: null, source: 'none' };
}

/**
 * Clear sync queue and reset status
 * Used to clean up stale/failed sync items
 */
export function clearSyncQueue() {
  localStorage.removeItem(SYNC_QUEUE_KEY);
  updateSyncStatus({
    pendingCount: 0,
    errors: [],
    lastSyncTime: new Date().toISOString(),
  });
  console.log('Sync queue cleared');
}

/**
 * Check if user is authenticated
 */
async function checkAuth(): Promise<boolean> {
  try {
    const user = (await supabase.auth.getSession()).data.session?.user ?? null;
    return !!user;
  } catch (e) {
    return false;
  }
}

/**
 * Initialize sync manager
 * Sets up event listeners for online/offline
 */
export async function initializeSyncManager() {
  console.log('Initializing Sync Manager...');

  const hasAuth = await checkAuth();
  
  // Get current queue
  let queue = getSyncQueue();
  
  // If not authenticated, clear the sync queue (no point keeping it)
  if (!hasAuth && queue.length > 0) {
    console.log('No authentication found - clearing sync queue');
    clearSyncQueue();
    queue = [];
  }
  
  // Initialize sync status with correct values
  updateSyncStatus({ 
    isOnline: navigator.onLine,
    pendingCount: queue.length,
    errors: [], // Clear any old errors
    // If no pending items, mark as synced
    lastSyncTime: queue.length === 0 ? new Date().toISOString() : (getSyncStatus().lastSyncTime || null)
  });

  // Listen for online/offline events
  window.addEventListener('online', async () => {
    console.log('Connection restored - syncing pending changes...');
    updateSyncStatus({ isOnline: true });
    const isAuth = await checkAuth();
    if (isAuth) {
      syncPendingChanges();
    }
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost - switching to offline mode');
    updateSyncStatus({ isOnline: false });
  });

  // Periodic sync every 5 minutes (if online and authenticated)
  setInterval(async () => {
    const isAuth = await checkAuth();
    if (navigator.onLine && isAuth) {
      syncPendingChanges();
    }
  }, 5 * 60 * 1000);

  // Initial sync if pending items exist
  if (queue.length > 0 && navigator.onLine && hasAuth) {
    console.log(`Found ${queue.length} pending items - syncing...`);
    setTimeout(() => syncPendingChanges(), 1000); // Small delay to let app fully initialize
  } else if (hasAuth) {
    console.log('User authenticated - sync status initialized');
  }
}
