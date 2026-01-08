import { Check, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { SaveStatus } from '@/hooks/useAutoSave';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
  className?: string;
  showLabel?: boolean;
}

export function SaveStatusIndicator({
  status,
  onRetry,
  className,
  showLabel = true,
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
      case 'idle':
      default:
        return (
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <Cloud className="h-4 w-4" />
            {showLabel && <span className="text-sm">Auto-save enabled</span>}
          </div>
        );
    }
  };

  return (
    <div className={cn('transition-all duration-200', className)}>
      {getStatusContent()}
    </div>
  );
}

export default SaveStatusIndicator;
