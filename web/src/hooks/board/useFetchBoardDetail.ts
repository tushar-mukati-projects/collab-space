import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { BoardSummary as BoardDetail } from "@/types";

export const useFetchBoardDetail = (boardId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(boardId),
    queryFn: async () => {
      const response = await axiosInstance.get<BoardDetail>(API_ROUTES.board(boardId));
      return response.data;
    },
    enabled: !!boardId,
  });
};
