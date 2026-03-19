import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useUIStore } from "@/stores/ui-store";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { Label } from "@/types";

export const useFetchLabels = () => {
  const workspaceReady = useUIStore((s) => s.workspaceReady);

  return useQuery({
    queryKey: QUERY_KEYS.all(),
    queryFn: async () => {
      const response = await axiosInstance.get<Label[]>(API_ROUTES.labels);
      return response.data;
    },
    enabled: workspaceReady,
  });
};
