export const API_ROUTES = {
  users: "/users",
  user: (id: string) => `/users/${id}`,
} as const;

export const QUERY_KEYS = {
  all: () => ["users"] as const,
  detail: (id: string) => ["users", id] as const,
};
