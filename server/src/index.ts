import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { clerkMiddleware } from "@clerk/express";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { authMiddleware, workspaceMiddleware } from "./middleware/auth.js";
import { routes } from "./routes/index.js";
import { startCollab } from "./collab-server.js";
import { startMeetingSignaling } from "./meeting-signaling.js";
import { webhook as stripeWebhook } from "./controllers/billing.controller.js";
import type { Request, Response, NextFunction } from "express";

const app = express();

app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path !== "/api/health") {
    logger.http(`${req.method} ${req.path}`, { ip: req.ip });
  }
  next();
});

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json());
app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", authMiddleware, workspaceMiddleware, routes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

const server = createServer(app);
const collabWss = startCollab();
startMeetingSignaling(server, config.CLIENT_URL);

server.on("upgrade", (req, socket, head) => {
  if ((req.url ?? "").startsWith("/collab")) {
    collabWss.handleUpgrade(req, socket, head, (ws) => {
      collabWss.emit("connection", ws, req);
    });
  }
});

server.listen(config.PORT, () => {
  logger.info(`Server started on port ${config.PORT}`);
  logger.info(`WebSocket available at /collab`);
  logger.info(`Meeting signaling available at /meeting-socket`);
});
