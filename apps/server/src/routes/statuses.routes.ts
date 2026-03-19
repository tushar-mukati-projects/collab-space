import { Router } from "express";
import { requireWorkspace } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { statusIdSchema } from "../schemas/statuses.schema.js";
import { list, update } from "../controllers/statuses.controller.js";

const router = Router();
router.get("/", requireWorkspace, list);
router.patch("/:id", requireWorkspace, validate(statusIdSchema), update);
export default router;
