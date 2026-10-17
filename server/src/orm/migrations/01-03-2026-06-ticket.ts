import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "TicketStatus" AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'done');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "TicketPriority" AS ENUM ('urgent', 'high', 'medium', 'low', 'none');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "TicketParentType" AS ENUM ('board', 'ticket');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Ticket" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      status "TicketStatus" NOT NULL DEFAULT 'backlog',
      priority "TicketPriority" NOT NULL DEFAULT 'none',
      assignee_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
      created_by TEXT NOT NULL REFERENCES "User"(id),
      parent_id TEXT,
      parent_type "TicketParentType",
      due_date TIMESTAMPTZ,
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Ticket_workspace_status_created_idx"
    ON "Ticket"(workspace_id, status, created_at DESC)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Ticket_parent_id_idx" ON "Ticket"(parent_id)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Ticket_assignee_id_idx" ON "Ticket"(assignee_id)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TicketLabel" (
      label_id TEXT NOT NULL REFERENCES "Label"(id) ON DELETE CASCADE,
      ticket_id UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
      PRIMARY KEY (label_id, ticket_id)
    )
  `);

  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS set_ticket_updated_at ON "Ticket"`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER set_ticket_updated_at BEFORE UPDATE ON "Ticket"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `);
};
