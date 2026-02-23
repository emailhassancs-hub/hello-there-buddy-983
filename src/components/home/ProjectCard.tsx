import { useState } from "react";
import { Plus, FolderOpen, Pencil, Share2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  isNew?: boolean;
  title?: string;
  lastModified?: string;
  assetCount?: number;
  assetType?: "IMG" | "3D" | "TEX";
  gradientFrom?: string;
  gradientTo?: string;
  // Shared view props
  sharerName?: string;
  sharerInitials?: string;
  permission?: "VIEW" | "EDIT";
}

const ProjectCard = ({
  isNew = false,
  title = "Untitled Project",
  lastModified = "2 days ago",
  assetCount = 0,
  assetType = "IMG",
  gradientFrom = "from-muted",
  gradientTo = "to-accent",
  sharerName,
  sharerInitials,
  permission,
}: ProjectCardProps) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  if (isNew) {
    return (
      <button
        onClick={() => navigate("/app")}
        className="flex flex-col items-center justify-center min-w-[200px] h-[220px] rounded-lg border-2 border-dashed border-border hover:border-primary/40 bg-background hover:bg-accent/50 transition-colors gap-2"
      >
        <Plus className="w-6 h-6 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">New Project</span>
      </button>
    );
  }

  return (
    <div
      className="relative min-w-[200px] w-[200px] rounded-lg border border-border bg-background overflow-hidden group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className={`relative h-[120px] bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
        {/* Asset type badge */}
        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-background/80 text-foreground backdrop-blur-sm">
          {assetType}
        </span>

        {/* Sharer info overlay */}
        {sharerName && sharerInitials && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-semibold">
              {sharerInitials}
            </span>
            <span className="text-[10px] text-foreground font-medium bg-background/70 backdrop-blur-sm px-1 rounded">
              {sharerName}
            </span>
          </div>
        )}

        {/* Permission badge */}
        {permission && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-primary/20 text-primary">
            {permission}
          </span>
        )}

        {/* Hover actions */}
        {hovered && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center gap-2">
            <button className="p-1.5 rounded-md bg-background border border-border hover:bg-accent" title="Open">
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-md bg-background border border-border hover:bg-accent" title="Rename">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-md bg-background border border-border hover:bg-accent" title="Share">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-md bg-background border border-border hover:bg-accent text-destructive" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-[11px] font-mono text-muted-foreground mt-1">
          {lastModified} · {assetCount} asset{assetCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default ProjectCard;
