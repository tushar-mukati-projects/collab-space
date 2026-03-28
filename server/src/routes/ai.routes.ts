import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { chatSchema } from "../schemas/ai.schema.js";
import { chatHandler } from "../controllers/ai.controller.js";

const router = Router();
router.post("/chat", validate(chatSchema), chatHandler);
export default router;
