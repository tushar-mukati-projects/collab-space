import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createWorkspaceSchema,
  getInvitationsSchema,
  joinWorkspaceSchema,
  inviteToWorkspaceSchema,
} from "../schemas/workspace.schema.js";
import { create, getInvitations, join, invite } from "../controllers/workspaces.controller.js";

const router = Router();
router.post("/", requireAuth, validate(createWorkspaceSchema), create);
router.get("/invitations", requireAuth, validate(getInvitationsSchema), getInvitations);
router.post("/:id/join", requireAuth, validate(joinWorkspaceSchema), join);
router.post("/:id/invite", requireAuth, validate(inviteToWorkspaceSchema), invite);
export default router;
