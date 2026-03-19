import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { statusIdSchema } from "../schemas/statuses.schema.js";
import { list, update } from "../controllers/statuses.controller.js";

const router = Router();
router.get("/", list);
router.patch("/:id", validate(statusIdSchema), update);
export default router;
