import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface GenerationStatusIndicatorProps {
  status: string;
  jobId: string;
  className?: string;
}

export function GenerationStatusIndicator({ status, jobId, className }: GenerationStatusIndicatorProps) {
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'listening': return '🎧';
      case 'processing': return '⏳';
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'failed': return '💥';
      default: return '📡';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'listening': return 'Connected, waiting for processing...';
      case 'processing': return 'Generating your content...';
      case 'completed': return 'Generation complete!';
      case 'error': return 'Generation failed';
      case 'failed': return 'Generation failed';
      default: return 'Unknown status';
    }
  };

  const isProcessing = status === 'listening' || status === 'processing';

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
      "bg-muted/50 border border-border/50",
      "animate-in slide-in-from-bottom-2 duration-300",
      className
    )}>
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <span className="text-base">{getStatusEmoji(status)}</span>
      )}
      <span className="text-muted-foreground">{getStatusText(status)}</span>
      <span 
        className="text-xs text-muted-foreground/70 font-mono" 
        title={jobId}
      >
        {jobId.substring(0, 8)}...
      </span>
    </div>
  );
}

interface GenerationIndicatorFloatingProps {
  count: number;
  status?: string;
}

export function GenerationIndicatorFloating({ count, status }: GenerationIndicatorFloatingProps) {
  if (count === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-20 right-5 z-50",
      "flex items-center gap-3",
      "px-4 py-3 rounded-lg",
      "bg-background/95 backdrop-blur-sm",
      "border border-border shadow-lg",
      "animate-in slide-in-from-right-5 duration-300"
    )}>
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-foreground">
        Generating {count} asset{count > 1 ? 's' : ''}...
      </span>
      {status && (
        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
          {status}
        </span>
      )}
    </div>
  );
}
