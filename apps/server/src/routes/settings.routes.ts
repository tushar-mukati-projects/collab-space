import { Router } from "express";
import { requireWorkspace } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema, updateWorkspaceSettingsSchema } from "../schemas/settings.schema.js";
import {
  getProfileHandler,
  updateProfileHandler,
  getWorkspaceSettingsHandler,
  updateWorkspaceSettingsHandler,
  getNotificationPrefsHandler,
  updateNotificationPrefsHandler,
  getAppearancePrefsHandler,
  updateAppearancePrefsHandler,
} from "../controllers/settings.controller.js";

const router = Router();
router.get("/profile", requireWorkspace, getProfileHandler);
router.patch("/profile", requireWorkspace, validate(updateProfileSchema), updateProfileHandler);
router.get("/workspace", requireWorkspace, getWorkspaceSettingsHandler);
router.patch(
  "/workspace",
  requireWorkspace,
  validate(updateWorkspaceSettingsSchema),
  updateWorkspaceSettingsHandler,
);
router.get("/notifications", requireWorkspace, getNotificationPrefsHandler);
router.patch("/notifications", requireWorkspace, updateNotificationPrefsHandler);
router.get("/appearance", requireWorkspace, getAppearancePrefsHandler);
router.patch("/appearance", requireWorkspace, updateAppearancePrefsHandler);
export default router;
