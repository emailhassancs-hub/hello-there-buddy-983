import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SuggestionChips from "./SuggestionChips";

const PromptBar = () => {
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    // TODO: wire to generation API
    console.log("Generate:", prompt);
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
                "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f87171 68%, #fb923c 72%, #facc15 76%, #4ade80 80%, #38bdf8 84%, #818cf8 88%, #c084fc 92%, transparent 97%)",
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
          <Button onClick={handleGenerate} className="shrink-0 gap-2">
            <Sparkles className="w-4 h-4" />
            Generate
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBar;
