export const API_ROUTES = {
  workspace: "/workspace",
  workspaces: "/workspaces",
  invitations: "/workspaces/invitations",
} as const;

export const QUERY_KEYS = {
  all: () => ["workspace"] as const,
  invitations: (email: string) => ["workspace", "invitations", email] as const,
};
