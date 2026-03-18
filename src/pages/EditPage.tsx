import SidebarLayout from "@/components/layout/SidebarLayout";
import { Wand2 } from "lucide-react";

const EditPage = () => {
  return (
    <SidebarLayout>
      <div className="flex-1 flex">
        {/* Left panel - edit tools */}
        <div className="w-[320px] border-r border-border p-4 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Edit Tools</h2>

          {/* Tool tabs */}
          <div className="flex flex-wrap gap-1.5">
            {["Color & Material", "Complex Transform", "Lighting", "General Edit", "Remove BG", "Upscale", "Segment"].map((tab) => (
              <button
                key={tab}
                className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Placeholder controls */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground text-center">Select a tool to see controls</p>
          </div>
        </div>

        {/* Right panel - image preview */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/30">
            <Wand2 className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drop an image here</p>
            <p className="text-xs text-primary cursor-pointer hover:underline">or click to browse</p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default EditPage;
