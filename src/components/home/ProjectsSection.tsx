import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProjectCard from "./ProjectCard";
import { useProjects } from "@/hooks/use-projects";

function getInitials(name?: string, email?: string) {
  const source = name || email || "";
  if (!source) return "";
  const [first, second] = source.split(" ");
  if (first && second) {
    return `${first[0]}${second[0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

const ProjectsSection = () => {
  const [view, setView] = useState<"my" | "shared">("my");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch projects using backend filters
  const {
    data: myProjectsData = [],
    isLoading: isLoadingMy,
    isError: isErrorMy,
  } = useProjects({ type: "my" });

  const {
    data: sharedProjectsData = [],
    isLoading: isLoadingShared,
    isError: isErrorShared,
  } = useProjects({ type: "shared" });

  const isMyView = view === "my";
  const projectsAll = isMyView ? myProjectsData : sharedProjectsData;
  const isLoading = isMyView ? isLoadingMy : isLoadingShared;
  const isError = isMyView ? isErrorMy : isErrorShared;

  const maxVisible = isMyView ? 3 : 4; // 3 projects + New Project card = 4 grid items
  const projects = projectsAll.slice(0, maxVisible);
  const hasMore = projectsAll.length > maxVisible;

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
              Shared with Me
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="h-[140px] rounded-lg border border-dashed border-border bg-muted/30 animate-pulse col-span-1 sm:col-span-2 md:col-span-3" />
          </div>
        )}

        {!isLoading && !isError && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* {view === "my" && <ProjectCard isNew />} */}
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id ?? i}
                id={p.id}
                title={p.name}
                lastModified={formatDistanceToNow(new Date(p.updatedAt), {
                  addSuffix: true,
                })}
                assetCount={0}
                assetType="IMG"
                sharerName={view === "shared" ? p.creator?.name : undefined}
                sharerInitials={
                  view === "shared"
                    ? getInitials(p.creator?.name, p.creator?.email)
                    : undefined
                }
                projectCreatorId={p.creatorId}
                permission={view === "shared" ? "VIEW" : undefined}
                canDelete={view === "my"}
                canEdit={view === "my"}
                onDeleted={() => {
                  queryClient.invalidateQueries({ queryKey: ["projects", "my"] });
                  queryClient.invalidateQueries({ queryKey: ["projects", "shared"] });
                }}
                onUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ["projects", "my"] });
                  queryClient.invalidateQueries({ queryKey: ["projects", "shared"] });
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && hasMore && (
          <div className="mt-3 text-right">
            <button
              onClick={() => navigate("/projects")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </button>
          </div>
        )}

        {!isLoading && !isError && projects.length === 0 && (
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
