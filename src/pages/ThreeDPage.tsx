import SidebarLayout from "@/components/layout/SidebarLayout";
import { Box, Sparkles, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import type { Project } from "@/hooks/use-projects";

const ThreeDPage = () => {
  const [tab, setTab] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearUpload = () => {
    setUploadedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleCreate = async () => {
    const isText = tab === "text";
    const trimmedPrompt = prompt.trim();

    if (isText && !trimmedPrompt) return;
    if (!isText && !uploadedFile) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const projectName = isText ? trimmedPrompt : `Image to 3D: ${uploadedFile!.name}`;
      const project = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: { name: projectName },
      });

      const params = new URLSearchParams();
      if (project.id) params.set("projectId", project.id);

      if (isText) {
        params.set("initial_prompt", `Convert to 3D model: ${trimmedPrompt}`);
      } else {
        params.set("initial_prompt", "Convert this image to a 3D model");
      }

      navigate(`/studio?${params.toString()}`);
    } catch (error: any) {
      toast({
        title: "Unable to start project",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = tab === "text" ? prompt.trim().length > 0 : uploadedFile !== null;

  return (
    <SidebarLayout>
      <div className="flex-1 flex flex-col">
        {/* Tab bar */}
        <div className="border-b border-border px-6 pt-4">
          <div className="flex items-center justify-between mb-0">
            <div className="flex gap-1">
              <button
                onClick={() => setTab("text")}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  tab === "text"
                    ? "bg-card text-foreground border border-border border-b-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Text to 3D
              </button>
              <button
                onClick={() => setTab("image")}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  tab === "image"
                    ? "bg-card text-foreground border border-border border-b-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Image to 3D
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          {tab === "text" ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Box className="w-8 h-8 text-primary" />
              </div>
              <p className="text-base text-foreground font-medium mb-1">Create 3D models from text</p>
              <p className="text-sm text-muted-foreground">Describe your 3D model below to get started</p>
            </div>
          ) : (
            <div className="w-full max-w-md">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Upload preview"
                    className="w-full max-h-72 object-contain rounded-2xl border border-border"
                  />
                  <button
                    onClick={clearUpload}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-center text-muted-foreground mt-2">{uploadedFile?.name}</p>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square max-h-72 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm text-foreground font-medium">Drop an image here</p>
                    <p className="text-xs text-primary mt-0.5">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom prompt */}
        <div className="border-t border-border px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3 border border-border studio-input focus-within:border-primary/50">
              <input
                type="text"
                value={tab === "image" ? "" : prompt}
                onChange={(e) => tab === "text" && setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canCreate && handleCreate()}
                placeholder={
                  tab === "text"
                    ? "a low-poly fox with red fur, game asset style…"
                    : uploadedFile
                    ? `Ready to convert "${uploadedFile.name}" to 3D`
                    : "Upload an image first…"
                }
                disabled={tab === "image"}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleCreate}
                disabled={!canCreate || isSubmitting}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? "Starting…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ThreeDPage;
