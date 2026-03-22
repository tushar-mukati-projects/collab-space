import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { SubscriptionInfo } from "@/types";

export const useFetchSubscription = () => {
  return useQuery({
    queryKey: QUERY_KEYS.subscription(),
    queryFn: async () => {
      const response = await axiosInstance.get<SubscriptionInfo>(API_ROUTES.subscription);
      return response.data;
    },
  });
};
