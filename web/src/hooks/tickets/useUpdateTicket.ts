import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import { QUERY_KEYS as BOARD_QUERY_KEYS } from "../board/constants";
import type { Ticket } from "@/types";

interface UpdateTicketParams {
  id: string;
  data: Partial<Ticket>;
}

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: UpdateTicketParams) => {
      const response = await axiosInstance.patch<Ticket>(API_ROUTES.ticket(id), data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(QUERY_KEYS.detail(variables.id), data);

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.list(),
        exact: false,
      });

      if (variables.data.status) {
        queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.all() });
      }
    },
  });
};
