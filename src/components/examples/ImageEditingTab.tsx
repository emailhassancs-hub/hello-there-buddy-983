import { Pencil } from "lucide-react";
import { imageEditExamples, type ImageEditExample } from "./gallery-data";
import BeforeAfterSlider from "./BeforeAfterSlider";

const techniqueBadgeStyles: Record<string, string> = {
  "Flux Kontext": "bg-[rgba(245,158,11,0.15)] border-[rgba(245,158,11,0.4)] text-[#FCD34D]",
  "Seedream4 Edit": "bg-[rgba(124,90,246,0.15)] border-[rgba(124,90,246,0.4)] text-[#C4B5FD]",
  "Nano Banana": "bg-[rgba(236,72,153,0.15)] border-[rgba(236,72,153,0.4)] text-[#F9A8D4]",
  "Qwen Edit Plus": "bg-[rgba(59,130,246,0.15)] border-[rgba(59,130,246,0.4)] text-[#93C5FD]",
  "Background Remove": "bg-[rgba(34,197,94,0.15)] border-[rgba(34,197,94,0.4)] text-[#6EE7B7]",
};

const EditCard = ({ item }: { item: ImageEditExample }) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
    <BeforeAfterSlider
      beforeUrl={item.inputUrl}
      afterUrl={item.outputUrl}
      isBackgroundRemove={item.isBackgroundRemove}
    />
    <div className="p-3.5 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${techniqueBadgeStyles[item.technique] || "bg-muted border-border text-muted-foreground"}`}>
          {item.technique}
        </span>
        <span className="text-[10px] text-muted-foreground">{item.model}</span>
      </div>
      {item.editPrompt ? (
        <div className="flex items-start gap-2 bg-muted rounded-md px-3 py-2">
          <Pencil className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <span className="text-[13px] text-foreground">{item.editPrompt}</span>
        </div>
      ) : (
        <p className="text-xs italic text-[#6B7280]">One-click removal — no prompt needed</p>
      )}
      {item.isBackgroundRemove && (
        <p className="text-[11px] text-[#6B7280]">Background removed — transparent PNG</p>
      )}
    </div>
  </div>
);

const ImageEditingTab = () => (
  <div className="px-6 md:px-12 lg:px-16 py-12">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {imageEditExamples.map((item) => (
        <EditCard key={item.id} item={item} />
      ))}
    </div>
  </div>
);

export default ImageEditingTab;
