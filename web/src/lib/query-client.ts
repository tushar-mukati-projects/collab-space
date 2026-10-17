import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry(failureCount, error) {
        if (error instanceof AxiosError) {
          if (!error.response) return failureCount < 2;
          return ![401, 404].includes(error.response.status) && failureCount < 2;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
    },
    mutations: { retry: 0 },
  },
});
