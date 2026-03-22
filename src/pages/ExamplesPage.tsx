import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import {
  imageGenItems,
  imageEditItems,
  text3DItems,
  image3DItems,
} from "@/components/examples/gallery-data";

// ── Pill helpers ──────────────────────────────────────────────
const pill = {
  purple: "bg-[rgba(124,90,246,0.22)] border-[rgba(124,90,246,0.5)] text-[#c4b5fd]",
  blue: "bg-[rgba(59,130,246,0.20)] border-[rgba(59,130,246,0.5)] text-[#93c5fd]",
  teal: "bg-[rgba(20,184,166,0.20)] border-[rgba(20,184,166,0.5)] text-[#5eead4]",
  amber: "bg-[rgba(245,158,11,0.18)] border-[rgba(245,158,11,0.5)] text-[#fcd34d]",
  pink: "bg-[rgba(236,72,153,0.18)] border-[rgba(236,72,153,0.45)] text-[#f9a8d4]",
  green: "bg-[rgba(34,197,94,0.15)] border-[rgba(34,197,94,0.45)] text-[#86efac]",
  gray: "bg-[rgba(255,255,255,0.07)] border-[rgba(255,255,255,0.15)] text-white/60",
};

const Pill = ({ color, children }: { color: keyof typeof pill; children: React.ReactNode }) => (
  <span className={`inline-flex text-[9.5px] font-semibold px-2 py-[2px] rounded-full border tracking-[0.03em] ${pill[color]}`}>
    {children}
  </span>
);

const modelPill = (m: string) => m === "Seedream4" ? "purple" : "blue";
const resPill = (r?: string) => r === "4K" ? "green" : r === "2K" ? "amber" : null;
const techPill = (t: string): keyof typeof pill => {
  if (t.includes("Flux")) return "amber";
  if (t.includes("Seedream")) return "purple";
  if (t.includes("Nano")) return "pink";
  if (t.includes("Qwen")) return "blue";
  return "green";
};

// ── Tabs ──────────────────────────────────────────────────────
type TabId = "img" | "edit" | "t3d" | "i3d";
const tabs: { id: TabId; icon: string; label: string; count: number }[] = [
  { id: "img", icon: "🖼", label: "Image Generation", count: 14 },
  { id: "edit", icon: "✏️", label: "Image Editing", count: 12 },
  { id: "t3d", icon: "📦", label: "Text → 3D", count: 9 },
  { id: "i3d", icon: "📷", label: "Image → 3D", count: 12 },
];

// ── Overlay wrapper ──────────────────────────────────────────
const Overlay = ({ label, prompt, badges, button }: {
  label: string; prompt: string; badges: React.ReactNode; button?: React.ReactNode;
}) => (
  <div className="absolute inset-0 flex flex-col justify-end p-[13px] pt-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-[220ms] pointer-events-none group-hover:pointer-events-auto z-10"
    style={{ background: "linear-gradient(to top, rgba(6,4,14,0.92) 0%, rgba(6,4,14,0.30) 45%, transparent 70%)" }}>
    <p className="font-sans text-xs font-bold text-white leading-tight line-clamp-2 mb-1.5">{label}</p>
    <p className="font-sans text-[10.5px] font-light italic text-white/65 leading-[1.45] line-clamp-2 mb-2">{prompt}</p>
    <div className="flex flex-wrap gap-[5px]">{badges}</div>
    {button}
  </div>
);

