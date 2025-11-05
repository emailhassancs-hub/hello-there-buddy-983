import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export function useUserProfile(enabled: boolean = true) {
  return useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: () => apiFetch<UserProfile>('/user/profile/me', {
      method: 'GET',
    }),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });
}

