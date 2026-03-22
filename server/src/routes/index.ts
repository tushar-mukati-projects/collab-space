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

const router = Router();

router.use("/workspace", workspace);
router.use("/workspaces", workspaces);
router.use("/boards", boards);
router.use("/tickets", tickets);
router.use("/labels", labels);
router.use("/statuses", statuses);
router.use("/users", users);
router.use("/meetings", meetings);
router.use("/notifications", notifications);
router.use("/favorites", favorites);
router.use("/settings", settings);
router.use("/billing", billing);

export { router as routes };
