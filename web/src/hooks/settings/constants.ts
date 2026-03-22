export const API_ROUTES = {
  notifications: "/settings/notifications",
  appearance: "/settings/appearance",
} as const;

export const QUERY_KEYS = {
  notifications: () => ["settings", "notifications"] as const,
  appearance: () => ["settings", "appearance"] as const,
};
