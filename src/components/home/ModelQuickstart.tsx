import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

const models = [
  { name: "QWEN", type: "Image", badge: "Recommended", path: "/image?model=qwen", image: "https://resources.rapidassets.ai/api/v1/image-editing/alien.webp" },
  { name: "Seedream4", type: "Image", path: "/image?model=seedream4", image: "https://resources.rapidassets.ai/api/v1/image-editing/ship.webp" },
  { name: "Flux", type: "Image", path: "/image?model=flux", image: "https://resources.rapidassets.ai/api/v1/image-editing/flying_cat.webp" },
  { name: "Nano Banana", type: "Image", path: "/image?model=nano-banana", image: "https://resources.rapidassets.ai/api/v1/image-editing/elf.webp" },
  { name: "Text → 3D", type: "3D", path: "/3d", image: "https://resources.rapidassets.ai/api/v1/image-editing/hammer.webp" },
  { name: "Flux Pro", type: "Image", locked: true, path: "/image", image: "https://resources.rapidassets.ai/api/v1/image-editing/character_gen.webp" },
];

const ModelQuickstart = () => {
  const navigate = useNavigate();

  return (
    <section className="px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4">Model Quickstart</h2>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {models.map((model) => (
            <button
              key={model.name}
              onClick={() => !model.locked && navigate(model.path)}
              className={`flex-shrink-0 w-[140px] rounded-xl border bg-card overflow-hidden group transition-all duration-150 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(124,90,246,0.2)] ${
                model.locked
                  ? "border-border opacity-70 cursor-not-allowed"
                  : "border-border hover:border-primary-glow"
              }`}
            >
              <div className="relative aspect-square">
                <img src={model.image} alt={model.name} className="w-full h-full object-cover" />
                {model.locked && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                )}
                {model.badge && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-semibold rounded bg-primary text-primary-foreground">
                    {model.badge}
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-medium text-foreground truncate">{model.name}</p>
                <p className="text-[10px] text-muted-foreground">{model.type}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModelQuickstart;
