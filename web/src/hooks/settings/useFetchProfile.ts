import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { User } from "@/types";

export const useFetchProfile = () => {
  return useQuery({
    queryKey: QUERY_KEYS.profile(),
    queryFn: async () => {
      const response = await axiosInstance.get<User>(API_ROUTES.profile);
      return response.data;
    },
  });
};
