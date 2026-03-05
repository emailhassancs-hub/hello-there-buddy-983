import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ProjectUserLite {
  id: string;
  name: string;
  email: string;
}

export interface ProjectLite {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator?: ProjectUserLite;
  members?: ProjectUserLite[];
}

export function useProject(projectId?: string | null, enabled: boolean = true) {
  return useQuery<ProjectLite | null>({
    queryKey: ["project", projectId ?? "none"],
    queryFn: async () => {
      if (!projectId) return null;
      return apiFetch<ProjectLite>(`/api/projects/${projectId}`, { method: "GET" });
    },
    enabled: enabled && !!projectId,
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });
}


