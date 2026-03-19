import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Activity } from "@/types";

export const useFetchActivities = (ticketId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.activities(ticketId),
    queryFn: async () => {
      const response = await axiosInstance.get<Activity[]>(API_ROUTES.activities(ticketId));
      return response.data;
    },
    enabled: !!ticketId,
  });
};
