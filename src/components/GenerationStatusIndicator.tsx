import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, XCircle, ImageIcon, Pencil, Box } from "lucide-react";
import { Button } from "./ui/button";
import ImageFeedback from "./ImageFeedback";

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

// Processing message component for chat
interface ProcessingMessageProps {
  jobId: string;
  className?: string;
}

export function ProcessingMessage({ jobId, className }: ProcessingMessageProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg",
      "bg-muted/30 border border-border/40",
      "animate-pulse",
      className
    )}>
      <div className="relative">
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        <Loader2 className="h-4 w-4 animate-spin text-primary absolute -bottom-1 -right-1" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground">Generating image...</span>
        <span className="text-xs text-muted-foreground font-mono">
          Job: {jobId.substring(0, 8)}...
        </span>
      </div>
    </div>
  );
}

// Generated image component for chat
interface GeneratedImageProps {
  imageUrl: string;
  jobId?: string;
  className?: string;
  onFeedback?: (type: "like" | "dislike", comment?: string) => void;
  onEditImage?: () => void;
  onGenerate3DModel?: () => void;
}

export function GeneratedImage({ imageUrl, jobId, className, onFeedback, onEditImage, onGenerate3DModel }: GeneratedImageProps) {
  return (
    <div className={cn(
      "flex flex-col gap-3",
      className
    )}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>Image generated successfully!</span>
      </div>
      <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-md">
        <img 
          src={imageUrl} 
          alt="Generated image" 
          className="w-full h-auto object-contain"
          loading="lazy"
        />
      </div>
      {jobId && (
        <span className="text-xs text-muted-foreground/70 font-mono">
          Job: {jobId.substring(0, 8)}...
        </span>
      )}
      
      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onEditImage}
          className="gap-2 text-xs h-8 border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerate3DModel}
          className="gap-2 text-xs h-8 border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Box className="h-3.5 w-3.5" />
          Generate 3D Model
        </Button>
      </div>
      
      <ImageFeedback 
        imageId={jobId} 
        onFeedback={onFeedback}
        className="mt-1"
      />
    </div>
  );
}

// Error message component for failed generations
interface GenerationErrorProps {
  message: string;
  jobId?: string;
  className?: string;
}

export function GenerationError({ message, jobId, className }: GenerationErrorProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg",
      "bg-destructive/10 border border-destructive/30",
      className
    )}>
      <XCircle className="h-5 w-5 text-destructive" />
      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground">Generation failed</span>
        <span className="text-xs text-muted-foreground">{message}</span>
        {jobId && (
          <span className="text-xs text-muted-foreground/70 font-mono">
            Job: {jobId.substring(0, 8)}...
          </span>
        )}
      </div>
    </div>
  );
}
