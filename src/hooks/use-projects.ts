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

interface UseProjectsOptions {
  type?: 'my' | 'shared';
  search?: string;
  enabled?: boolean;
}

export function useProjects(options?: UseProjectsOptions) {
  const { type, search, enabled = true } = options || {};

  const queryKey = ["projects", type ?? "all", search ?? ""];

  const queryStringParts: string[] = [];
  if (type) {
    queryStringParts.push(`type=${encodeURIComponent(type)}`);
  }
  if (search && search.trim()) {
    queryStringParts.push(`search=${encodeURIComponent(search.trim())}`);
  }
  const queryString = queryStringParts.length ? `?${queryStringParts.join("&")}` : "";

  return useQuery<Project[]>({
    queryKey,
    queryFn: async () => {
      const res = await apiFetch<Project[] | { projects?: Project[] }>(
        `/api/projects${queryString}`,
        { method: "GET" }
      );
      if (Array.isArray(res)) return res;
      if (res && typeof res === "object" && Array.isArray((res as any).projects)) {
        return (res as any).projects;
      }
      return [];
    },
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });
}

