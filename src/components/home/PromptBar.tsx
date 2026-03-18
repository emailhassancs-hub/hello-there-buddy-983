import { useRef, useState, useEffect } from "react";
import { Plus, Sparkles, X, Settings2, Zap, Brain, Image, Wand2, Box, GitBranch, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import type { Project } from "@/hooks/use-projects";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileUpload } from "@/components/chat/useFileUpload";
import ModelSelectorPanel from "@/components/home/ModelSelectorPanel";

const MAX_CHARS = 500;

type ToolTab = "image" | "edit" | "3d" | "workflow";

const toolTabs: { id: ToolTab; label: string; icon: typeof Image }[] = [
  { id: "image", label: "Image", icon: Image },
  { id: "edit", label: "Edit", icon: Wand2 },
  { id: "3d", label: "3D", icon: Box },
  { id: "workflow", label: "Workflow", icon: GitBranch },
];

const suggestionsByTab: Record<ToolTab, string[]> = {
  image: [
    "A futuristic city at night",
    "A portrait of a warrior",
    "Abstract digital art",
    "A magical forest",
    "Cyberpunk street scene",
    "A serene mountain landscape",
  ],
  edit: [
    "Change the lighting",
    "Add a sunset background",
    "Make it look futuristic",
    "Change clothes to armor",
    "Remove the person",
    "Add rain effects",
  ],
  "3d": [
    "A fantasy weapon",
    "A sci-fi vehicle",
    "A game prop chest",
    "A character model",
    "An architectural structure",
    "A magical potion bottle",
  ],
  workflow: [
    "Photo to 3D game asset",
    "Image enhancement pipeline",
    "Creative iteration chain",
    "Character turnaround sheet",
    "Batch style transfer",
    "Multi-angle render",
  ],
};

const CREDIT_PER_VARIATION = 4;

const PromptBar = () => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [model, setModel] = useState("QWEN");
  const [ratio, setRatio] = useState("1:1");
  const [variations, setVariations] = useState(() => {
    const saved = localStorage.getItem("ra_variations");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [mode, setMode] = useState<"fast" | "think">("fast");
  const [activeTab, setActiveTab] = useState<ToolTab>("image");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    handleFileSelect: handleUploadFiles,
    uploadedImageUrls,
    uploadedImagePreviews,
    removeUploadedUrl,
    isUploading,
  } = useFileUpload({ apiUrl: "" } as any);

  useEffect(() => {
    localStorage.setItem("ra_variations", String(variations));
  }, [variations]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    handleUploadFiles(e.target.files);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setPrompt(value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const project = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: { name: trimmed },
      });

      const params = new URLSearchParams();
      if (project.id) params.set("projectId", project.id);
      params.set("initial_prompt", trimmed);
      if (uploadedImageUrls && uploadedImageUrls.length > 0) {
        params.set("image_urls", encodeURIComponent(JSON.stringify(uploadedImageUrls)));
      }
      navigate(`/studio?${params.toString()}`);
    } catch (error: any) {
      console.error("Failed to create project from prompt:", error);
      toast({
        title: "Unable to start project",
        description: error?.message || "Something went wrong while creating your project.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
  };

  const totalCredits = variations * CREDIT_PER_VARIATION;
  const charCount = prompt.length;
  const isNearLimit = charCount >= 400;
  const isAtLimit = charCount >= MAX_CHARS;
  const suggestions = suggestionsByTab[activeTab];

  return (
    <>
      {/* Model selector panel */}
      {showModelSelector && (
        <ModelSelectorPanel
          activeTab={activeTab}
          model={model}
          ratio={ratio}
          onModelChange={setModel}
          onRatioChange={setRatio}
          onClose={() => setShowModelSelector(false)}
        />
      )}

      <div className="fixed bottom-0 left-[54px] right-0 z-[80] border-t border-border bg-card">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Upload panel */}
        {showUploadPanel && (
          <div className="px-4 pt-3 pb-2 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">Reference images</span>
              <button onClick={() => setShowUploadPanel(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">Images guide the style and content of your generation</p>

            {isUploading && (
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border mb-2">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                <span className="text-xs text-muted-foreground">Uploading...</span>
              </div>
            )}

            {uploadedImagePreviews.length > 0 && !isUploading && (
              <div className="flex flex-wrap gap-2 mb-2">
                {uploadedImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Upload ${index + 1}`} className="w-16 h-16 object-cover rounded-lg border border-border" />
                    <button
                      onClick={() => removeUploadedUrl(index)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadedImagePreviews.length < 3 && (
              <button
                onClick={handleUploadClick}
                className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary/40 transition-colors"
              >
                <span className="text-xs text-muted-foreground">Drop images here</span>
                <span className="text-[11px] text-primary">or click to browse</span>
              </button>
            )}
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4">
          {/* Row 1: Tool type tabs */}
          <div className="flex items-center gap-1 pt-2.5 pb-1.5">
            {toolTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 h-[30px] rounded-lg text-xs font-medium transition-all border ${
                  activeTab === tab.id
                    ? "bg-primary/20 text-primary border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Row 2: Prompt textarea */}
          <div className="flex items-start gap-2 py-2">
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowUploadPanel(!showUploadPanel)}
                  className={`mt-1 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-all ${
                    showUploadPanel
                      ? "bg-primary/15 text-primary rotate-45"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Upload reference image</TooltipContent>
            </Tooltip>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder="Describe what you want to create…"
              rows={1}
              style={{ maxHeight: "120px", minHeight: "44px" }}
              className="flex-1 min-w-0 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none overflow-y-auto py-2"
            />

            {charCount > 0 && (
              <span className={`text-[11px] shrink-0 mt-3 ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-muted-foreground"}`}>
                {charCount}/{MAX_CHARS}
              </span>
            )}

            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button className="mt-1 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                  <AtSign className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Ask AI Assist</TooltipContent>
            </Tooltip>
          </div>

          {/* Row 3: Controls */}
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Model chip */}
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-secondary border border-border text-foreground hover:border-primary/50 transition-colors"
              >
                <Settings2 className="w-3 h-3" />
                {model} / {ratio}
              </button>

              {/* Fast/Think segmented toggle */}
              <div className="flex items-center rounded-lg bg-secondary border border-border p-[3px]">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setMode("fast")}
                      className={`flex items-center gap-1 px-3 h-[26px] rounded-md text-xs font-medium transition-all ${
                        mode === "fast"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Zap className="w-3 h-3" /> Fast
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Quick generation, lower quality. Best for exploring ideas.</TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setMode("think")}
                      className={`flex items-center gap-1 px-3 h-[26px] rounded-md text-xs font-medium transition-all ${
                        mode === "think"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Brain className="w-3 h-3" /> Think
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Slower generation, higher quality. Best for final outputs.</TooltipContent>
                </Tooltip>
              </div>

              {/* Variations */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Outputs:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setVariations(n)}
                      className={`w-7 h-7 rounded-md text-[13px] font-medium transition-all border ${
                        variations === n
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Create button */}
            <Button
              onClick={handleGenerate}
              className="shrink-0 gap-2 h-9 rounded-lg text-[13px] font-semibold px-5"
              disabled={isSubmitting || !prompt.trim()}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? "Creating…" : `Create · ${totalCredits}cr`}
            </Button>
          </div>

          {/* Row 4: Suggestion pills */}
          <div className="pb-2.5">
            <span className="text-[11px] text-muted-foreground mb-1 block">Try a quick idea:</span>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="shrink-0 px-3 h-7 rounded-full border border-border bg-secondary text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PromptBar;
