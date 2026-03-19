import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createBoardSchema, getBoardSchema, moveTicketSchema } from "../schemas/boards.schema.js";
import { list, create, getOne, moveTicket, remove } from "../controllers/boards.controller.js";

const router = Router();
router.get("/", list);
router.post("/", validate(createBoardSchema), create);
router.get("/:id", validate(getBoardSchema), getOne);
router.patch("/move-ticket", validate(moveTicketSchema), moveTicket);
router.delete("/:id", validate(getBoardSchema), remove);
export default router;
