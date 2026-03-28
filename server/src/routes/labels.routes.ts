import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../constants.js";
import { createLabelSchema, labelIdSchema } from "../schemas/labels.schema.js";
import { list, create, update, remove } from "../controllers/labels.controller.js";

const router = Router();
router.get("/", list);
router.post("/", requirePermission(PERMISSIONS.LABEL_MANAGE), validate(createLabelSchema), create);
router.patch("/:id", requirePermission(PERMISSIONS.LABEL_MANAGE), validate(labelIdSchema), update);
router.delete("/:id", requirePermission(PERMISSIONS.LABEL_MANAGE), validate(labelIdSchema), remove);
export default router;
