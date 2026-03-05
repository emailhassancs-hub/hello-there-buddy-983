import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProjectMember {
  id: string;
  name?: string;
  email?: string;
}

interface ProjectMembersModalProps {
  projectCreatorId: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageMembers?: boolean;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  projectCreatorId,
  projectId,
  open,
  onOpenChange,
  canManageMembers = false,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ProjectMember[]>({
    queryKey: ["project-members", projectId],
    queryFn: () => apiFetch<ProjectMember[]>(`/api/projects/${projectId}/members`, { method: "GET" }),
    enabled: open && !!projectId,
  });

  const members = data ?? [];
  console.log(members, 'here is members==>>>>')

  console.log(projectCreatorId, 'here is projectCreatorId==>>>>')

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiFetch<void>(`/api/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast({
        title: "Member removed",
        description: "The user has been removed from this project.",
      });
    },
    onError: (error: any) => {
      console.error("Failed to remove member:", error);
      toast({
        title: "Remove failed",
        description: error?.message || "Unable to remove this member.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim().length > 0) {
      return name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project members</DialogTitle>
          <DialogDescription>All users associated with this project.</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading members...</p>}
          {isError && !isLoading && (
            <p className="text-sm text-destructive">Failed to load members. Please try again.</p>
          )}
          {!isLoading && !isError && members.length === 0 && (
            <p className="text-sm text-muted-foreground">No members added to this project yet.</p>
          )}
          {!isLoading && !isError && members.length > 0 && (
            <div className="mt-2 max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    {canManageMembers && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {getInitials(member.name, member.email)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {member.name || member.email || "Unknown user"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.email || "—"}
                      </TableCell>
                      {canManageMembers && (
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-black text-white hover:bg-black/90"
                            disabled={removeMutation.isPending || member.id === projectCreatorId}
                            onClick={() => removeMutation.mutate(member.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


