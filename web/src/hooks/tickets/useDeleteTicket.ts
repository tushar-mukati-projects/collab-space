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
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.comments(id) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.activities(id) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.attachments(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.all() });
    },
  });
};
