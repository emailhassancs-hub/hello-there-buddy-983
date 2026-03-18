import { useNavigate } from "react-router-dom";
import { Image, Wand2, Eraser, ZoomIn, Box, ImagePlus, Settings2, GitBranch } from "lucide-react";

const features = [
  { icon: Image, name: "Generate Image", desc: "Text to image with 4 AI models", path: "/image" },
  { icon: Wand2, name: "Edit Image", desc: "Modify any image with AI", path: "/edit" },
  { icon: Eraser, name: "Remove Background", desc: "One-click clean cutout", path: "/edit" },
  { icon: ZoomIn, name: "Upscale", desc: "2K and 4K resolution boost", path: "/edit" },
  { icon: Box, name: "Text to 3D", desc: "Generate 3D models from text", path: "/3d" },
  { icon: ImagePlus, name: "Image to 3D", desc: "Convert photos to 3D assets", path: "/3d" },
  { icon: Settings2, name: "Optimize 3D", desc: "Game-ready polygon reduction", path: "/3d" },
  { icon: GitBranch, name: "Multi-Step Workflow", desc: "Chain tools together", path: "/workflow" },
];

const FeatureDiscoveryStrip = () => {
  const navigate = useNavigate();

  return (
    <section className="px-6 md:px-10 py-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-base font-semibold text-foreground mb-4">What you can create</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {features.map((f) => (
            <button
              key={f.name}
              onClick={() => navigate(f.path)}
              className="flex-shrink-0 w-[180px] h-[180px] rounded-xl border border-border bg-card overflow-hidden group cursor-pointer hover:border-primary/40 transition-all"
            >
              {/* Visual area */}
              <div className="h-[65%] bg-muted/30 flex items-center justify-center">
                <f.icon className="w-10 h-10 text-primary opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </div>
              {/* Info area */}
              <div className="h-[35%] px-3 py-2.5 text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <f.icon className="w-4 h-4 text-primary" />
                  <span className="text-[13px] font-medium text-foreground">{f.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureDiscoveryStrip;
