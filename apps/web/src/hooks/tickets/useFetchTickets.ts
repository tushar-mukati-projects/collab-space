import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { TicketSummary } from "@/types";

export const useFetchTickets = () => {
  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: async () => {
      const response = await axiosInstance.get<TicketSummary[]>(API_ROUTES.tickets);
      return response.data;
    },
  });
};
