import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator?: ProjectMember;
  members?: ProjectMember[];
}

export function useProjects(type?: 'my' | 'shared', enabled: boolean = true) {
  return useQuery<Project[]>({
    queryKey: ["projects", type ?? "all"],
    queryFn: () =>
      apiFetch<Project[]>(`/api/projects${type ? `?type=${type}` : ""}`, {
        method: "GET",
      }),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });
}


