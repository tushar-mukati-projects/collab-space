import "../config.js";
import { readdir } from "fs/promises";
import { resolve, basename } from "path";
import { DB_SCHEMA, prisma } from "../db.js";
import { logger } from "../logger.js";

const MIGRATIONS_DIR = resolve(process.cwd(), "src", "orm", "migrations");

const ensureMigrationsTable = async () => {
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA}`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getExecutedMigrations = async (): Promise<Set<string>> => {
  const rows: { name: string }[] = await prisma.$queryRawUnsafe(
    `SELECT name FROM _migrations ORDER BY id`,
  );
  return new Set(rows.map((r) => r.name));
};

const recordMigration = async (name: string) => {
  await ensureMigrationsTable();
  await prisma.$executeRawUnsafe(`INSERT INTO _migrations (name) VALUES ($1)`, name);
};

export const runMigrations = async () => {
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();

  const sortKey = (f: string): [number, number, number, number] => {
    const [dd, mm, yyyy, nn] = f.split("-");
    return [Number(yyyy) || 0, Number(mm) || 0, Number(dd) || 0, Number(nn) || 0];
  };
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
    .sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return ka[i] - kb[i];
      }
      return a.localeCompare(b);
    });

  const pending = files.filter((f) => !executed.has(f));

  if (pending.length === 0) {
    logger.info("No pending migrations");
    return;
  }

  logger.info(`Found ${pending.length} pending migration(s)`);

  for (const file of pending) {
    const name = basename(file);
    logger.info(`Running migration: ${name}`);

    const mod = await import(resolve(MIGRATIONS_DIR, file));

    if (typeof mod.up !== "function") {
      throw new Error(`Migration ${name} does not export an 'up' function`);
    }

    await mod.up(prisma);
    await recordMigration(name);

    logger.info(`Completed: ${name}`);
  }

  logger.info(`All migrations applied`);
};

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Migration failed", { error: err.message, stack: err.stack });
    process.exit(1);
  });
