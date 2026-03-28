import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../constants.js";
import { statusIdSchema } from "../schemas/statuses.schema.js";
import { list, update } from "../controllers/statuses.controller.js";

const router = Router();
router.get("/", list);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  validate(statusIdSchema),
  update,
);
export default router;
