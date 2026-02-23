import { Coins } from "lucide-react";

interface CreditsBlockProps {
  collapsed?: boolean;
  credits?: number;
}

const CreditsBlock = ({
  collapsed = false,
  credits = 106.506,
}: CreditsBlockProps) => {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="w-8 h-8 rounded-full border border-border bg-muted/50 flex items-center justify-center">
          <Coins className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 my-2">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border bg-muted/30 backdrop-blur-sm">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm">
          <Coins className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {credits.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            Credits remaining
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreditsBlock;
