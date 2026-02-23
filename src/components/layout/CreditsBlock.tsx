import { Progress } from "@/components/ui/progress";

interface CreditsBlockProps {
  collapsed?: boolean;
  credits?: number;
  maxCredits?: number;
  resetDate?: string;
}

const CreditsBlock = ({
  collapsed = false,
  credits = 342,
  maxCredits = 500,
  resetDate = "Mar 1, 2026",
}: CreditsBlockProps) => {
  const percentage = (credits / maxCredits) * 100;

  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <svg width="32" height="32" viewBox="0 0 36 36" className="rotate-[-90deg]">
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray={`${(percentage / 100) * 87.96} 87.96`}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Credits
      </span>
      <Progress value={percentage} className="h-1.5" />
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-foreground">
          {credits} / {maxCredits} remaining
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        Resets {resetDate}
      </span>
    </div>
  );
};

export default CreditsBlock;
