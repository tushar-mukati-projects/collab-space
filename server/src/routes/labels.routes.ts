import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createLabelSchema, labelIdSchema } from "../schemas/labels.schema.js";
import { list, create, update, remove } from "../controllers/labels.controller.js";

const router = Router();
router.get("/", list);
router.post("/", validate(createLabelSchema), create);
router.patch("/:id", validate(labelIdSchema), update);
router.delete("/:id", validate(labelIdSchema), remove);
export default router;
