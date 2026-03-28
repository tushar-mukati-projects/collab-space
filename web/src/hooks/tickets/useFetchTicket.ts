import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Ticket } from "@/types";

export const useFetchTicket = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<Ticket>(API_ROUTES.ticket(id));
      return response.data;
    },
    enabled: !!id && enabled,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });
};
