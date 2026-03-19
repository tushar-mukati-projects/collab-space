import { Router } from "express";
import { requireWorkspace } from "../middleware/auth.js";
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
router.get("/", requireWorkspace, validate(listTicketsSchema), list);
router.post("/", requireWorkspace, validate(createTicketSchema), create);
router.get("/:id", requireWorkspace, validate(ticketIdSchema), getOne);
router.patch("/:id", requireWorkspace, validate(updateTicketSchema), update);
router.delete("/:id", requireWorkspace, validate(ticketIdSchema), remove);
router.get("/:id/comments", requireWorkspace, validate(ticketIdSchema), listComments);
router.post("/:id/comments", requireWorkspace, validate(createCommentSchema), createComment);
router.get("/:id/activities", requireWorkspace, validate(ticketIdSchema), listActivities);
export default router;
