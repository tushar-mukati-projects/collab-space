import { Router } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  markNotificationsSchema,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "../schemas/notifications.schema.js";
import { list, markRead, subscribe, unsubscribe } from "../controllers/notifications.controller.js";

const router = Router();
router.get("/", requireAuth, list);
router.patch("/", requireAuth, validate(markNotificationsSchema), markRead);
router.post("/subscribe", requireWorkspace, validate(pushSubscribeSchema), subscribe);
router.delete("/subscribe", requireWorkspace, validate(pushUnsubscribeSchema), unsubscribe);
export default router;
