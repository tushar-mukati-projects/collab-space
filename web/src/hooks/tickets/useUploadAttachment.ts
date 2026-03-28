import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Attachment } from "@/types";

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, file }: { ticketId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post<Attachment>(
        API_ROUTES.attachments(ticketId),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attachments(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities(variables.ticketId) });
    },
  });
};
