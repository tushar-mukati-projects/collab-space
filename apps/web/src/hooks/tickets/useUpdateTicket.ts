import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import { QUERY_KEYS as BOARD_QUERY_KEYS } from "../board/constants";
import type { Ticket } from "@/types";

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Ticket> }) => {
      const response = await axiosInstance.patch<Ticket>(API_ROUTES.ticket(id), data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the cached detail directly (no refetch)
      queryClient.setQueryData(QUERY_KEYS.detail(variables.id), data);

      // Refresh ticket lists (board columns, my tickets, etc.)
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.list(),
        exact: false,
      });

      // Only refresh boards if status changed (affects ticket_counts)
      if (variables.data.status) {
        queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.all() });
      }
    },
  });
};
