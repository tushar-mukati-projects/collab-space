import { Router } from "express";
import { requireWorkspace } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createLabelSchema, labelIdSchema } from "../schemas/labels.schema.js";
import { list, create, update, remove } from "../controllers/labels.controller.js";

const router = Router();
router.get("/", requireWorkspace, list);
router.post("/", requireWorkspace, validate(createLabelSchema), create);
router.patch("/:id", requireWorkspace, validate(labelIdSchema), update);
router.delete("/:id", requireWorkspace, validate(labelIdSchema), remove);
export default router;
