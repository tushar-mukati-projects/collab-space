import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Comment, CreateCommentInput } from "@/types";

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const response = await axiosInstance.post<Comment>(API_ROUTES.comments(input.ticket_id), {
        content: input.content,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.comments(variables.ticket_id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.activities(variables.ticket_id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.detail(variables.ticket_id),
      });
    },
  });
};
