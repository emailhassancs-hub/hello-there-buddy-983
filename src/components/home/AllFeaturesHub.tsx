import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image, Wand2, Eraser, ZoomIn, Box, Settings2, GitBranch, Palette } from "lucide-react";

const categories = ["All", "Image", "Edit", "3D", "Workflow"] as const;

const features = [
  { icon: Image, title: "Image Generation", description: "Create from text prompts", category: "Image", path: "/image" },
  { icon: Wand2, title: "Image Editing", description: "Transform existing images", category: "Edit", path: "/edit" },
  { icon: Eraser, title: "Background Removal", description: "Clean precise cutouts", category: "Edit", path: "/edit" },
  { icon: ZoomIn, title: "Image Upscaling", description: "Enhance resolution 4x", category: "Edit", path: "/upscale" },
  { icon: Box, title: "Text to 3D", description: "Generate 3D from text", category: "3D", path: "/3d" },
  { icon: Box, title: "Image to 3D", description: "Convert images to 3D", category: "3D", path: "/3d" },
  { icon: Settings2, title: "3D Optimization", description: "Production ready assets", category: "3D", path: "/3d" },
  { icon: Palette, title: "Color Changer", description: "Edit colors & materials", category: "Edit", path: "/edit" },
  { icon: GitBranch, title: "Workflow Chains", description: "Multi-step pipelines", category: "Workflow", path: "/workflow" },
];

const AllFeaturesHub = () => {
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>("All");
  const navigate = useNavigate();

  const filtered = activeCategory === "All"
    ? features
    : features.filter((f) => f.category === activeCategory);

  return (
    <section className="px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4">All Features</h2>

        {/* Category tabs */}
        <div className="flex gap-1 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                activeCategory === cat
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((f) => (
            <button
              key={f.title}
              onClick={() => navigate(f.path)}
              className="p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent transition-all text-left group"
            >
              <f.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs font-medium text-foreground">{f.title}</p>
              <p className="text-[11px] text-muted-foreground">{f.description}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AllFeaturesHub;
