import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../constants.js";
import {
  createWorkspaceSchema,
  getInvitationsSchema,
  joinWorkspaceSchema,
  inviteToWorkspaceSchema,
  revokeInviteSchema,
  removeMemberSchema,
  changeRoleSchema,
} from "../schemas/workspace.schema.js";
import {
  create,
  getInvitations,
  join,
  invite,
  revokeInvite,
  removeMember,
  changeRole,
} from "../controllers/workspaces.controller.js";

const router = Router();
router.post("/", validate(createWorkspaceSchema), create);
router.get("/invitations", validate(getInvitationsSchema), getInvitations);
router.post("/:id/join", validate(joinWorkspaceSchema), join);
router.post(
  "/:id/invite",
  requirePermission(PERMISSIONS.MEMBER_INVITE),
  validate(inviteToWorkspaceSchema),
  invite,
);
router.post(
  "/:id/revoke-invite",
  requirePermission(PERMISSIONS.MEMBER_INVITE),
  validate(revokeInviteSchema),
  revokeInvite,
);
router.delete(
  "/:id/members/:memberId",
  requirePermission(PERMISSIONS.MEMBER_REMOVE),
  validate(removeMemberSchema),
  removeMember,
);
router.patch(
  "/:id/members/:memberId",
  requirePermission(PERMISSIONS.MEMBER_ROLE),
  validate(changeRoleSchema),
  changeRole,
);
export default router;
