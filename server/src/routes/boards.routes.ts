import { Router } from "express";
import { requireWorkspace } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createBoardSchema, getBoardSchema, moveTicketSchema } from "../schemas/boards.schema.js";
import { list, create, getOne, moveTicket } from "../controllers/boards.controller.js";

const router = Router();
router.get("/", requireWorkspace, list);
router.post("/", requireWorkspace, validate(createBoardSchema), create);
router.get("/:id", requireWorkspace, validate(getBoardSchema), getOne);
router.patch("/move-ticket", requireWorkspace, validate(moveTicketSchema), moveTicket);
export default router;
