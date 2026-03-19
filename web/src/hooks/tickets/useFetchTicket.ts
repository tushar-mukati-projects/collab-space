import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Ticket } from "@/types";

export const useFetchTicket = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<Ticket>(API_ROUTES.ticket(id));
      return response.data;
    },
    enabled: !!id,
  });
};
