import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Meeting } from "@/types";

export const useFetchMeeting = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<Meeting>(API_ROUTES.meeting(id));
      return response.data;
    },
    enabled: !!id,
  });
};
