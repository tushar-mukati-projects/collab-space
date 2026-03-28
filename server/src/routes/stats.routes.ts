import { Router } from "express";
import { requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../constants.js";
import { stats } from "../controllers/stats.controller.js";

const router = Router();
router.get("/", requirePermission(PERMISSIONS.TICKET_VIEW), stats);
export default router;
