import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useUIStore } from "@/stores/ui-store";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { BoardSummary } from "@/types";

export const useFetchBoards = () => {
  const workspaceReady = useUIStore((s) => s.workspaceReady);

  return useQuery({
    queryKey: QUERY_KEYS.all(),
    queryFn: async () => {
      const response = await axiosInstance.get<BoardSummary[]>(API_ROUTES.boards);
      return response.data;
    },
    enabled: workspaceReady,
  });
};
