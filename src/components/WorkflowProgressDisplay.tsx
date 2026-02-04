import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkflowProgressDisplayProps {
  chainId: string;
  totalTasks: number;
  currentTask?: number;
  currentStatus?: string;
  isLoading?: boolean;
  error?: string | null;
}

export const WorkflowProgressDisplay = ({
  chainId,
  totalTasks,
  currentTask = 0,
  currentStatus = 'Initializing workflow...',
  isLoading = true,
  error = null,
}: WorkflowProgressDisplayProps) => {
  const progressPercent = totalTasks > 0 ? (currentTask / totalTasks) * 100 : 0;

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Zap className="h-5 w-5 text-amber-500 animate-pulse" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          <span className="text-sm font-medium text-foreground">
            Workflow Chain Progress
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {currentTask}/{totalTasks} tasks
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{Math.round(progressPercent)}% complete</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Processing...
          </span>
        </div>
      </div>

      {/* Task Counter - Commented out per user request */}
      {/* <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 rounded bg-background/50 text-center">
          <span className="block text-muted-foreground">Current</span>
          <span className="font-semibold text-foreground">{currentTask}</span>
        </div>
        <div className="p-2 rounded bg-background/50 text-center">
          <span className="block text-muted-foreground">Total</span>
          <span className="font-semibold text-foreground">{totalTasks}</span>
        </div>
        <div className="p-2 rounded bg-background/50 text-center">
          <span className="block text-muted-foreground">Remaining</span>
          <span className="font-semibold text-foreground">
            {Math.max(0, totalTasks - currentTask)}
          </span>
        </div>
      </div> */}
    </div>
  );
};
