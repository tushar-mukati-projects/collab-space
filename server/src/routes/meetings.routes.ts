import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createMeetingSchema, meetingIdSchema } from "../schemas/meetings.schema.js";
import { list, create, getOne } from "../controllers/meetings.controller.js";

const router = Router();
router.get("/", list);
router.post("/", validate(createMeetingSchema), create);
router.get("/:id", validate(meetingIdSchema), getOne);
export default router;
