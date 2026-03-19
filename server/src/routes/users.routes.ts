import { Router } from "express";
import { requireWorkspace } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { userIdSchema } from "../schemas/users.schema.js";
import { list, getOne } from "../controllers/users.controller.js";

const router = Router();
router.get("/", requireWorkspace, list);
router.get("/:id", requireWorkspace, validate(userIdSchema), getOne);
export default router;
