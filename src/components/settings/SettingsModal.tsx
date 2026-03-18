import { useState } from "react";
import { X, Search, Lock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
}

const modelCategories = ["All", "Image", "3D", "Edit"] as const;

const models = [
  { name: "QWEN", type: "Image", description: "Versatile all-rounder", locked: false },
  { name: "Seedream4", type: "Image", description: "Photorealistic quality", locked: false },
  { name: "Nano Banana", type: "Image", description: "Creative & stylized", locked: false },
  { name: "Flux", type: "Image", description: "Fast generation", locked: false },
  { name: "Flux Pro", type: "Image", description: "Premium quality", locked: true },
  { name: "Text → 3D", type: "3D", description: "Generate 3D from text", locked: false },
  { name: "Image → 3D", type: "3D", description: "Convert images to 3D", locked: false },
  { name: "Flux Kontext", type: "Edit", description: "Color & material edits", locked: false },
  { name: "Nano Banana Edit", type: "Edit", description: "Complex transforms", locked: false },
  { name: "Seedream4 Edit", type: "Edit", description: "Lighting & weather", locked: false },
  { name: "QWEN Edit Plus", type: "Edit", description: "General editing", locked: false },
];

const orientations = [
  { label: "Portrait", ratio: "3:4", preview: "w-[36px] h-[48px]" },
  { label: "Square", ratio: "1:1", preview: "w-[44px] h-[44px]" },
  { label: "Landscape", ratio: "4:3", preview: "w-[56px] h-[36px]" },
];

const resolutions = ["Standard", "2K", "4K"] as const;

const SettingsModal = ({
  open,
  onClose,
  selectedModel,
  onModelChange,
  selectedRatio,
  onRatioChange,
}: SettingsModalProps) => {
  const [category, setCategory] = useState<typeof modelCategories[number]>("All");
  const [search, setSearch] = useState("");
  const [promptEnhancer, setPromptEnhancer] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [resolution, setResolution] = useState<typeof resolutions[number]>("Standard");

  const filteredModels = models.filter((m) => {
    const matchCat = category === "All" || m.type === category;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 640 }}
            animate={{ x: 0 }}
            exit={{ x: 640 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 bottom-0 w-[640px] max-w-[90vw] bg-background border-l border-border z-[61] flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-sm font-semibold text-foreground">Settings</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Model Selector */}
              <section>
                <h3 className="text-xs font-semibold text-foreground mb-3">Model</h3>

                {/* Category tabs */}
                <div className="flex gap-1 mb-3">
                  {modelCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                        category === cat
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search models…"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Model grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredModels.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => !m.locked && onModelChange(m.name)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedModel === m.name
                          ? "border-primary bg-primary/10"
                          : m.locked
                          ? "border-border opacity-60 cursor-not-allowed"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-foreground">{m.name}</span>
                        {m.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        {selectedModel === m.name && <Check className="w-3 h-3 text-primary" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{m.description}</span>
                      <span className="mt-1 block text-[9px] text-primary/60">{m.type}</span>
                    </button>
                  ))}
                </div>

                {filteredModels.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No models found for "{search}"</p>
                )}
              </section>

              {/* Image Size */}
              <section>
                <h3 className="text-xs font-semibold text-foreground mb-3">Image Size</h3>

                {/* Orientation */}
                <div className="flex gap-2 mb-3">
                  {orientations.map((o) => (
                    <button
                      key={o.label}
                      onClick={() => onRatioChange(o.ratio)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        selectedRatio === o.ratio
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`${o.preview} bg-muted rounded border border-border flex items-center justify-center`}>
                        <span className="text-[8px] text-muted-foreground">{o.ratio}</span>
                      </div>
                      <span className="text-[10px] text-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>

                {/* Resolution */}
                <div className="flex gap-1">
                  {resolutions.map((r) => {
                    const locked = r === "4K";
                    return (
                      <button
                        key={r}
                        onClick={() => !locked && setResolution(r)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                          resolution === r
                            ? "bg-primary/15 text-primary"
                            : locked
                            ? "text-muted-foreground opacity-50 cursor-not-allowed"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                        {locked && <Lock className="w-2.5 h-2.5" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Prompt Enhancer */}
              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">Prompt Enhancer</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">AI rewrites your prompt for better results</p>
                  </div>
                  <button
                    onClick={() => setPromptEnhancer(!promptEnhancer)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      promptEnhancer ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${
                      promptEnhancer ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </section>

              {/* Visibility */}
              <section>
                <h3 className="text-xs font-semibold text-foreground mb-2">Visibility</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setVisibility("public")}
                    className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                      visibility === "public"
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setVisibility("private")}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors text-muted-foreground opacity-50 cursor-not-allowed`}
                  >
                    Private <Lock className="w-2.5 h-2.5" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {visibility === "public" ? "Images appear in Community" : "Only visible to you"}
                </p>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
