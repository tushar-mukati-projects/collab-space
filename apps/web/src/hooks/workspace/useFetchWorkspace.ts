import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Workspace } from "@/types";

export const useFetchWorkspace = () => {
  return useQuery({
    queryKey: QUERY_KEYS.all(),
    queryFn: async () => {
      const response = await axiosInstance.get<Workspace>(API_ROUTES.workspace);
      return response.data;
    },
  });
};
