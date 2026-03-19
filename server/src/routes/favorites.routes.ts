import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { toggleFavoriteSchema } from "../schemas/favorites.schema.js";
import { list, toggle } from "../controllers/favorites.controller.js";

const router = Router();
router.get("/", list);
router.post("/", validate(toggleFavoriteSchema), toggle);
export default router;
