import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { User } from "@/types";

export const useFetchUser = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<User>(API_ROUTES.user(id));
      return response.data;
    },
    enabled: !!id,
  });
};
