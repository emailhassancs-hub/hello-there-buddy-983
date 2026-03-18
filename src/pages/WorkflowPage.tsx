import SidebarLayout from "@/components/layout/SidebarLayout";
import { GitBranch, Plus, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const workflowTemplates = [
  { name: "Prompt → Image → 3D", steps: 3, description: "Generate an image then convert to 3D", prompt: "Generate an image and convert it to a 3D model" },
  { name: "Image → Remove BG → 3D", steps: 3, description: "Clean background then create 3D model", prompt: "Remove the background from this image and convert it to a 3D model" },
  { name: "Prompt → Image → Upscale → Edit", steps: 4, description: "Full creative pipeline", prompt: "Generate an image, upscale it, then help me edit it" },
];

const WorkflowPage = () => {
  const navigate = useNavigate();
  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-foreground">Workflows</h1>
          <button
            onClick={() => navigate("/studio")}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Build your own
          </button>
        </div>

        {/* Featured workflows */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-foreground mb-4">Featured Workflows</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workflowTemplates.map((wf) => (
              <div
                key={wf.name}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <GitBranch className="w-5 h-5 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{wf.steps} steps</span>
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">{wf.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{wf.description}</p>
                <button
                  onClick={() => navigate(`/studio?initial_prompt=${encodeURIComponent(wf.prompt)}`)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-3 h-3" /> Try this workflow
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* My workflows - empty */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-4">My Workflows</h2>
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
            <GitBranch className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No saved workflows yet. Build one above.</p>
          </div>
        </section>

        {/* Builder placeholder */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-foreground mb-4">Build your own workflow</h2>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
            <div className="w-24 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">Step 1</span>
            </div>
            <button className="w-8 h-8 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </SidebarLayout>
  );
};

export default WorkflowPage;
