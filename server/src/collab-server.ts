import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { WebSocketServer } from "ws";
import pg from "pg";
import type { Server as HttpServer } from "http";

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
  .catch(console.error);

const hocuspocus = new Hocuspocus({
  quiet: true,
  async onAuthenticate(data: any) {
    const { token } = data;
    if (!token) throw new Error("Authentication required");
    const [userId, workspaceId] = token.split(":");
    if (!userId || !workspaceId) throw new Error("Invalid token");

    const r = await pool.query(
      'SELECT 1 FROM "WorkspaceMember" WHERE user_id = $1 AND workspace_id = $2 LIMIT 1',
      [userId, workspaceId],
    );
    if (r.rowCount === 0) throw new Error("Not a workspace member");
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

export const startCollab = (server: HttpServer) => {
  const wss = new WebSocketServer({ server, path: "/collab" });
  wss.on("connection", (ws, req) => {
    hocuspocus.handleConnection(ws, req);
  });
};
