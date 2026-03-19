import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getWorkspace } from "../controllers/workspace.controller.js";

const router = Router();
router.get("/", requireAuth, getWorkspace);
export default router;
