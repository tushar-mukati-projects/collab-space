import { useQuery } from "@tanstack/react-query";
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

export const useFetchNotificationPrefs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(),
    queryFn: async () => {
      const response = await axiosInstance.get<NotificationPreferences>(API_ROUTES.notifications);
      return response.data;
    },
  });
};
