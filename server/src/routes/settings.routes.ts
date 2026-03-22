import { Router } from "express";
import {
  getNotificationPrefsHandler,
  updateNotificationPrefsHandler,
  getAppearancePrefsHandler,
  updateAppearancePrefsHandler,
  testEmailHandler,
} from "../controllers/settings.controller.js";

const router = Router();
router.get("/notifications", getNotificationPrefsHandler);
router.patch("/notifications", updateNotificationPrefsHandler);
router.get("/appearance", getAppearancePrefsHandler);
router.patch("/appearance", updateAppearancePrefsHandler);
router.post("/test-email", testEmailHandler);
export default router;
