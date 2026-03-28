import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../constants.js";
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
router.get("/", requirePermission(PERMISSIONS.TICKET_VIEW), validate(listTicketsSchema), list);
router.post(
  "/",
  requirePermission(PERMISSIONS.TICKET_CREATE),
  validate(createTicketSchema),
  create,
);
router.get("/:id", requirePermission(PERMISSIONS.TICKET_VIEW), validate(ticketIdSchema), getOne);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.TICKET_EDIT),
  validate(updateTicketSchema),
  update,
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.TICKET_DELETE),
  validate(ticketIdSchema),
  remove,
);
router.get(
  "/:id/comments",
  requirePermission(PERMISSIONS.TICKET_VIEW),
  validate(ticketIdSchema),
  listComments,
);
router.post(
  "/:id/comments",
  requirePermission(PERMISSIONS.TICKET_COMMENT),
  validate(createCommentSchema),
  createComment,
);
router.get(
  "/:id/activities",
  requirePermission(PERMISSIONS.TICKET_VIEW),
  validate(ticketIdSchema),
  listActivities,
);
export default router;
