export const WORKSPACE_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[keyof typeof WORKSPACE_ROLES];

export const PERMISSIONS = {
  TICKET_VIEW: "ticket:view",
  TICKET_CREATE: "ticket:create",
  TICKET_EDIT: "ticket:edit",
  TICKET_DELETE: "ticket:delete",
  TICKET_COMMENT: "ticket:comment",
  BOARD_CREATE: "board:create",
  BOARD_DELETE: "board:delete",
  LABEL_MANAGE: "label:manage",
  MEMBER_INVITE: "member:invite",
  MEMBER_REMOVE: "member:remove",
  MEMBER_ROLE: "member:role",
  BILLING_MANAGE: "billing:manage",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [...ALL_PERMISSIONS],
  member: [
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_EDIT,
    PERMISSIONS.TICKET_DELETE,
    PERMISSIONS.TICKET_COMMENT,
    PERMISSIONS.BOARD_CREATE,
  ],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.TICKET_VIEW]: "View tickets",
  [PERMISSIONS.TICKET_CREATE]: "Create tickets",
  [PERMISSIONS.TICKET_EDIT]: "Edit tickets",
  [PERMISSIONS.TICKET_DELETE]: "Delete tickets",
  [PERMISSIONS.TICKET_COMMENT]: "Comment on tickets",
  [PERMISSIONS.BOARD_CREATE]: "Create boards",
  [PERMISSIONS.BOARD_DELETE]: "Delete boards",
  [PERMISSIONS.LABEL_MANAGE]: "Manage labels",
  [PERMISSIONS.MEMBER_INVITE]: "Invite members",
  [PERMISSIONS.MEMBER_REMOVE]: "Remove members",
  [PERMISSIONS.MEMBER_ROLE]: "Change member roles",
  [PERMISSIONS.BILLING_MANAGE]: "Manage billing & plans",
  [PERMISSIONS.SETTINGS_MANAGE]: "Manage workspace settings",
};
