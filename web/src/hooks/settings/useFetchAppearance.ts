import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useUIStore } from "@/stores/ui-store";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface AppearancePreferences {
  theme: "light" | "dark" | "system";
  accent_color: string;
  font_size: "compact" | "default" | "comfortable";
}

export const useFetchAppearance = () => {
  const workspaceReady = useUIStore((s) => s.workspaceReady);

  return useQuery({
    queryKey: QUERY_KEYS.appearance(),
    queryFn: async () => {
      const response = await axiosInstance.get<AppearancePreferences>(API_ROUTES.appearance);
      return response.data;
    },
    enabled: workspaceReady,
  });
};
