import { Router } from "express";
import { requireWorkspace } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createMeetingSchema, meetingIdSchema } from "../schemas/meetings.schema.js";
import { list, create, getOne } from "../controllers/meetings.controller.js";

const router = Router();
router.get("/", requireWorkspace, list);
router.post("/", requireWorkspace, validate(createMeetingSchema), create);
router.get("/:id", requireWorkspace, validate(meetingIdSchema), getOne);
export default router;
