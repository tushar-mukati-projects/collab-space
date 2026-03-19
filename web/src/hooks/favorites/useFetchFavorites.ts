import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useUIStore } from "@/stores/ui-store";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Favorite } from "@/types";

export const useFetchFavorites = () => {
  const workspaceReady = useUIStore((s) => s.workspaceReady);

  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: async () => {
      const response = await axiosInstance.get<Favorite[]>(API_ROUTES.favorites);
      return response.data;
    },
    enabled: workspaceReady,
  });
};
