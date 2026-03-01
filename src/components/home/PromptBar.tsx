import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SuggestionChips from "./SuggestionChips";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import type { Project } from "@/hooks/use-projects";

const PromptBar = () => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

      // 2) Redirect to /app with projectId and initial prompt in query params
      const params = new URLSearchParams();
      if (project.id) {
        params.set("projectId", project.id);
      }
      params.set("initial_prompt", trimmed);

      navigate(`/app?${params.toString()}`);
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
        <div className="relative rounded-lg bg-background overflow-hidden">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your asset…"
          rows={3}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex items-end justify-between gap-3 px-4 pb-3">
          <SuggestionChips onSelect={(p) => setPrompt(p)} />
          <Button onClick={handleGenerate} className="shrink-0 gap-2" disabled={isSubmitting}>
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? "Starting..." : "Generate"}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBar;
