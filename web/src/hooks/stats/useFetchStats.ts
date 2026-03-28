import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { DashboardStats } from "./types";

export const useFetchStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await axiosInstance.get<DashboardStats>("/stats");
      return response.data;
    },
  });
};
