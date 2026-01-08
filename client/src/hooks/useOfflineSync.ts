import { useCallback, useEffect, useRef, useState } from 'react';

export interface QueuedChange<T> {
  id: string;
  timestamp: number;
  data: T;
  key: string;
}

interface UseOfflineSyncOptions<T> {
  storageKey: string;
  onSync: (data: T) => Promise<void>;
  enabled?: boolean;
}

interface UseOfflineSyncReturn<T> {
  isOffline: boolean;
  queuedChanges: number;
  queueChange: (data: T) => void;
  syncNow: () => Promise<void>;
  isSyncing: boolean;
}

const STORAGE_PREFIX = '12wy_offline_';

export function useOfflineSync<T>({
  storageKey,
  onSync,
  enabled = true,
}: UseOfflineSyncOptions<T>): UseOfflineSyncReturn<T> {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queuedChanges, setQueuedChanges] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgressRef = useRef(false);

  const fullStorageKey = `${STORAGE_PREFIX}${storageKey}`;

  // Load queued changes count on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(fullStorageKey);
      if (stored) {
        const queue: QueuedChange<T>[] = JSON.parse(stored);
        setQueuedChanges(queue.length);
      }
    } catch (e) {
      console.error('Failed to load offline queue:', e);
    }
  }, [fullStorageKey]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue a change for later sync
  const queueChange = useCallback((data: T) => {
    try {
      const stored = localStorage.getItem(fullStorageKey);
      const queue: QueuedChange<T>[] = stored ? JSON.parse(stored) : [];
      
      const newChange: QueuedChange<T> = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        data,
        key: storageKey,
      };

      // Keep only the latest change to avoid conflicts
      // (more sophisticated conflict resolution could be added here)
      queue.push(newChange);
      
      // Keep only last 10 changes to prevent storage bloat
      const trimmedQueue = queue.slice(-10);
      
      localStorage.setItem(fullStorageKey, JSON.stringify(trimmedQueue));
      setQueuedChanges(trimmedQueue.length);
    } catch (e) {
      console.error('Failed to queue offline change:', e);
    }
  }, [fullStorageKey, storageKey]);

  // Sync all queued changes
  const syncNow = useCallback(async () => {
    if (!enabled || syncInProgressRef.current) return;
    
    try {
      const stored = localStorage.getItem(fullStorageKey);
      if (!stored) return;

      const queue: QueuedChange<T>[] = JSON.parse(stored);
      if (queue.length === 0) return;

      syncInProgressRef.current = true;
      setIsSyncing(true);

      // Get the latest change (most recent data)
      const latestChange = queue[queue.length - 1];
      
      await onSync(latestChange.data);
      
      // Clear the queue after successful sync
      localStorage.removeItem(fullStorageKey);
      setQueuedChanges(0);
    } catch (e) {
      console.error('Failed to sync offline changes:', e);
      throw e;
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, [enabled, fullStorageKey, onSync]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOffline && enabled && queuedChanges > 0) {
      syncNow().catch(console.error);
    }
  }, [isOffline, enabled, queuedChanges, syncNow]);

  return {
    isOffline,
    queuedChanges,
    queueChange,
    syncNow,
    isSyncing,
  };
}

export default useOfflineSync;
