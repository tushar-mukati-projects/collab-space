import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import { QUERY_KEYS as TICKET_QUERY_KEYS } from "../tickets/constants";
import type { BoardSummary, MoveTicketInput } from "@/types";

export const useMoveTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MoveTicketInput) => {
      const response = await axiosInstance.patch<BoardSummary>(API_ROUTES.moveTicket, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all() });
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.all() });
    },
  });
};
