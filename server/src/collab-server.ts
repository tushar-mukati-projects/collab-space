import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { WebSocketServer } from "ws";
import { verifyToken } from "@clerk/backend";
import pg from "pg";

import { logger } from "./logger.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 60_000,
});

pool
  .query(
    `CREATE TABLE IF NOT EXISTS collab_documents (
      name TEXT PRIMARY KEY, data BYTEA NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  )
  .then(() => logger.info("Collab documents table ready"))
  .catch((err) => logger.error("Failed to create collab_documents table", { error: err.message }));

const hocuspocus = new Hocuspocus({
  quiet: true,
  async onAuthenticate(data: any) {
    const { token, documentName } = data;
    if (!token) throw new Error("Authentication required");

    let userId: string;
    try {
      const claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
      userId = claims.sub;
    } catch (err: any) {
      logger.warn("Collab auth failed: invalid token", { error: err?.message });
      throw new Error("Invalid token");
    }
    if (!userId) throw new Error("Invalid token");

    const [kind, ticketId] = String(documentName ?? "").split(":");
    if (kind !== "ticket" || !ticketId) throw new Error("Invalid document");

    const ticket = await pool.query('SELECT workspace_id FROM "Ticket" WHERE id = $1 LIMIT 1', [
      ticketId,
    ]);
    const workspaceId = ticket.rows[0]?.workspace_id;
    if (!workspaceId) {
      logger.warn("Collab auth failed: unknown document", { documentName });
      throw new Error("Document not found");
    }

    const r = await pool.query(
      'SELECT 1 FROM "WorkspaceMember" WHERE user_id = $1 AND workspace_id = $2 LIMIT 1',
      [userId, workspaceId],
    );
    if (r.rowCount === 0) {
      logger.warn("Collab auth failed: not a workspace member", { userId, workspaceId });
      throw new Error("Not a workspace member");
    }
    logger.debug("Collab auth success", { userId, workspaceId });
    return { user: { id: userId, workspaceId } };
  },
  extensions: [
    new Database({
      fetch: async ({ documentName }: any) => {
        const r = await pool.query("SELECT data FROM collab_documents WHERE name = $1", [
          documentName,
        ]);
        return r.rows[0]?.data ?? null;
      },
      store: async ({ documentName, state }: any) => {
        await pool.query(
          `INSERT INTO collab_documents (name, data, updated_at) VALUES ($1, $2, NOW())
           ON CONFLICT (name) DO UPDATE SET data = $2, updated_at = NOW()`,
          [documentName, Buffer.from(state)],
        );
      },
    }),
  ],
});

export const startCollab = () => {
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", (ws, req) => {
    logger.debug("New collab WebSocket connection", { url: req.url });
    hocuspocus.handleConnection(ws, req);
  });
  return wss;
};
