import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectCard from "./ProjectCard";

const myProjects = [
  { title: "Dark Fantasy Pack", lastModified: "2h ago", assetCount: 12, assetType: "IMG" as const, gradientFrom: "from-muted", gradientTo: "to-accent" },
  { title: "Sci-fi Props", lastModified: "1d ago", assetCount: 8, assetType: "3D" as const, gradientFrom: "from-accent", gradientTo: "to-muted" },
  { title: "Stone Textures", lastModified: "3d ago", assetCount: 24, assetType: "TEX" as const, gradientFrom: "from-muted", gradientTo: "to-background" },
];

const sharedProjects = [
  {
    title: "Team Environment",
    lastModified: "5h ago",
    assetCount: 6,
    assetType: "IMG" as const,
    sharerName: "Alex",
    sharerInitials: "AK",
    permission: "EDIT" as const,
    gradientFrom: "from-accent",
    gradientTo: "to-muted",
  },
];

const ProjectsSection = () => {
  const [view, setView] = useState<"my" | "shared">("my");

  const projects = view === "my" ? myProjects : sharedProjects;

  return (
    <section className="px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Projects</h2>
          <div className="flex rounded-full border border-border overflow-hidden">
            <button
              onClick={() => setView("my")}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                view === "my"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              My Projects
            </button>
            <button
              onClick={() => setView("shared")}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                view === "shared"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              Shared with You
            </button>
          </div>
        </div>

        {projects.length === 0 && !view ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {view === "my" && <ProjectCard isNew />}
            {projects.map((p, i) => (
              <ProjectCard key={i} {...p} />
            ))}
          </div>
        )}

        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              {view === "my"
                ? "No projects yet. Start creating!"
                : "Nothing shared with you yet."}
            </p>
            <Button variant="outline" size="sm">
              {view === "my" ? "Create Project" : "Explore Community"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsSection;
