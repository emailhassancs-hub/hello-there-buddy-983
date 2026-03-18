import SidebarLayout from "@/components/layout/SidebarLayout";
import { Wand2, Upload, X, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import type { Project } from "@/hooks/use-projects";

const EDIT_TOOLS = [
  "Color & Material",
  "Complex Transform",
  "Lighting",
  "General Edit",
  "Remove BG",
  "Upscale",
  "Segment",
];

const EditPage = () => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleEdit = async () => {
    if (!uploadedFile || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const projectName = prompt.trim() || `Edit: ${uploadedFile.name}`;
      const project = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: { name: projectName },
      });

      const params = new URLSearchParams();
      if (project.id) params.set("projectId", project.id);

      const toolContext = selectedTool ? ` using ${selectedTool}` : "";
      params.set(
        "initial_prompt",
        prompt.trim()
          ? `${prompt.trim()}${toolContext}`
          : `Edit this image${toolContext}`
      );

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

  return (
    <SidebarLayout>
      <div className="flex-1 flex">
        {/* Left panel - edit tools */}
        <div className="w-[280px] border-r border-border p-4 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Edit Tools</h2>

          <div className="flex flex-wrap gap-1.5">
            {EDIT_TOOLS.map((tool) => (
              <button
                key={tool}
                onClick={() => setSelectedTool(selectedTool === tool ? null : tool)}
                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                  selectedTool === tool
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                }`}
              >
                {tool}
              </button>
            ))}
          </div>

          {selectedTool && (
            <div className="flex-1 flex flex-col gap-3 pt-2">
              <p className="text-xs text-muted-foreground font-medium">{selectedTool}</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe what to ${selectedTool.toLowerCase()}…`}
                rows={3}
                className="w-full resize-none bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          )}

          {!selectedTool && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center">Select a tool to see controls</p>
            </div>
          )}

          {/* Edit button */}
          <button
            onClick={handleEdit}
            disabled={!uploadedFile || isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isSubmitting ? "Starting…" : "Open in Studio"}
          </button>
        </div>

        {/* Right panel - image preview */}
        <div className="flex-1 flex items-center justify-center p-8">
          {previewUrl ? (
            <div className="relative w-full max-w-lg">
              <img
                src={previewUrl}
                alt="Edit preview"
                className="w-full h-auto rounded-2xl border border-border shadow-card object-contain max-h-[500px]"
              />
              <button
                onClick={clearUpload}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-xs text-center text-muted-foreground mt-2">{uploadedFile?.name}</p>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-lg aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
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
      </div>
    </SidebarLayout>
  );
};

export default EditPage;
