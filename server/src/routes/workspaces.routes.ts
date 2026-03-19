import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  createWorkspaceSchema,
  getInvitationsSchema,
  joinWorkspaceSchema,
  inviteToWorkspaceSchema,
} from "../schemas/workspace.schema.js";
import { create, getInvitations, join, invite } from "../controllers/workspaces.controller.js";

const router = Router();
router.post("/", validate(createWorkspaceSchema), create);
router.get("/invitations", validate(getInvitationsSchema), getInvitations);
router.post("/:id/join", validate(joinWorkspaceSchema), join);
router.post("/:id/invite", validate(inviteToWorkspaceSchema), invite);
export default router;
