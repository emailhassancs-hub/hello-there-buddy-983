import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { galleryItems, type GalleryCardType } from "./gallery-items";

const filterTabs = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "3d", label: "3D Models" },
  { id: "editing", label: "Edited" },
] as const;

type FilterTab = typeof filterTabs[number]["id"];

const modelBadgeStyle = (model: string) => {
  if (model === "Qwen") return { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#93C5FD" };
  return { background: "rgba(124,90,246,0.15)", border: "1px solid rgba(124,90,246,0.4)", color: "#C4B5FD" };
};

const resolutionBadgeStyle = (res: string) => {
  if (res === "4K") return { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#6EE7B7" };
  if (res === "2K") return { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#FCD34D" };
  return { background: "rgba(255,255,255,0.05)", border: "1px solid #3D3D4D", color: "#6B7280" };
};

const techniqueBadgeStyle = (technique: string) => {
  const map: Record<string, { bg: string; border: string; color: string }> = {
    "Flux Kontext": { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", color: "#FCD34D" },
    "Seedream4 Edit": { bg: "rgba(124,90,246,0.15)", border: "rgba(124,90,246,0.4)", color: "#C4B5FD" },
    "Nano Banana": { bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.4)", color: "#F9A8D4" },
    "Qwen Edit Plus": { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", color: "#93C5FD" },
    "Background Remove": { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)", color: "#6EE7B7" },
  };
  const s = map[technique] || map["Background Remove"];
  return { background: s.bg, border: `1px solid ${s.border}`, color: s.color };
};

interface LiveGalleryProps {
  onTryPrompt: (prompt: string) => void;
}

const LiveGallery = ({ onTryPrompt }: LiveGalleryProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const navigate = useNavigate();

  const filtered = activeFilter === "all"
    ? galleryItems
    : galleryItems.filter((item) => item.type === activeFilter);

  return (
    <section className="px-8 lg:px-16 py-12">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#6B7280" }}>
              WHAT OUR PLATFORM CREATES
            </span>
            <h2 className="text-2xl font-semibold text-foreground mt-1">
              From one prompt to production-ready assets
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="inline-flex p-1.5 rounded-xl gap-1"
              style={{ background: "#1E1E25", border: "1px solid #3D3D4D" }}
            >
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className="text-sm font-medium px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                  style={
                    activeFilter === tab.id
                      ? { background: "#7C5AF6", color: "white" }
                      : { background: "transparent", color: "#9CA3AF" }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/examples")}
              className="text-sm font-medium hover:underline hidden md:block"
              style={{ color: "#A78BFA" }}
            >
              View all examples →
            </button>
          </div>
        </div>

        {/* MASONRY GRID */}
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className="break-inside-avoid mb-2 rounded-xl overflow-hidden cursor-pointer group transition-all duration-200"
              style={{
                background: "#1E1E25",
                border: "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#7C5AF6";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* IMAGE CARD */}
              {item.type === "image" && (
                <>
                  <div className="relative overflow-hidden">
                    <img src={item.imageUrl} alt={item.label} className="w-full block" loading="lazy" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onTryPrompt(item.prompt || ""); }}
                        className="mt-2 text-xs font-medium px-3 py-1.5 rounded-full self-start"
                        style={{ background: "rgba(124,90,246,0.9)", color: "white" }}
                      >
                        ✦ Try this prompt
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={modelBadgeStyle(item.model || "")}>
                      {item.model}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#2A2A35", border: "1px solid #3D3D4D", color: "#9CA3AF" }}>
                      {item.ratio}
                    </span>
                  </div>
                </>
              )}

              {/* 3D CARD */}
              {item.type === "3d" && (
                <>
                  <div className="relative overflow-hidden" style={{ background: "#141418" }}>
                    <img src={item.thumbnailUrl} alt={item.label} className="w-full block" loading="lazy" style={{ objectFit: "contain" }} />
                    <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.4)", color: "#2DD4BF" }}>
                      GLB
                    </span>
                    <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={
                      item.generationType === "IMAGE_TO_3D"
                        ? { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#FCD34D" }
                        : { background: "rgba(124,90,246,0.15)", border: "1px solid rgba(124,90,246,0.4)", color: "#A78BFA" }
                    }>
                      {item.generationType === "IMAGE_TO_3D" ? "IMG→3D" : "TEXT→3D"}
                    </span>
                    <span className="absolute bottom-2 right-2 text-sm" style={{ color: "#6B7280" }}>↻</span>
                    {item.generationType === "IMAGE_TO_3D" && item.sourceImageUrl && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <img src={item.sourceImageUrl} alt="Source" className="w-6 h-6 rounded object-cover" style={{ border: "1px solid #3D3D4D" }} />
                        <span className="text-[9px] font-medium" style={{ color: "#FCD34D" }}>IMG→3D</span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <button
                        className="text-xs font-medium px-4 py-2 rounded-lg"
                        style={{ background: "#7C5AF6", color: "white" }}
                      >
                        View 3D ↗
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* EDITING CARD */}
              {item.type === "editing" && (
                <>
                  <div className="relative overflow-hidden flex md:flex" style={{ height: 180 }}>
                    <div className="w-1/2 relative overflow-hidden hidden md:block">
                      <img src={item.beforeUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      <span className="absolute top-2 left-2 text-[10px] uppercase font-medium px-2 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
                        BEFORE
                      </span>
                    </div>
                    <div className="w-px shrink-0 hidden md:block" style={{ background: "white" }} />
                    <div className="w-full md:w-1/2 relative overflow-hidden" style={
                      item.isBackgroundRemove
                        ? { background: "repeating-conic-gradient(#2a2a35 0% 25%, #1e1e25 0% 50%) 0 0 / 16px 16px" }
                        : undefined
                    }>
                      <img src={item.afterUrl} alt="After" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      <span className="absolute top-2 right-2 text-[10px] uppercase font-medium px-2 py-0.5 rounded" style={{ background: "rgba(124,90,246,0.35)", color: "#E9D5FF" }}>
                        AFTER
                      </span>
                    </div>
                    {/* Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 px-3">
                      <span className="text-xs italic text-white text-center">{item.prompt}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (item.prompt) onTryPrompt(item.prompt); }}
                        className="mt-1 text-[11px] font-medium px-3 py-1 rounded-full"
                        style={{ background: "rgba(124,90,246,0.9)", color: "white" }}
                      >
                        ✦ Try this edit
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={techniqueBadgeStyle(item.technique || "")}>
                      {item.technique}
                    </span>
                    <p className="text-xs font-medium text-foreground mt-2">{item.label}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* EXPLORE CTA */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/examples")}
            className="text-sm font-medium px-8 py-3 rounded-lg transition-all duration-150 cursor-pointer"
            style={{ background: "transparent", border: "1px solid #3D3D4D", color: "#E5E7EB" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#7C5AF6";
              e.currentTarget.style.color = "#A78BFA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3D3D4D";
              e.currentTarget.style.color = "#E5E7EB";
            }}
          >
            Explore all examples →
          </button>
        </div>
      </div>
    </section>
  );
};

export default LiveGallery;
