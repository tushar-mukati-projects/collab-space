import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { QUERY_KEYS } from "./constants";
import type { Label, UpdateLabelInput } from "@/types";

interface UpdateLabelParams {
  id: string;
  data: UpdateLabelInput;
}

export const useUpdateLabel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: UpdateLabelParams) => {
      const response = await axiosInstance.patch<Label>(`/labels/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all() });
    },
  });
};
