import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Workspace } from "@/types";

interface JoinWorkspaceParams {
  workspaceId: string;
  email: string;
}

export const useJoinWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, email }: JoinWorkspaceParams) => {
      const response = await axiosInstance.post<Workspace>(
        `${API_ROUTES.workspaces}/${workspaceId}/join`,
        { email },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all() });
    },
  });
};
