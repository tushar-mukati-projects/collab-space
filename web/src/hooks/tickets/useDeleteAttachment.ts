import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, attachmentId }: { ticketId: string; attachmentId: string }) => {
      await axiosInstance.delete(API_ROUTES.attachment(ticketId, attachmentId));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attachments(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities(variables.ticketId) });
    },
  });
};
