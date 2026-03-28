import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../constants.js";
import { createBoardSchema, getBoardSchema } from "../schemas/boards.schema.js";
import { list, create, getOne, remove } from "../controllers/boards.controller.js";

const router = Router();
router.get("/", list);
router.post("/", requirePermission(PERMISSIONS.BOARD_CREATE), validate(createBoardSchema), create);
router.get("/:id", validate(getBoardSchema), getOne);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.BOARD_DELETE),
  validate(getBoardSchema),
  remove,
);
export default router;
