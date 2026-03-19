import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useUIStore } from "@/stores/ui-store";
import { API_ROUTES, QUERY_KEYS } from "./constants";
import type { TicketSummary, TicketFilters } from "@/types";

export const useTickets = (filters?: TicketFilters) => {
  const workspaceReady = useUIStore((s) => s.workspaceReady);

  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.assignees) filters.assignees.forEach((a) => params.append("assignees", a));
      if (filters?.created_by) filters.created_by.forEach((c) => params.append("created_by", c));
      if (filters?.statuses) filters.statuses.forEach((s) => params.append("statuses", s));
      if (filters?.priorities) filters.priorities.forEach((p) => params.append("priorities", p));
      if (filters?.labels) filters.labels.forEach((l) => params.append("labels", l));
      if (filters?.search_term) params.set("search_term", filters.search_term);
      if (filters?.parent_id) params.set("parent_id", filters.parent_id);
      if (filters?.parent_type)
        filters.parent_type.forEach((pt) => params.append("parent_type", pt));
      const qs = params.toString();
      const response = await axiosInstance.get<TicketSummary[]>(
        qs ? `${API_ROUTES.tickets}?${qs}` : API_ROUTES.tickets,
      );
      return response.data;
    },
    enabled: workspaceReady,
  });
};
