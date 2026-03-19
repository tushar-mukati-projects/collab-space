export const API_ROUTES = {
  profile: "/settings/profile",
  workspace: "/settings/workspace",
  notifications: "/settings/notifications",
  appearance: "/settings/appearance",
} as const;

export const QUERY_KEYS = {
  profile: () => ["settings", "profile"] as const,
  workspace: () => ["settings", "workspace"] as const,
  notifications: () => ["settings", "notifications"] as const,
  appearance: () => ["settings", "appearance"] as const,
};
