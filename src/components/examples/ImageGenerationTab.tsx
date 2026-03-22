import { useState } from "react";
import { imageGenExamples, type ImageGenExample } from "./gallery-data";

const modelBadgeStyles: Record<string, string> = {
  Qwen: "bg-[rgba(59,130,246,0.15)] border-[rgba(59,130,246,0.4)] text-[#93C5FD]",
  Seedream4: "bg-[rgba(124,90,246,0.15)] border-[rgba(124,90,246,0.4)] text-[#C4B5FD]",
};

const resBadgeStyles: Record<string, string> = {
  Standard: "bg-[rgba(255,255,255,0.05)] border-border text-[#6B7280]",
  "2K": "bg-[rgba(245,158,11,0.15)] border-[rgba(245,158,11,0.4)] text-[#FCD34D]",
  "4K": "bg-[rgba(34,197,94,0.15)] border-[rgba(34,197,94,0.4)] text-[#6EE7B7]",
};

const ImageCard = ({ item }: { item: ImageGenExample }) => {
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary hover:-translate-y-0.5 break-inside-avoid mb-3"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.label}
          className={`w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <div className="w-full aspect-video bg-muted animate-pulse" />}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,13,16,0.8)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4">
          <span className="bg-primary/90 text-white text-[13px] font-medium rounded-lg px-4 py-1.5">
            View Prompt
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${modelBadgeStyles[item.model]}`}>
            {item.model}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${resBadgeStyles[item.resolution]}`}>
            {item.resolution}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground">{item.label}</p>
        <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
          {item.prompt}
        </p>
        <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
          {item.aspectRatio}
        </span>
      </div>
    </div>
  );
};

const ImageGenerationTab = () => (
  <div className="px-6 md:px-12 lg:px-16 py-12">
    <div className="columns-1 md:columns-2 lg:columns-3 gap-3">
      {imageGenExamples.map((item) => (
        <ImageCard key={item.id} item={item} />
      ))}
    </div>
  </div>
);

export default ImageGenerationTab;
