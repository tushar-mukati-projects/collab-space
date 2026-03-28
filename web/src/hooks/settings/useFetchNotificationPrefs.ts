import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { NotificationPreferences } from "@/types";

export const useFetchNotificationPrefs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(),
    queryFn: async () => {
      const response = await axiosInstance.get<NotificationPreferences>(API_ROUTES.notifications);
      return response.data;
    },
  });
};
