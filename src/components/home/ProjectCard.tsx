import { useMemo, useState } from "react";
import { Plus, FolderOpen, Pencil, Share2, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import type { Project } from "@/hooks/use-projects";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProjectMembersModal } from "@/components/home/ProjectMembersModal";

interface ProjectCardProps {
  id?: string;
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
  canDelete?: boolean;
  onDeleted?: (id: string) => void;
  canEdit?: boolean;
  onUpdated?: (id: string, name: string) => void;
  projectCreatorId: string;
}

const PROJECT_COLOR_GRADIENTS: Array<{ from: string; to: string }> = [
  { from: "from-orange-50", to: "to-orange-100" },
  { from: "from-amber-50", to: "to-amber-100" },
  { from: "from-yellow-50", to: "to-yellow-100" },
  { from: "from-lime-50", to: "to-lime-100" },
  { from: "from-emerald-50", to: "to-emerald-100" },
  { from: "from-teal-50", to: "to-teal-100" },
  { from: "from-sky-50", to: "to-sky-100" },
  { from: "from-indigo-50", to: "to-indigo-100" },
  { from: "from-fuchsia-50", to: "to-fuchsia-100" },
  { from: "from-rose-50", to: "to-rose-100" },
];

const ProjectCard = ({
  id,
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
  canDelete = false,
  onDeleted,
  canEdit = false,
  onUpdated,
  projectCreatorId,
}: ProjectCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(title);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Pick a stable "random" gradient based on project id or title
  const { effectiveGradientFrom, effectiveGradientTo } = useMemo(() => {
    // If explicit gradients are passed, respect them
    if (gradientFrom && gradientTo && (gradientFrom !== "from-muted" || gradientTo !== "to-accent")) {
      return { effectiveGradientFrom: gradientFrom, effectiveGradientTo: gradientTo };
    }

    const key = (id || title || "").toString();
    if (!key) {
      const fallback = PROJECT_COLOR_GRADIENTS[0];
      return { effectiveGradientFrom: fallback.from, effectiveGradientTo: fallback.to };
    }

    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash + key.charCodeAt(i)) % PROJECT_COLOR_GRADIENTS.length;
    }

    const picked = PROJECT_COLOR_GRADIENTS[hash];
    return { effectiveGradientFrom: picked.from, effectiveGradientTo: picked.to };
  }, [gradientFrom, gradientTo, id, title]);

  const handleDelete = async () => {
    if (!id || isDeleting) return;

    try {
      setIsDeleting(true);
      await apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" });
      toast({
        title: "Project deleted",
        description: "Your project has been removed.",
      });
      onDeleted?.(id);
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Delete failed",
        description: error?.message || "Unable to delete this project.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!id || isRenaming || !newName.trim()) return;

    try {
      setIsRenaming(true);
      const updated = await apiFetch<Project>(`/api/projects/${id}`, {
        method: "PATCH",
        body: { name: newName.trim() },
      });
      const finalName = updated?.name || newName.trim();
      toast({
        title: "Project renamed",
        description: `Project name updated to "${finalName}"`,
      });
      onUpdated?.(id, finalName);
    } catch (error: any) {
      console.error("Failed to rename project:", error);
      toast({
        title: "Rename failed",
        description: error?.message || "Unable to rename this project.",
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleShare = async () => {
    if (!id || isSharing || !shareEmail.trim()) return;

    try {
      setIsSharing(true);
      await apiFetch<Project>(`/api/projects/${id}/share`, {
        method: "POST",
        body: { email: shareEmail.trim() },
      });
      toast({
        title: "Invite sent",
        description: `An invite has been sent to ${shareEmail.trim()}.`,
      });
      setShareEmail("");
    } catch (error: any) {
      console.error("Failed to share project:", error);
      toast({
        title: "Share failed",
        description: error?.message || "Unable to share this project.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (isNew) {
    return (
      <button
        onClick={() => navigate("/app")}
        className="flex flex-col items-center justify-center w-full h-full rounded-lg border-2 border-dashed border-border hover:border-primary/40 bg-background hover:bg-accent/50 transition-colors gap-2"
      >
        <Plus className="w-6 h-6 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">New Project</span>
      </button>
    );
  }

  return (
    <>
      <div
        className="relative rounded-lg border border-border bg-background overflow-hidden group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Thumbnail */}
        <div className={`relative h-[120px] bg-gradient-to-br ${effectiveGradientFrom} ${effectiveGradientTo}`}>

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


          {/* Hover actions */}
          {hovered && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center gap-2">
            <button
              className="p-1.5 rounded-md bg-background border border-border hover:bg-accent"
              title="Open"
              onClick={() => {
                if (id) {
                  navigate(`/app?projectId=${id}`);
                }
              }}
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            {id && (
              <button
                className="p-1.5 rounded-md bg-background border border-border hover:bg-accent"
                title="Members"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMembersModalOpen(true);
                }}
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            )}
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1.5 rounded-md bg-background border border-border hover:bg-accent"
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rename project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Update the name of this project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Project name"
                      autoFocus
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleRename();
                      }}
                      className="bg-black text-white hover:bg-black/90"
                    >
                      {isRenaming ? "Saving..." : "Save"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1.5 rounded-md bg-background border border-border hover:bg-accent"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Share project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Enter the email of the user you want to add to this project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="user@example.com"
                      autoFocus
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleShare();
                      }}
                      className="bg-black text-white hover:bg-black/90"
                    >
                      {isSharing ? "Sharing..." : "Share"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
              {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1.5 rounded-md bg-background border border-border hover:bg-accent text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project and any
                      associated assets.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete();
                      }}
                      className="bg-black text-white hover:bg-black/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">
            {lastModified} 
          </p>
        </div>
      </div>

      {id && (
        <ProjectMembersModal
          projectCreatorId={projectCreatorId ?? ""}
          projectId={id}
          open={isMembersModalOpen}
          onOpenChange={setIsMembersModalOpen}
          canManageMembers={canEdit}
        />
      )}
    </>
  );
};

export default ProjectCard;
