import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { clerkMiddleware } from "@clerk/express";
import { config } from "./config.js";
import { routes } from "./routes/index.js";
import { startCollab } from "./collab-server.js";
import type { Request, Response, NextFunction } from "express";

const app = express();

app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
);
app.use("/api", routes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = createServer(app);

// Mount Hocuspocus on the same server at /collab
startCollab(server);

server.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
  console.log(`Collab WebSocket on ws://localhost:${config.PORT}/collab`);
});
