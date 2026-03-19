import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import { QUERY_KEYS as BOARD_QUERY_KEYS } from "../board/constants";

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(API_ROUTES.ticket(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all() });
      queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.all() });
    },
  });
};
