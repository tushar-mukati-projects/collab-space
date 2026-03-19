import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  markNotificationsSchema,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "../schemas/notifications.schema.js";
import { list, markRead, subscribe, unsubscribe } from "../controllers/notifications.controller.js";

const router = Router();
router.get("/", list);
router.patch("/", validate(markNotificationsSchema), markRead);
router.post("/subscribe", validate(pushSubscribeSchema), subscribe);
router.delete("/subscribe", validate(pushUnsubscribeSchema), unsubscribe);
export default router;
