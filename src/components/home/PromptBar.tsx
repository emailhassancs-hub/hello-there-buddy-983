import { useRef, useState } from "react";
import { Lightbulb, Plus, Sparkles, Upload, User, X, Zap } from "lucide-react";
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

const PromptBar = () => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Reuse the same upload behavior as the /studio chat input
  const {
    handleFileSelect: handleUploadFiles,
    uploadedImageUrls,
    uploadedImagePreviews,
    removeUploadedUrl,
    isUploading,
  } = useFileUpload({
    apiUrl: "",
  } as any);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    // Delegate to shared upload hook (validations + /api/v1/upload-image)
    handleUploadFiles(e.target.files);
  };

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // 1) Create a new project with this prompt as the name
      const project = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: { name: trimmed },
      });

      // 2) Redirect to /studio with projectId and initial prompt in query params
      const params = new URLSearchParams();
      if (project.id) {
        params.set("projectId", project.id);
      }
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

  return (
    <div className="w-full max-w-[700px] mx-auto">
      <div className="relative rounded-lg p-[1px] shadow-card">
        {/* Rotating shine border */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div
            className="absolute inset-[-300%] animate-border-shine"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, transparent 70%, hsl(var(--muted-foreground) / 0.15) 75%, hsl(var(--foreground) / 0.3) 82%, hsl(var(--primary-glow) / 0.2) 88%, hsl(var(--muted-foreground) / 0.15) 93%, transparent 97%)",
            }}
          />
        </div>
        {/* Inner content */}
        <div className="relative rounded-xl bg-background overflow-hidden px-3 py-2 md:px-4 md:py-3">
          {/* Hidden file input for uploads */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

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
                    className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg border border-border/50"
                  />
                  <button
                    onClick={() => removeUploadedUrl(index)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Top row: upload + main input */}
          <div className="flex items-center">
            {/* Left: upload */}
           

            {/* Center: textarea */}
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 125)}px`;
              }}
              placeholder="Describe your asset…"
              rows={1}
              style={{ maxHeight: "125px" }}
              className="flex-1 min-w-0 resize-none bg-transparent px-2 py-2 text-sm md:text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none overflow-y-auto"
            />
          </div>

          {/* Second row: suggestions + actions */}
          <div className="mt-2 flex flex-col gap-3 md:flex-row items-start md:justify-between px-1">
            {/* Suggestions row */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8 rounded-lg hover:bg-muted/50"
                    onClick={handleUploadClick}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="min-w-lg bg-gray-900 dark:bg-gray-800 border-gray-700 text-white p-2 z-[1000]"
                >
                  <p>Upload Image</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2">
              <SuggestionChips onSelect={(p) => setPrompt(p)} />
            </div>

            {/* Action row: response mode, HITL, Generate */}
            <div className="flex items-center gap-2 md:justify-end">

              {/* Generate */}
              <Button
                onClick={handleGenerate}
                className="shrink-0 gap-2 h-9 rounded-lg"
                disabled={isSubmitting || !prompt.trim()}
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? "Starting..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBar;
