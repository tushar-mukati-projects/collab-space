export const API_ROUTES = {
  boards: "/boards",
  board: (id: string) => `/boards/${id}`,
  moveTicket: "/boards/move-ticket",
} as const;

export const QUERY_KEYS = {
  all: () => ["boards"] as const,
  detail: (id: string) => ["boards", id] as const,
};
