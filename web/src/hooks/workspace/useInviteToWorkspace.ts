import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { QUERY_KEYS } from "./constants";
import { toast } from "sonner";

export const useInviteToWorkspace = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const response = await axiosInstance.post(`/workspaces/${workspaceId}/invite`, { email });
      return response.data;
    },
    onSuccess: (_data, email) => {
      toast.success(`Invitation sent to ${email}`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all() });
    },
  });
};
