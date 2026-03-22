import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES } from "./constants";
import type { CheckoutInput, CheckoutResponse } from "@/types";

export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: async (data: CheckoutInput) => {
      const response = await axiosInstance.post<CheckoutResponse>(API_ROUTES.checkout, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};
