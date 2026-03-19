import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Comment } from "@/types";

export const useFetchComments = (ticketId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.comments(ticketId),
    queryFn: async () => {
      const response = await axiosInstance.get<Comment[]>(API_ROUTES.comments(ticketId));
      return response.data;
    },
    enabled: !!ticketId,
  });
};
