import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface NotificationDto {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsQueryKey = ["notifications"] as const;

export function useNotifications(enabled: boolean = true) {
  return useQuery<NotificationDto[]>({
    queryKey: notificationsQueryKey,
    queryFn: async () => {
      const data = await apiFetch<any>("/notifications", { method: "GET" });
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.notifications)) return data.notifications;
      return [];
    },
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const data = await apiFetch<any>("/notifications/mark-all-read", {
        method: "POST",
      });
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.notifications)) return data.notifications;
      return [];
    },
    onSuccess: (data) => {
      // Prefer server response, but ensure UI reflects read state immediately.
      queryClient.setQueryData<NotificationDto[]>(notificationsQueryKey, () => data);
    },
  });
}


