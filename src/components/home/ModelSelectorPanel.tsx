import { useState } from "react";
import { X, Check, Image, Wand2, Box } from "lucide-react";

type ModelTab = "all" | "image" | "edit" | "3d";

interface Model {
  id: string;
  name: string;
  desc: string;
  type: "image" | "edit" | "3d";
  icon: typeof Image;
}

const models: Model[] = [
  { id: "qwen", name: "QWEN", desc: "General purpose, fast", type: "image", icon: Image },
  { id: "seedream4", name: "Seedream4", desc: "Realistic, detailed", type: "image", icon: Image },
  { id: "nano-banana", name: "Nano Banana", desc: "Creative, stylized", type: "image", icon: Image },
  { id: "flux", name: "Flux", desc: "Photorealistic, high quality", type: "image", icon: Image },
  { id: "flux-kontext", name: "Flux Kontext", desc: "Color & material changes", type: "edit", icon: Wand2 },
  { id: "nano-edit", name: "Nano Banana Edit", desc: "Complex transforms", type: "edit", icon: Wand2 },
  { id: "qwen-edit", name: "QWEN Edit Plus", desc: "General editing + refs", type: "edit", icon: Wand2 },
  { id: "seedream4-edit", name: "Seedream4 Edit", desc: "Lighting & weather", type: "edit", icon: Wand2 },
  { id: "text-3d", name: "Text → 3D", desc: "Generate from description", type: "3d", icon: Box },
  { id: "image-3d", name: "Image → 3D", desc: "Convert image to 3D", type: "3d", icon: Box },
];

const ratios = ["Portrait", "Square", "Landscape"] as const;
const resolutions = ["Standard", "2K", "4K"] as const;

interface ModelSelectorPanelProps {
  activeTab: string;
  model: string;
  ratio: string;
  onModelChange: (model: string) => void;
  onRatioChange: (ratio: string) => void;
  onClose: () => void;
}

const ModelSelectorPanel = ({ model, ratio, onModelChange, onRatioChange, onClose }: ModelSelectorPanelProps) => {
  const [filterTab, setFilterTab] = useState<ModelTab>("all");
  const [selectedRatio, setSelectedRatio] = useState<typeof ratios[number]>(
    ratio === "9:16" ? "Portrait" : ratio === "16:9" ? "Landscape" : "Square"
  );
  const [selectedResolution, setSelectedResolution] = useState<typeof resolutions[number]>("Standard");
  const [enhancer, setEnhancer] = useState(false);

  const filtered = filterTab === "all" ? models : models.filter((m) => m.type === filterTab);

  const handleModelClick = (m: Model) => {
    onModelChange(m.name.toUpperCase().replace(/\s+/g, "").replace("→", "-TO-"));
    const ratioMap: Record<string, string> = { Portrait: "9:16", Square: "1:1", Landscape: "16:9" };
    onRatioChange(ratioMap[selectedRatio] || "1:1");
  };

  const tabs: { id: ModelTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "image", label: "Image" },
    { id: "edit", label: "Edit" },
    { id: "3d", label: "3D" },
  ];

  return (
    <div className="fixed bottom-[140px] left-[54px] right-0 z-[85] animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Select model</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mb-4">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilterTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filterTab === t.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-6">
              {/* Model grid */}
              <div className="flex-1">
                <div className="grid grid-cols-4 gap-3">
                  {filtered.map((m) => {
                    const isSelected = model.toUpperCase().includes(m.name.toUpperCase().replace(/\s+/g, "").slice(0, 4));
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleModelClick(m)}
                        className={`relative p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-muted-foreground"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                        <m.icon className="w-9 h-9 mx-auto mb-2 text-primary" />
                        <p className="text-[11px] font-medium text-foreground">{m.name}</p>
                        <span className={`mt-1 inline-block px-1.5 py-0.5 text-[9px] rounded-full ${
                          m.type === "image" ? "bg-blue-500/10 text-blue-400" :
                          m.type === "edit" ? "bg-amber-500/10 text-amber-400" :
                          "bg-green-500/10 text-green-400"
                        }`}>
                          {m.type === "image" ? "Image" : m.type === "edit" ? "Edit" : "3D"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settings panel */}
              <div className="w-[200px] shrink-0 space-y-4">
                {/* Aspect ratio */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">Aspect Ratio</p>
                  <div className="flex gap-1">
                    {ratios.map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedRatio(r)}
                        className={`flex-1 py-1.5 text-[11px] rounded-lg border transition-colors ${
                          selectedRatio === r
                            ? "bg-primary/15 border-primary text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">Resolution</p>
                  <div className="flex flex-col gap-1">
                    {resolutions.map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedResolution(r)}
                        className={`py-1.5 px-3 text-[11px] rounded-lg border text-left transition-colors ${
                          selectedResolution === r
                            ? "bg-primary/15 border-primary text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt enhancer */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Prompt Enhancer</span>
                  <button
                    onClick={() => setEnhancer(!enhancer)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      enhancer ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${
                      enhancer ? "left-[18px]" : "left-0.5"
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelectorPanel;
