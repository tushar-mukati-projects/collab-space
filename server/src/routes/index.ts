import { Router } from "express";
import workspace from "./workspace.routes.js";
import workspaces from "./workspaces.routes.js";
import boards from "./boards.routes.js";
import tickets from "./tickets.routes.js";
import labels from "./labels.routes.js";
import statuses from "./statuses.routes.js";
import users from "./users.routes.js";
import meetings from "./meetings.routes.js";
import notifications from "./notifications.routes.js";
import favorites from "./favorites.routes.js";
import settings from "./settings.routes.js";
import billing from "./billing.routes.js";
import permissions from "./permissions.routes.js";
import stats from "./stats.routes.js";
import upload from "./upload.routes.js";
import ai from "./ai.routes.js";
import { requireWorkspace } from "../middleware/auth.js";

const router = Router();

router.use("/workspace", workspace);
router.use("/workspaces", workspaces);
router.use("/boards", requireWorkspace, boards);
router.use("/tickets", requireWorkspace, tickets);
router.use("/labels", requireWorkspace, labels);
router.use("/statuses", requireWorkspace, statuses);
router.use("/users", requireWorkspace, users);
router.use("/meetings", requireWorkspace, meetings);
router.use("/notifications", requireWorkspace, notifications);
router.use("/favorites", requireWorkspace, favorites);
router.use("/settings", requireWorkspace, settings);
router.use("/billing", requireWorkspace, billing);
router.use("/permissions", requireWorkspace, permissions);
router.use("/stats", requireWorkspace, stats);
router.use("/upload", requireWorkspace, upload);
router.use("/ai", requireWorkspace, ai);

export { router as routes };
