import { useEffect } from "react";
import { X, Download, ArrowRight, Sparkles } from "lucide-react";
import type { ThreeDExample } from "./gallery-data";

interface ThreeDModalProps {
  item: ThreeDExample;
  onClose: () => void;
}

const ThreeDModal = ({ item, onClose }: ThreeDModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isText = item.generationType === "TEXT_TO_3D";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/92 animate-in fade-in duration-250"
      onClick={onClose}
    >
      <div
        className="relative w-[95vw] max-w-[900px] h-auto max-h-[90vh] bg-[#141418] border border-border rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left — Viewer */}
        <div className="md:w-[55%] bg-[#0D0D10] flex flex-col items-center justify-center p-6 min-h-[300px]">
          <span className="text-[11px] text-muted-foreground mb-2 self-start">3D Viewer</span>
          <img
            src={item.thumbnailUrl}
            alt={item.label}
            className="max-w-full max-h-[360px] object-contain rounded-lg"
          />
          <span className="text-[11px] text-[#4B5563] mt-3">↻ Download .glb to view in Blender</span>
        </div>

        {/* Right — Details */}
        <div className="md:w-[45%] p-6 md:p-8 flex flex-col overflow-y-auto">
          <span
            className={`inline-flex w-fit text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              isText
                ? "bg-[rgba(124,90,246,0.15)] border-[rgba(124,90,246,0.4)] text-[#A78BFA]"
                : "bg-[rgba(20,184,166,0.15)] border-[rgba(20,184,166,0.4)] text-[#2DD4BF]"
            }`}
          >
            {isText ? "TEXT → 3D" : "IMG → 3D"}
          </span>
          <h2 className="text-xl font-semibold text-foreground mt-3">{item.label}</h2>

          {isText && item.prompt && (
            <div className="mt-4 bg-muted border border-border rounded-lg p-3">
              <span className="text-[11px] text-primary font-medium">✦ Prompt</span>
              <p className="text-[13px] text-foreground mt-1">{item.prompt}</p>
            </div>
          )}

          {!isText && item.inputImageUrl && (
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">Input Image</span>
              <img
                src={item.inputImageUrl}
                alt="Source"
                className="mt-2 w-[120px] h-[120px] object-cover rounded-lg border border-border"
              />
            </div>
          )}

          <div className="mt-5">
            <span className="text-[11px] uppercase text-[#6B7280] tracking-wider">Technical Specs</span>
            <div className="mt-2 space-y-1.5 text-xs">
              {[
                ["Version", item.specs.version],
                ["Quality", item.specs.quality],
                ["Format", item.specs.format],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 space-y-2">
            <a
              href={item.modelUrl}
              download
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:border-primary transition-colors"
            >
              <Download className="w-4 h-4" /> Download .glb
            </a>
            <a
              href="/3d"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Try in Studio →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDModal;
