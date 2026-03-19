import { Router } from "express";
import { requireWorkspace } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { toggleFavoriteSchema } from "../schemas/favorites.schema.js";
import { list, toggle } from "../controllers/favorites.controller.js";

const router = Router();
router.get("/", requireWorkspace, list);
router.post("/", requireWorkspace, validate(toggleFavoriteSchema), toggle);
export default router;
