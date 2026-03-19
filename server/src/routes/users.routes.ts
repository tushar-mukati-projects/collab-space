import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { userIdSchema } from "../schemas/users.schema.js";
import { list, getOne } from "../controllers/users.controller.js";

const router = Router();
router.get("/", list);
router.get("/:id", validate(userIdSchema), getOne);
export default router;
