export const WORKSPACE_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[keyof typeof WORKSPACE_ROLES];
