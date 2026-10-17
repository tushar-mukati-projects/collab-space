import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

export const DB_SCHEMA = "collab_space";

export const createPool = (config: pg.PoolConfig) => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ...config });
  pool.on("connect", (client) => client.query(`SET search_path TO ${DB_SCHEMA}`));
  return pool;
};

const pool = createPool({
  max: 10,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 10_000,
});

const adapter = new PrismaPg(pool as any, { schema: DB_SCHEMA });
export const prisma = new PrismaClient({ adapter });
