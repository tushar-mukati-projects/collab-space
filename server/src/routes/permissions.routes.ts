import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../constants.js";
import { updatePermissionsSchema } from "../schemas/permissions.schema.js";
import {
  listAvailable,
  listForWorkspace,
  updateForRole,
} from "../controllers/permissions.controller.js";

const router = Router();
router.get("/available", listAvailable);
router.get("/", requirePermission(PERMISSIONS.SETTINGS_MANAGE), listForWorkspace);
router.put(
  "/:role",
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  validate(updatePermissionsSchema),
  updateForRole,
);
export default router;
