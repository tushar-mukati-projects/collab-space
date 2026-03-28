import { useFetchWorkspace } from "@/hooks/workspace";

export const usePermission = (...permissions: string[]) => {
  const { data: workspace } = useFetchWorkspace();
  const userPerms = workspace?.current_user_permissions ?? [];
  return permissions.every((p) => userPerms.includes(p));
};

export const useIsAdmin = () => {
  const { data: workspace } = useFetchWorkspace();
  return workspace?.current_user_role === "admin";
};

export const PERMISSION_LABEL: Record<string, string> = {
  "ticket:view": "View tickets",
  "ticket:create": "Create tickets",
  "ticket:edit": "Edit tickets",
  "ticket:delete": "Delete tickets",
  "ticket:comment": "Comment on tickets",
  "board:create": "Create boards",
  "board:delete": "Delete boards",
  "label:manage": "Manage labels",
  "member:invite": "Invite members",
  "member:remove": "Remove members",
  "member:role": "Change member roles",
  "billing:manage": "Manage billing & plans",
  "settings:manage": "Manage workspace settings",
};
