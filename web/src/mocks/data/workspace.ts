import type { Workspace } from "@/types";
import { mockUsers } from "./users";

export const mockWorkspace: Workspace = {
  id: "ws_01",
  name: "CollabSpace HQ",
  slug: "collabspace-hq",
  logo: "https://ui-avatars.com/api/?name=CS&background=6366f1&color=fff&bold=true",
  members: mockUsers,
  plan: "free",
  invited_emails: ["newuser@example.com", "jane@acme.io"],
  current_user_role: "admin",
  current_user_permissions: [
    "ticket:view",
    "ticket:create",
    "ticket:edit",
    "ticket:delete",
    "ticket:comment",
    "board:create",
    "board:delete",
    "label:manage",
    "member:invite",
    "member:remove",
    "member:role",
    "billing:manage",
    "settings:manage",
  ],
};
