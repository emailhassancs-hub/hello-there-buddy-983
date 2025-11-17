import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Film, Gamepad2, Swords, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const getNodeStyle = (sceneType: string, isBranching?: boolean, isEnd?: boolean) => {
  if (isEnd) return { bg: "bg-purple-500/20", border: "border-purple-500", icon: Film };
  if (isBranching) return { bg: "bg-orange-500/20", border: "border-orange-500", icon: Zap };
  
  switch (sceneType) {
    case "cutscene":
      return { bg: "bg-blue-500/20", border: "border-blue-500", icon: Film };
    case "gameplay":
      return { bg: "bg-green-500/20", border: "border-green-500", icon: Gamepad2 };
    case "boss":
      return { bg: "bg-red-500/20", border: "border-red-500", icon: Swords };
    default:
      return { bg: "bg-muted", border: "border-border", icon: Film };
  }
};

export const StoryNodeComponent = memo(({ data }: any) => {
  const style = getNodeStyle(data.sceneType, data.isBranching, data.isEnd);
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 min-w-[180px] shadow-lg bg-card",
        style.bg,
        style.border,
        data.isBranching && "shadow-orange-500/50 shadow-xl"
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-muted-foreground mt-1">
          {data.description}
        </div>
      )}
      
      {data.video && (
        <div className="text-xs text-primary mt-1 flex items-center gap-1">
          <Film className="h-3 w-3" />
          Video
        </div>
      )}

      {data.isEnd && (
        <div className="text-xs font-semibold text-purple-500 mt-1">
          END
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

StoryNodeComponent.displayName = "StoryNodeComponent";
