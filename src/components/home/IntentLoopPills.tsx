import { Eraser, ZoomIn, Box, Wand2, Copy, Download, Maximize } from "lucide-react";

type OutputType = "image" | "bg-removal" | "upscale" | "3d";

const pillsByType: Record<OutputType, { icon: typeof Eraser; label: string }[]> = {
  image: [
    { icon: Eraser, label: "Remove background" },
    { icon: ZoomIn, label: "Upscale" },
    { icon: Box, label: "Convert to 3D" },
    { icon: Wand2, label: "Edit this image" },
    { icon: Copy, label: "Create variation" },
  ],
  "bg-removal": [
    { icon: Box, label: "Convert to 3D" },
    { icon: ZoomIn, label: "Upscale" },
    { icon: Download, label: "Download" },
  ],
  upscale: [
    { icon: Download, label: "Download" },
    { icon: Wand2, label: "Edit" },
    { icon: Box, label: "Convert to 3D" },
  ],
  "3d": [
    { icon: Wand2, label: "Optimize for games" },
    { icon: Download, label: "Download GLB" },
    { icon: Maximize, label: "View fullscreen" },
  ],
};

interface IntentLoopPillsProps {
  outputType: OutputType;
  onAction?: (label: string) => void;
}

const IntentLoopPills = ({ outputType, onAction }: IntentLoopPillsProps) => {
  const pills = pillsByType[outputType] || pillsByType.image;

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mt-1.5">
      {pills.map((pill) => (
        <button
          key={pill.label}
          onClick={() => onAction?.(pill.label)}
          className="suggestion-pill"
        >
          <pill.icon className="w-[11px] h-[11px]" />
          {pill.label}
        </button>
      ))}
    </div>
  );
};

export default IntentLoopPills;
