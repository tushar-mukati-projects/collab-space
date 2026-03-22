import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createBoardSchema, getBoardSchema } from "../schemas/boards.schema.js";
import { list, create, getOne, remove } from "../controllers/boards.controller.js";

const router = Router();
router.get("/", list);
router.post("/", validate(createBoardSchema), create);
router.get("/:id", validate(getBoardSchema), getOne);
router.delete("/:id", validate(getBoardSchema), remove);
export default router;
