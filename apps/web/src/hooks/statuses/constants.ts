export const API_ROUTES = {
  statuses: "/statuses",
  status: (id: string) => `/statuses/${id}`,
} as const;

export const QUERY_KEYS = {
  all: () => ["statuses"] as const,
};
