import { Check, Cloud, CloudOff, Loader2, RefreshCw, Undo2, WifiOff, CloudUpload } from 'lucide-react';
import { SaveStatus } from '@/hooks/useAutoSave';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
  className?: string;
  showLabel?: boolean;
  canUndo?: boolean;
  undoCountdown?: number;
  onUndo?: () => void;
  pendingChanges?: number;
}

export function SaveStatusIndicator({
  status,
  onRetry,
  className,
  showLabel = true,
  canUndo = false,
  undoCountdown = 0,
  onUndo,
  pendingChanges = 0,
}: SaveStatusIndicatorProps) {
  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {showLabel && <span className="text-sm">Saving...</span>}
          </div>
        );
      case 'syncing':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            <CloudUpload className="h-4 w-4 animate-pulse" />
            {showLabel && <span className="text-sm">Syncing {pendingChanges} change{pendingChanges !== 1 ? 's' : ''}...</span>}
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-primary">
            <Check className="h-4 w-4" />
            {showLabel && <span className="text-sm">Saved</span>}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-destructive">
            <CloudOff className="h-4 w-4" />
            {showLabel && <span className="text-sm">Save failed</span>}
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-2 text-amber-500">
            <WifiOff className="h-4 w-4" />
            {showLabel && (
              <span className="text-sm">
                Offline
                {pendingChanges > 0 && ` - ${pendingChanges} change${pendingChanges !== 1 ? 's' : ''} pending`}
              </span>
            )}
          </div>
        );
      case 'idle':
      default:
        // Show pending changes indicator if there are queued changes
        if (pendingChanges > 0) {
          return (
            <div className="flex items-center gap-2 text-amber-500">
              <CloudUpload className="h-4 w-4" />
              {showLabel && (
                <span className="text-sm">
                  {pendingChanges} change{pendingChanges !== 1 ? 's' : ''} pending
                </span>
              )}
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync now
                </Button>
              )}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <Cloud className="h-4 w-4" />
            {showLabel && <span className="text-sm">Auto-save enabled</span>}
          </div>
        );
    }
  };

  return (
    <div className={cn('flex items-center gap-3 transition-all duration-200', className)}>
      {getStatusContent()}
      {canUndo && onUndo && undoCountdown > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          className="h-7 px-3 text-xs bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700"
        >
          <Undo2 className="h-3 w-3 mr-1" />
          Undo ({undoCountdown}s)
        </Button>
      )}
    </div>
  );
}

export default SaveStatusIndicator;
