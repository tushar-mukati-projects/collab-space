export const API_ROUTES = {
  notifications: "/notifications",
} as const;

export const QUERY_KEYS = {
  all: () => ["notifications"] as const,
};
