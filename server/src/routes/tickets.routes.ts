import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  listTicketsSchema,
  createTicketSchema,
  ticketIdSchema,
  updateTicketSchema,
  createCommentSchema,
} from "../schemas/tickets.schema.js";
import {
  list,
  create,
  getOne,
  update,
  remove,
  listComments,
  createComment,
  listActivities,
} from "../controllers/tickets.controller.js";

const router = Router();
router.get("/", validate(listTicketsSchema), list);
router.post("/", validate(createTicketSchema), create);
router.get("/:id", validate(ticketIdSchema), getOne);
router.patch("/:id", validate(updateTicketSchema), update);
router.delete("/:id", validate(ticketIdSchema), remove);
router.get("/:id/comments", validate(ticketIdSchema), listComments);
router.post("/:id/comments", validate(createCommentSchema), createComment);
router.get("/:id/activities", validate(ticketIdSchema), listActivities);
export default router;
