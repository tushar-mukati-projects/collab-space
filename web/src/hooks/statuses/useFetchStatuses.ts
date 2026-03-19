import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useUIStore } from "@/stores/ui-store";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { StatusDefinition } from "@/types";

export const useFetchStatuses = () => {
  const workspaceReady = useUIStore((s) => s.workspaceReady);

  return useQuery({
    queryKey: QUERY_KEYS.all(),
    queryFn: async () => {
      const response = await axiosInstance.get<StatusDefinition[]>(API_ROUTES.statuses);
      return response.data;
    },
    enabled: workspaceReady,
  });
};
