export const API_ROUTES = {
  favorites: "/favorites",
  favorite: (id: string) => `/favorites/${id}`,
} as const;

export const QUERY_KEYS = {
  all: () => ["favorites"] as const,
  list: () => ["favorites", "list"] as const,
};
