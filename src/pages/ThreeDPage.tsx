import SidebarLayout from "@/components/layout/SidebarLayout";
import { Box, Sparkles } from "lucide-react";
import { useState } from "react";

const ThreeDPage = () => {
  const [tab, setTab] = useState<"text" | "image">("text");

  return (
    <SidebarLayout>
      <div className="flex-1 flex flex-col">
        {/* Tab bar */}
        <div className="border-b border-border px-6 pt-4">
          <div className="flex gap-1">
            <button
              onClick={() => setTab("text")}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                tab === "text"
                  ? "bg-card text-foreground border border-border border-b-0"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Text to 3D
            </button>
            <button
              onClick={() => setTab("image")}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                tab === "image"
                  ? "bg-card text-foreground border border-border border-b-0"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Image to 3D
            </button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Box className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base text-foreground font-medium mb-1">
              {tab === "text" ? "Create 3D models from text" : "Convert images to 3D"}
            </p>
            <p className="text-sm text-muted-foreground">
              {tab === "text"
                ? "Describe your 3D model below to get started"
                : "Upload an image to convert it into a 3D model"}
            </p>
          </div>
        </div>

        {/* Bottom prompt */}
        <div className="border-t border-border px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3 border border-border">
              <input
                type="text"
                placeholder={tab === "text" ? "a low-poly fox with red fur, game asset style" : "Upload an image first…"}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                disabled={tab === "image"}
              />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-40 cursor-not-allowed">
                <Sparkles className="w-4 h-4 inline mr-1.5" />
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ThreeDPage;
