import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { AppearancePreferences } from "@/types";

export const useUpdateAppearance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AppearancePreferences>) => {
      const response = await axiosInstance.patch<AppearancePreferences>(
        API_ROUTES.appearance,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appearance() });
    },
  });
};
