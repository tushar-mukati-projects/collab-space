import type { PrismaClient } from "@prisma/client";
import { DB_SCHEMA } from "../../db.js";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = '${DB_SCHEMA}') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ${DB_SCHEMA}."' || r.tablename || '" CASCADE';
      END LOOP;

      FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = '${DB_SCHEMA}'::regnamespace AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ${DB_SCHEMA}."' || r.typname || '" CASCADE';
      END LOOP;

      DROP FUNCTION IF EXISTS ${DB_SCHEMA}.update_updated_at() CASCADE;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
};
