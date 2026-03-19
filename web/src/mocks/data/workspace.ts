import type { Workspace } from "@/types";
import { mockUsers } from "./users";

export const mockWorkspace: Workspace = {
  id: "ws_01",
  name: "CollabSpace HQ",
  slug: "collabspace-hq",
  logo: "https://ui-avatars.com/api/?name=CS&background=6366f1&color=fff&bold=true",
  members: mockUsers,
  plan: "pro",
  invited_emails: ["newuser@example.com", "jane@acme.io"],
};
