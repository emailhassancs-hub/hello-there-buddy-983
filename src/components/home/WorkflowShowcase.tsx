import { useNavigate } from "react-router-dom";

const BASE = "https://games-ai-studio-ms-image-preprocessing-develop-347148155332.us-central1.run.app/api/v1";

const workflows = [
  {
    title: "Image → Edited → 3D Asset",
    steps: ["Generate Image", "Edit (Change Material)", "Convert to 3D", "Download GLB"],
    thumbnail: `${BASE}/model-images/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.webp`,
    stepCount: 4,
  },
  {
    title: "Text → 3D → Optimize",
    steps: ["Write Prompt", "Generate 3D", "Optimize (midpoly)", "Export"],
    thumbnail: `${BASE}/model-images/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.webp`,
    stepCount: 4,
  },
  {
    title: "Concept Art Pipeline",
    steps: ["Generate Image (Qwen)", "Upscale 4K", "Remove BG", "Convert to 3D"],
    thumbnail: `${BASE}/image-generation/qwen_1768213196_qwen_1768213190_0_.png`,
    stepCount: 4,
  },
];

const WorkflowShowcase = () => {
  const navigate = useNavigate();

  return (
    <section className="px-8 lg:px-16 py-12">
      <div className="max-w-7xl mx-auto">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#6B7280" }}>
          CREATE WITH WORKFLOWS
        </span>
        <h2 className="text-2xl font-semibold text-foreground mt-1 mb-6">
          Chain tools together for complex pipelines
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {workflows.map((wf) => (
            <div
              key={wf.title}
              className="min-w-[320px] flex-shrink-0 rounded-xl overflow-hidden border border-border transition-all duration-200 cursor-pointer group"
              style={{ background: "#1E1E25" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#7C5AF6";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onClick={() => navigate("/workflow")}
            >
              <div className="relative h-40 overflow-hidden" style={{ background: "#141418" }}>
                <img src={wf.thumbnail} alt={wf.title} className="w-full h-full object-contain" loading="lazy" />
                <span
                  className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(124,90,246,0.15)", border: "1px solid rgba(124,90,246,0.4)", color: "#A78BFA" }}
                >
                  {wf.stepCount} steps
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground">{wf.title}</h3>
                <div className="mt-3 flex items-center gap-1 flex-wrap">
                  {wf.steps.map((step, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{ background: "#2A2A35", color: "#9CA3AF" }}>
                        {step}
                      </span>
                      {i < wf.steps.length - 1 && <span className="text-[10px]" style={{ color: "#4B5563" }}>➜</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={() => navigate("/workflow")}
            className="text-sm font-medium hover:underline"
            style={{ color: "#A78BFA" }}
          >
            View all workflows →
          </button>
        </div>
      </div>
    </section>
  );
};

export default WorkflowShowcase;
