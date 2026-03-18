import SidebarLayout from "@/components/layout/SidebarLayout";
import { FolderOpen, Image, Box } from "lucide-react";
import { useState } from "react";

const AssetsPage = () => {
  const [filter, setFilter] = useState<"all" | "images" | "3d">("all");

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-foreground">Assets</h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search assets…"
              className="px-3 py-1.5 text-xs bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-56"
            />
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["all", "images", "3d"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f === "images" ? "Images" : "3D"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-base text-foreground font-medium mb-1">No assets yet</p>
          <p className="text-sm text-muted-foreground mb-6">Images and 3D models you generate will appear here</p>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-white/5 transition-colors">
              <Image className="w-4 h-4" /> Create Image
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-white/5 transition-colors">
              <Box className="w-4 h-4" /> Create 3D
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AssetsPage;
