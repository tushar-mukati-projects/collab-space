import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema, updateWorkspaceSettingsSchema } from "../schemas/settings.schema.js";
import {
  updateProfileHandler,
  updateWorkspaceSettingsHandler,
  getNotificationPrefsHandler,
  updateNotificationPrefsHandler,
  getAppearancePrefsHandler,
  updateAppearancePrefsHandler,
  testEmailHandler,
} from "../controllers/settings.controller.js";

const router = Router();
router.patch("/profile", validate(updateProfileSchema), updateProfileHandler);
router.patch("/workspace", validate(updateWorkspaceSettingsSchema), updateWorkspaceSettingsHandler);
router.get("/notifications", getNotificationPrefsHandler);
router.patch("/notifications", updateNotificationPrefsHandler);
router.get("/appearance", getAppearancePrefsHandler);
router.patch("/appearance", updateAppearancePrefsHandler);
router.post("/test-email", testEmailHandler);
export default router;
