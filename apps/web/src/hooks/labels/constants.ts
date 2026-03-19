export const API_ROUTES = {
  labels: "/labels",
} as const;

export const QUERY_KEYS = {
  all: () => ["labels"] as const,
};
