import { Router } from "express";
import { getWorkspace } from "../controllers/workspace.controller.js";

const router = Router();
router.get("/", getWorkspace);
export default router;
