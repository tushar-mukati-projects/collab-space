import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import { QUERY_KEYS as BOARD_QUERY_KEYS } from "../board/constants";

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  const cleanup = async (id: string) => {
    await queryClient.cancelQueries({ queryKey: QUERY_KEYS.detail(id) });
    await queryClient.cancelQueries({ queryKey: QUERY_KEYS.comments(id) });
    await queryClient.cancelQueries({ queryKey: QUERY_KEYS.activities(id) });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(id) });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.comments(id) });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.activities(id) });
  };

  return useMutation({
    mutationFn: async (id: string) => {
      await cleanup(id);
      const response = await axiosInstance.delete(API_ROUTES.ticket(id));
      return response.data;
    },
    onSuccess: (_data, id) => {
      cleanup(id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.all() });
    },
  });
};
