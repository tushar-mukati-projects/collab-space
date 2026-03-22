import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES } from "./constants";
import type { PortalResponse } from "@/types";

export const useCreatePortal = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post<PortalResponse>(API_ROUTES.portal);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};
