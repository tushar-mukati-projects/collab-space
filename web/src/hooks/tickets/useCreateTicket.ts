import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import { QUERY_KEYS as BOARD_QUERY_KEYS } from "../board/constants";
import type { Ticket, CreateTicketInput } from "@/types";

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTicketInput) => {
      const response = await axiosInstance.post<Ticket>(API_ROUTES.tickets, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all() });
      queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.all() });
    },
  });
};
