import { useRef, useState } from "react";
import { Plus, Sparkles, X, Settings2, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import SuggestionChips from "./SuggestionChips";
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

const MAX_CHARS = 500;

const PromptBar = () => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [model, setModel] = useState("QWEN");
  const [ratio, setRatio] = useState("1:1");
  const [variations, setVariations] = useState(1);
  const [mode, setMode] = useState<"fast" | "think">("fast");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    handleFileSelect: handleUploadFiles,
    uploadedImageUrls,
    uploadedImagePreviews,
    removeUploadedUrl,
    isUploading,
  } = useFileUpload({ apiUrl: "" } as any);

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

  const charCount = prompt.length;
  const isNearLimit = charCount >= 400;
  const isAtLimit = charCount >= MAX_CHARS;

  return (
    <div className="w-full max-w-[700px] mx-auto">
      <div className="relative rounded-xl p-[1px] shadow-card">
        {/* Rotating shine border */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div
            className="absolute inset-[-300%] animate-border-shine"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, transparent 70%, hsl(var(--muted-foreground) / 0.15) 75%, hsl(var(--foreground) / 0.3) 82%, hsl(var(--primary-glow) / 0.2) 88%, hsl(var(--muted-foreground) / 0.15) 93%, transparent 97%)",
            }}
          />
        </div>

        {/* Inner content */}
        <div className="relative rounded-xl bg-background overflow-hidden">
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

              {/* Uploading indicator */}
              {isUploading && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border mb-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                </div>
              )}

              {/* Thumbnails */}
              {uploadedImagePreviews.length > 0 && !isUploading && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {uploadedImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Upload ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                      />
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

              {/* Drop zone */}
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

          {/* Main input area */}
          <div className="px-4 py-3">
            <div className="flex items-start">
              <textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Describe what you want to create…"
                rows={1}
                style={{ maxHeight: "120px", minHeight: "44px" }}
                className="flex-1 min-w-0 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none overflow-y-auto py-1"
              />
              {charCount > 0 && (
                <span className={`text-[11px] shrink-0 ml-2 mt-1 ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-muted-foreground"}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="px-4 pb-3 flex flex-wrap items-center justify-between gap-2">
            {/* Left: + button, model chip, suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* + button */}
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowUploadPanel(!showUploadPanel)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                      showUploadPanel
                        ? "bg-primary/15 text-primary rotate-45"
                        : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover border-border text-popover-foreground">
                  Reference images
                </TooltipContent>
              </Tooltip>

              {/* Model/ratio chip */}
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-secondary border border-border text-foreground hover:border-primary-glow transition-colors">
                <Settings2 className="w-3 h-3" />
                {model} / {ratio}
              </button>

              {/* Variations picker */}
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setVariations(n)}
                    className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                      variations === n
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Fast/Think toggle */}
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setMode("fast")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    mode === "fast"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-3 h-3" /> Fast
                </button>
                <button
                  onClick={() => setMode("think")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    mode === "think"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Brain className="w-3 h-3" /> Think
                </button>
              </div>

              <SuggestionChips onSelect={(p) => setPrompt(p)} />
            </div>

            {/* Right: Create button */}
            <div className="flex items-center gap-2">
              {variations > 1 && (
                <span className="text-[11px] text-muted-foreground">(~{variations} credits)</span>
              )}
              <Button
                onClick={handleGenerate}
                className="shrink-0 gap-2 h-8 rounded-lg text-xs"
                disabled={isSubmitting || !prompt.trim()}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBar;
