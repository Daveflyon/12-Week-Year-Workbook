import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  lastSaved: Date | null;
  error: Error | null;
  retry: () => void;
  saveNow: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 800,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T>(data);
  const initialDataRef = useRef<T>(data);
  const isFirstRender = useRef(true);
  const isSaving = useRef(false);

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

  const performSave = useCallback(async () => {
    if (isSaving.current) return;
    
    // Don't save if data hasn't changed from initial
    if (JSON.stringify(dataRef.current) === JSON.stringify(initialDataRef.current)) {
      return;
    }

    isSaving.current = true;
    setStatus('saving');
    setError(null);

    try {
      await onSave(dataRef.current);
      setStatus('saved');
      setLastSaved(new Date());
      initialDataRef.current = dataRef.current;
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus((current) => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Save failed'));
    } finally {
      isSaving.current = false;
    }
  }, [onSave]);

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

  const retry = useCallback(() => {
    performSave();
  }, [performSave]);

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
  };
}

export default useAutoSave;
