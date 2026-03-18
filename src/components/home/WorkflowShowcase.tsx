import { useNavigate } from "react-router-dom";
import { Image, Eraser, Box, Settings2, Upload, Wand2, ZoomIn, Copy, ArrowRight } from "lucide-react";

const workflows = [
  {
    name: "Photo to 3D Game Asset",
    steps: [
      { icon: Image, label: "Generate Image" },
      { icon: Eraser, label: "Remove BG" },
      { icon: Box, label: "Generate 3D" },
      { icon: Settings2, label: "Optimize 3D" },
    ],
    description: "Turn a text prompt into a game-ready 3D asset in 4 steps",
    stepCount: 4,
  },
  {
    name: "Image Enhancement Pipeline",
    steps: [
      { icon: Upload, label: "Upload Image" },
      { icon: Wand2, label: "Edit Lighting" },
      { icon: ZoomIn, label: "Upscale 4K" },
    ],
    description: "Polish any image with AI-powered editing and resolution boost",
    stepCount: 3,
  },
  {
    name: "Creative Iteration",
    steps: [
      { icon: Image, label: "Generate Image" },
      { icon: Wand2, label: "Edit Style" },
      { icon: Copy, label: "Variate" },
      { icon: ZoomIn, label: "Upscale" },
    ],
    description: "Explore variations until you get the perfect result",
    stepCount: 4,
  },
];

const WorkflowShowcase = () => {
  const navigate = useNavigate();

  return (
    <section className="px-6 md:px-10 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-foreground">Create with Workflows</h2>
          <button
            onClick={() => navigate("/workflow")}
            className="text-[13px] text-primary hover:underline"
          >
            View all →
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground mb-4">
          Chain image generation, editing, and 3D into one seamless pipeline
        </p>

        <div className="space-y-2.5">
          {workflows.map((wf) => (
            <div
              key={wf.name}
              className="flex items-center gap-6 p-5 rounded-xl border border-border bg-card group hover:border-primary/30 transition-colors"
            >
              {/* Chain visualization */}
              <div className="flex-1 flex items-center gap-0 min-w-0">
                {wf.steps.map((step, i) => (
                  <div key={i} className="flex items-center">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border">
                      <step.icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-foreground whitespace-nowrap">{step.label}</span>
                    </div>
                    {i < wf.steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 mx-1 text-border group-hover:text-primary transition-colors shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="shrink-0 text-right max-w-[280px]">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <h3 className="text-[15px] font-semibold text-foreground">{wf.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-success/10 text-success">
                    {wf.stepCount} steps
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 text-right">{wf.description}</p>
                <button className="text-xs font-medium text-primary border border-primary/40 rounded-lg px-4 py-1.5 hover:bg-primary/10 transition-colors">
                  Try this →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowShowcase;
