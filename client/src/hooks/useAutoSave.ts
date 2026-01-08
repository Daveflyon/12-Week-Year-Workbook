import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'syncing';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
  undoWindowMs?: number;
  storageKey?: string; // Key for localStorage offline queue
}

interface UseAutoSaveReturn<T> {
  status: SaveStatus;
  lastSaved: Date | null;
  error: Error | null;
  retry: () => void;
  saveNow: () => void;
  canUndo: boolean;
  undoCountdown: number;
  undo: () => void;
  isOffline: boolean;
  pendingChanges: number;
}

const OFFLINE_STORAGE_PREFIX = '12wy_offline_';

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 800,
  enabled = true,
  undoWindowMs = 10000,
  storageKey = 'default',
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T>(data);
  const initialDataRef = useRef<T>(data);
  const previousDataRef = useRef<T | null>(null);
  const isFirstRender = useRef(true);
  const isSaving = useRef(false);
  const syncInProgress = useRef(false);

  const fullStorageKey = `${OFFLINE_STORAGE_PREFIX}${storageKey}`;

  // Load pending changes count on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(fullStorageKey);
      if (stored) {
        const queue = JSON.parse(stored);
        setPendingChanges(Array.isArray(queue) ? queue.length : 0);
      }
    } catch (e) {
      console.error('Failed to load offline queue:', e);
    }
  }, [fullStorageKey]);

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Store initial data on first render
  useEffect(() => {
    if (isFirstRender.current) {
      initialDataRef.current = data;
      isFirstRender.current = false;
    }
  }, [data]);

  // Queue change to localStorage
  const queueOfflineChange = useCallback((changeData: T) => {
    try {
      const stored = localStorage.getItem(fullStorageKey);
      const queue: { timestamp: number; data: T }[] = stored ? JSON.parse(stored) : [];
      
      queue.push({
        timestamp: Date.now(),
        data: changeData,
      });
      
      // Keep only last 5 changes to prevent storage bloat
      const trimmedQueue = queue.slice(-5);
      
      localStorage.setItem(fullStorageKey, JSON.stringify(trimmedQueue));
      setPendingChanges(trimmedQueue.length);
    } catch (e) {
      console.error('Failed to queue offline change:', e);
    }
  }, [fullStorageKey]);

  // Clear offline queue
  const clearOfflineQueue = useCallback(() => {
    try {
      localStorage.removeItem(fullStorageKey);
      setPendingChanges(0);
    } catch (e) {
      console.error('Failed to clear offline queue:', e);
    }
  }, [fullStorageKey]);

  // Sync offline changes
  const syncOfflineChanges = useCallback(async () => {
    if (syncInProgress.current || !navigator.onLine) return;
    
    try {
      const stored = localStorage.getItem(fullStorageKey);
      if (!stored) return;

      const queue: { timestamp: number; data: T }[] = JSON.parse(stored);
      if (queue.length === 0) return;

      syncInProgress.current = true;
      setStatus('syncing');

      // Get the latest change (most recent data)
      const latestChange = queue[queue.length - 1];
      
      await onSave(latestChange.data);
      
      // Clear the queue after successful sync
      clearOfflineQueue();
      setStatus('saved');
      setLastSaved(new Date());
      initialDataRef.current = latestChange.data;
      
      setTimeout(() => {
        setStatus((current) => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (e) {
      console.error('Failed to sync offline changes:', e);
      setStatus('error');
      setError(e instanceof Error ? e : new Error('Sync failed'));
    } finally {
      syncInProgress.current = false;
    }
  }, [fullStorageKey, onSave, clearOfflineQueue]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Auto-sync when coming back online
      syncOfflineChanges();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineChanges]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    if (undoIntervalRef.current) {
      clearInterval(undoIntervalRef.current);
      undoIntervalRef.current = null;
    }
    setCanUndo(false);
    setUndoCountdown(0);
  }, []);

  const startUndoTimer = useCallback(() => {
    clearUndoTimer();
    setCanUndo(true);
    setUndoCountdown(Math.ceil(undoWindowMs / 1000));

    // Countdown interval
    undoIntervalRef.current = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearUndoTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Clear undo option after window expires
    undoTimeoutRef.current = setTimeout(() => {
      clearUndoTimer();
      previousDataRef.current = null;
    }, undoWindowMs);
  }, [undoWindowMs, clearUndoTimer]);

  const performSave = useCallback(async () => {
    if (isSaving.current) return;
    
    // Don't save if data hasn't changed from initial
    if (JSON.stringify(dataRef.current) === JSON.stringify(initialDataRef.current)) {
      return;
    }

    // If offline, queue the change in localStorage
    if (!navigator.onLine) {
      queueOfflineChange(dataRef.current);
      setStatus('offline');
      return;
    }

    // Store previous data for undo
    previousDataRef.current = initialDataRef.current;

    isSaving.current = true;
    setStatus('saving');
    setError(null);

    try {
      await onSave(dataRef.current);
      setStatus('saved');
      setLastSaved(new Date());
      initialDataRef.current = dataRef.current;
      
      // Start undo timer
      startUndoTimer();
      
      // Reset to idle after 2 seconds (but keep undo available)
      setTimeout(() => {
        setStatus((current) => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (err) {
      // If save fails due to network, queue offline
      if (!navigator.onLine) {
        queueOfflineChange(dataRef.current);
        setStatus('offline');
      } else {
        setStatus('error');
        setError(err instanceof Error ? err : new Error('Save failed'));
      }
      previousDataRef.current = null;
    } finally {
      isSaving.current = false;
    }
  }, [onSave, startUndoTimer, queueOfflineChange]);

  // Undo function
  const undo = useCallback(async () => {
    if (!canUndo || !previousDataRef.current) return;

    clearUndoTimer();
    
    const previousData = previousDataRef.current;
    previousDataRef.current = null;

    isSaving.current = true;
    setStatus('saving');

    try {
      await onSave(previousData);
      setStatus('saved');
      setLastSaved(new Date());
      initialDataRef.current = previousData;
      dataRef.current = previousData;
      
      setTimeout(() => {
        setStatus((current) => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Undo failed'));
    } finally {
      isSaving.current = false;
    }
  }, [canUndo, onSave, clearUndoTimer]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled || isFirstRender.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearUndoTimer();
    };
  }, [clearUndoTimer]);

  const retry = useCallback(() => {
    if (pendingChanges > 0 && navigator.onLine) {
      syncOfflineChanges();
    } else {
      performSave();
    }
  }, [performSave, pendingChanges, syncOfflineChanges]);

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSave();
  }, [performSave]);

  return {
    status,
    lastSaved,
    error,
    retry,
    saveNow,
    canUndo,
    undoCountdown,
    undo,
    isOffline,
    pendingChanges,
  };
}

export default useAutoSave;
