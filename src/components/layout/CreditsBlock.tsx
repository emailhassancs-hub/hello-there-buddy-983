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
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Coins className="w-4 h-4 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 my-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-foreground text-background">
        <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-sm font-medium">
          {credits.toLocaleString()} Credits
        </span>
      </div>
    </div>
  );
};

export default CreditsBlock;
