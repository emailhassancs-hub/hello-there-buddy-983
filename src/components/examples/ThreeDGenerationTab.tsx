import { useState } from "react";
import { Box } from "lucide-react";
import { threeDExamples, type ThreeDExample } from "./gallery-data";
import ThreeDModal from "./ThreeDModal";

const ThreeDCard = ({ item, onOpen }: { item: ThreeDExample; onOpen: () => void }) => {
  const isText = item.generationType === "TEXT_TO_3D";

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary hover:-translate-y-0.5 h-[420px] flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-[260px] bg-[#141418] flex items-center justify-center overflow-hidden shrink-0">
        <img
          src={item.thumbnailUrl}
          alt={item.label}
          className="max-w-full max-h-full object-contain"
        />
        <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-[rgba(34,197,94,0.15)] border-[rgba(34,197,94,0.4)] text-[#6EE7B7]">
          GLB
        </span>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={onOpen}
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium rounded-lg px-5 py-2"
          >
            <Box className="w-4 h-4" /> View 3D ↗
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1 min-h-0">
        <span
          className={`inline-flex w-fit text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            isText
              ? "bg-[rgba(124,90,246,0.15)] border-[rgba(124,90,246,0.4)] text-[#A78BFA]"
              : "bg-[rgba(20,184,166,0.15)] border-[rgba(20,184,166,0.4)] text-[#2DD4BF]"
          }`}
        >
          {isText ? "TEXT → 3D" : "IMG → 3D"}
        </span>
        <p className="text-sm font-semibold text-foreground mt-2">{item.label}</p>

        {isText && item.prompt && (
          <p className="text-xs text-muted-foreground italic line-clamp-2 mt-1">
            <span className="text-primary not-italic">✦</span> {item.prompt}
          </p>
        )}
        {!isText && item.inputImageUrl && (
          <div className="mt-1">
            <span className="text-[11px] text-[#6B7280]">Source image</span>
            <img
              src={item.inputImageUrl}
              alt="Source"
              className="mt-1 w-9 h-9 object-cover rounded-md border border-border"
            />
          </div>
        )}

        <div className="flex gap-1.5 mt-auto pt-2">
          {["midpoly", "PBR", "GLB"].map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted border border-border text-[#6B7280]">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ThreeDGenerationTab = () => {
  const [selectedItem, setSelectedItem] = useState<ThreeDExample | null>(null);

  return (
    <div className="px-6 md:px-12 lg:px-16 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {threeDExamples.map((item) => (
          <ThreeDCard key={item.id} item={item} onOpen={() => setSelectedItem(item)} />
        ))}
      </div>
      {selectedItem && (
        <ThreeDModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default ThreeDGenerationTab;
