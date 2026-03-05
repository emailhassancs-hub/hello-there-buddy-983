import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeButtonProps {
  collapsed?: boolean;
}

const UpgradeButton = ({ collapsed = false }: UpgradeButtonProps) => {
  if (collapsed) {
    return (
      <Button variant="outline" size="icon" className="w-full h-10">
        <Zap className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button variant="outline" className="w-full h-auto py-2.5 px-3 flex flex-col items-start gap-0.5">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <Zap className="w-4 h-4" />
        Upgrade Plan
      </span>
      <span className="text-[10px] text-muted-foreground">
        Unlock more generations
      </span>
    </Button>
  );
};

export default UpgradeButton;
