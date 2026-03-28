import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { WorkspaceInvitation } from "@/types";

export const useFetchInvitations = (email: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.invitations(email ?? ""),
    queryFn: async () => {
      const response = await axiosInstance.get<WorkspaceInvitation[]>(
        `${API_ROUTES.invitations}?email=${encodeURIComponent(email!)}`,
      );
      return response.data;
    },
    enabled: !!email,
  });
};
