export const API_ROUTES = {
  boards: "/boards",
  board: (id: string) => `/boards/${id}`,
} as const;

export const QUERY_KEYS = {
  all: () => ["boards"] as const,
  detail: (id: string) => ["boards", id] as const,
};
