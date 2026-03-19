import "dotenv/config";
import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import pg from "pg";

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

const port = Number(process.env.COLLAB_PORT ?? 1234);

const server = new Server({
  port,
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

server.listen(port).then(() => console.log(`Hocuspocus running on ws://localhost:${port}`));
