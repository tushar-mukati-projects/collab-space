import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Attachment } from "@/types";

export const useFetchAttachments = (ticketId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.attachments(ticketId),
    queryFn: async () => {
      const response = await axiosInstance.get<Attachment[]>(API_ROUTES.attachments(ticketId));
      return response.data;
    },
    enabled: !!ticketId && enabled,
  });
};