// ── Image Gen Tile ───────────────────────────────────────────
const ImageTile = ({ item, idx }: { item: typeof imageGenItems[0]; idx: number }) => {
  const navigate = useNavigate();
  return (
    <div className="group break-inside-avoid relative overflow-hidden block cursor-pointer border-[0.5px] border-white/[0.04] rounded-none"
      style={{ animationDelay: `${idx * 40}ms` }}>
      <img src={item.image} alt={item.label} className="w-full block transition-transform duration-[360ms] ease-out group-hover:scale-[1.035]" loading="lazy" />
      {/* Always-visible badges */}
      <div className="absolute top-[9px] left-[9px] flex gap-1 z-[4]">
        <Pill color={modelPill(item.model) as keyof typeof pill}>{item.model}</Pill>
      </div>
      <div className="absolute top-[9px] right-[9px] flex gap-1 z-[4]">
        {resPill(item.resolution) && <Pill color={resPill(item.resolution)!}>{item.resolution}</Pill>}
        <Pill color="gray">{item.ratio}</Pill>
      </div>
      <Overlay label={item.label} prompt={item.prompt}
        badges={<><Pill color={modelPill(item.model) as keyof typeof pill}>{item.model}</Pill><Pill color="gray">{item.ratio}</Pill></>}
        button={
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/image?prompt=${encodeURIComponent(item.prompt)}`); }}
            className="mt-[7px] self-start inline-flex gap-[5px] items-center text-[10px] font-semibold px-[11px] py-1 rounded-full bg-[rgba(124,90,246,0.85)] text-white border-none tracking-[0.02em] hover:bg-[#7c5af6] transition-colors"
          >✦ Try this prompt</button>
        }
      />
    </div>
  );
};

// ── Editing Tile ─────────────────────────────────────────────
const EditingTile = ({ item, idx }: { item: typeof imageEditItems[0]; idx: number }) => (
  <div className="group break-inside-avoid relative overflow-hidden block cursor-pointer border-[0.5px] border-white/[0.04] rounded-none"
    style={{ animationDelay: `${idx * 40}ms` }}>
    {/* Before/After split */}
    <div className="relative flex w-full">
      <div className="w-1/2 overflow-hidden relative">
        <img src={item.before} alt="Before" className="w-[200%] block object-cover transition-transform duration-[360ms] ease-out group-hover:scale-[1.035]" loading="lazy" />
      </div>
      <div className={`w-1/2 overflow-hidden relative ${item.isBackgroundRemove ? "" : ""}`}
        style={item.isBackgroundRemove ? { background: "repeating-conic-gradient(#2a2a35 0% 25%, #1a1a20 0% 50%) 0 0 / 16px 16px" } : undefined}>
        <img src={item.after} alt="After" className="w-[200%] block object-cover -ml-[100%] transition-transform duration-[360ms] ease-out group-hover:scale-[1.035]" loading="lazy" />
      </div>
      {/* Divider */}
      <div className="absolute left-1/2 top-0 w-[1.5px] h-full bg-white/35 -translate-x-1/2 z-[6]" />
      {/* Labels */}
      <span className="absolute top-[7px] left-[7px] font-sans text-[9px] font-bold px-[7px] py-[2px] rounded-full bg-black/55 border border-white/20 text-white/80 tracking-[0.06em] z-[5]">BEFORE</span>
      <span className="absolute top-[7px] right-[7px] font-sans text-[9px] font-bold px-[7px] py-[2px] rounded-full bg-[rgba(124,90,246,0.35)] border border-[rgba(124,90,246,0.6)] text-[#e9d5ff] tracking-[0.06em] z-[5]">AFTER</span>
    </div>
    {/* Always-visible technique badge */}
    <div className="absolute bottom-[9px] left-[9px] z-[7]">
      <Pill color={techPill(item.technique)}>{item.technique}</Pill>
    </div>
    <Overlay label={item.label} prompt={item.prompt}
      badges={<Pill color={techPill(item.technique)}>{item.technique}</Pill>}
    />
  </div>
);

// ── 3D Tile ──────────────────────────────────────────────────
const ThreeDTile = ({ item, idx, type }: {
  item: { thumbnail: string; label: string; prompt: string; specs: string; srcThumb?: string };
  idx: number;
  type: "TEXT→3D" | "IMG→3D";
}) => (
  <div className="group break-inside-avoid relative overflow-hidden block cursor-pointer border-[0.5px] border-white/[0.04] rounded-none"
    style={{ animationDelay: `${idx * 40}ms` }}>
    <img src={item.thumbnail} alt={item.label} className="w-full block transition-transform duration-[360ms] ease-out group-hover:scale-[1.035]" loading="lazy" />
    {/* Always-visible badges */}
    <div className="absolute top-[9px] left-[9px] z-[4]"><Pill color="teal">GLB</Pill></div>
    <div className="absolute top-[9px] right-[9px] z-[4]">
      <Pill color={type === "TEXT→3D" ? "purple" : "amber"}>{type}</Pill>
    </div>
    <span className="absolute bottom-[9px] right-[9px] text-[15px] text-white/35 z-[4]">↻</span>
    {/* Source thumbnail for IMG→3D */}
    {item.srcThumb && (
      <>
        <div className="absolute bottom-[9px] left-[9px] w-9 h-9 rounded-[5px] border-[1.5px] border-white/25 overflow-hidden z-[5]">
          <img src={item.srcThumb} alt="Source" className="w-full h-full object-cover" />
        </div>
        <span className="absolute bottom-[10px] left-[52px] font-sans text-[8.5px] font-semibold text-white/50 tracking-[0.05em] uppercase z-[5]">SOURCE</span>
      </>
    )}
    <Overlay label={item.label} prompt={item.prompt}
      badges={<><Pill color="teal">midpoly</Pill><Pill color="gray">PBR</Pill></>}
    />
  </div>
);

// ── Section Label ────────────────────────────────────────────
const SectionLabel = ({ title, count }: { title: string; count: number }) => (
  <div className="flex items-baseline gap-3 px-6 sm:px-12 pt-9 pb-0">
    <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-[#6b6880]">{title}</span>
    <span className="text-[10px] px-2 py-[2px] rounded-full bg-[rgba(124,90,246,0.14)] border border-[rgba(124,90,246,0.28)] text-[#A78BFA]">
      {count} examples
    </span>
  </div>
);

// ── Main Page ────────────────────────────────────────────────
const ExamplesPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("img");
  const navigate = useNavigate();

  return (
    <SidebarLayout>
      <div className="min-h-full" style={{ background: "#0a0a0d" }}>
        {/* Header */}
        <div className="relative px-6 sm:px-12 pt-[52px] pb-9 overflow-hidden">
          {/* Orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(124,90,246,0.10) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[360px] h-[360px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)" }} />

          {/* Eyebrow */}
          <div className="relative z-10 inline-flex items-center gap-[7px] font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-[#A78BFA] bg-[rgba(124,90,246,0.10)] border border-[rgba(124,90,246,0.28)] rounded-full px-[13px] py-[5px]">
            <span className="w-[5px] h-[5px] rounded-full bg-[#22C55E] animate-[livePulse_2s_ease-in-out_infinite]" />
            Game AI Studio — Gallery
          </div>

          {/* H1 */}
          <h1 className="relative z-10 font-sans text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#E8E6F0] mt-[18px] max-w-[600px]">
            Real outputs.<br />
            <span className="text-[#6b6880]">Every pixel generated by AI.</span>
          </h1>

          {/* Subtitle */}
          <p className="relative z-10 font-sans text-[15px] font-light text-[#6b6880] leading-[1.65] mt-3 max-w-[480px]">
            Browse 47 real generations from our pipeline — images, edits, and 3D models created with a single prompt or image.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap items-center gap-1 px-6 sm:px-12 pb-7 border-b border-[#252530]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`font-sans text-[12.5px] font-medium px-[18px] py-[7px] rounded-full border transition-all duration-[140ms] ${
                activeTab === t.id
                  ? "bg-[#7C5AF6] border-[#7C5AF6] text-white"
                  : "bg-transparent border-[#252530] text-[#6b6880] hover:border-[#A78BFA] hover:text-[#E8E6F0]"
              }`}
            >
              {t.icon} {t.label} <span className="opacity-75 text-[10px] ml-1">{t.count}</span>
            </button>
          ))}
          <button onClick={() => navigate("/image")} className="ml-auto font-sans text-xs text-[#A78BFA] hover:underline hidden sm:inline">
            View in studio →
          </button>
        </div>

        {/* Panels */}
        <div className="animate-in fade-in duration-200">
          {activeTab === "img" && (
            <>
              <SectionLabel title="Image Generation" count={14} />
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5" style={{ columnGap: 0 }}>
                {imageGenItems.map((item, i) => <ImageTile key={item.id} item={item} idx={i} />)}
              </div>
            </>
          )}

          {activeTab === "edit" && (
            <>
              <SectionLabel title="Image Editing" count={12} />
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5" style={{ columnGap: 0 }}>
                {imageEditItems.map((item, i) => <EditingTile key={item.id} item={item} idx={i} />)}
              </div>
            </>
          )}

          {activeTab === "t3d" && (
            <>
              <SectionLabel title="Text → 3D Generation" count={9} />
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5" style={{ columnGap: 0 }}>
                {text3DItems.map((item, i) => <ThreeDTile key={item.id} item={item} idx={i} type="TEXT→3D" />)}
              </div>
            </>
          )}

          {activeTab === "i3d" && (
            <>
              <SectionLabel title="Image → 3D Generation" count={12} />
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5" style={{ columnGap: 0 }}>
                {image3DItems.map((item, i) => <ThreeDTile key={item.id} item={item} idx={i} type="IMG→3D" />)}
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center px-6 sm:px-12 py-20 border-t border-[#252530] mt-12">
          <p className="font-sans text-[11px] font-bold tracking-[0.1em] uppercase text-[#7C5AF6]">GET STARTED</p>
          <h2 className="font-sans text-2xl md:text-[32px] font-bold text-[#E8E6F0] mt-3">Build your first game asset today</h2>
          <p className="font-sans text-[15px] text-[#6b6880] mt-3">No design experience needed. Just type a prompt.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button onClick={() => navigate("/image")} className="px-7 py-3 bg-[#7C5AF6] text-white text-[15px] font-semibold rounded-lg hover:bg-[#6D4AE8] transition-colors">
              ✦ Generate Images →
            </button>
            <button onClick={() => navigate("/3d")} className="px-7 py-3 border border-[#252530] text-[#E8E6F0] text-[15px] font-semibold rounded-lg hover:border-[#7C5AF6] hover:text-[#A78BFA] transition-colors">
              Create 3D Models →
            </button>
            <button onClick={() => navigate("/edit")} className="px-7 py-3 border border-[#252530] text-[#E8E6F0] text-[15px] font-semibold rounded-lg hover:border-[#7C5AF6] hover:text-[#A78BFA] transition-colors">
              Edit Images →
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ExamplesPage;
