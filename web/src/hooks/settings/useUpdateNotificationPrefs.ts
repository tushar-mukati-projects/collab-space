import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface NotificationPreferences {
  ticket_assigned: boolean;
  mentioned: boolean;
  meeting_starting: boolean;
  status_changed: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
}

export const useUpdateNotificationPrefs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const response = await axiosInstance.patch<NotificationPreferences>(
        API_ROUTES.notifications,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications() });
    },
  });
};
