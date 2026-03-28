import { prisma } from "../db.js";
import {
  serializeStatus,
  deserializeStatus,
  deserializePriority,
  deserializeParentType,
} from "../utils.js";
import { sendTicketAssignedEmail } from "./email.service.js";
import { logger } from "../logger.js";

export interface TicketListFilters {
  assignees?: string[];
  created_by?: string[];
  statuses?: string[];
  priorities?: string[];
  labels?: string[];
  search_term?: string;
  parent_id?: string;
  parent_type?: string[];
}

export interface CreateTicketData {
  title: string;
  description?: string;
  content?: string;
  status?: string;
  priority?: string;
  assignee?: string | null;
  labels?: string[];
  due_date?: string | null;
  parent_id?: string;
  parent_type?: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  content?: string;
  status?: string;
  priority?: string;
  assignee?: string | null;
  labels?: string[];
  due_date?: string | null;
  parent_id?: string;
  parent_type?: string | null;
}

const serializeTicketFull = (ticket: {
  id: string;
  title: string;
  description: string;
  content: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  created_by: string;
  parent_id: string | null;
  parent_type: string | null;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
  workspace_id: string;
  labels: { id: string }[];
  comments: { id: string }[];
  _subTicketIds?: string[];
}) => {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    content: ticket.content,
    status: serializeStatus(ticket.status),
    priority: ticket.priority,
    assignee: ticket.assignee_id,
    created_by: ticket.created_by,
    parent_id: ticket.parent_id,
    parent_type: ticket.parent_type,
    labels: ticket.labels.map((l) => l.id),
    due_date: ticket.due_date,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    sub_tickets: ticket._subTicketIds ?? [],
    comments: ticket.comments.map((c) => c.id),
    workspace_id: ticket.workspace_id,
  };
};

const fullTicketInclude = {
  labels: { select: { id: true } },
  comments: { select: { id: true } },
} as const;

export const listTickets = async (workspaceId: string, filters: TicketListFilters) => {
  const where: Record<string, unknown> = {
    workspace_id: workspaceId,
  };

  if (filters.assignees && filters.assignees.length > 0) {
    where.assignee_id = { in: filters.assignees };
  }

  if (filters.created_by && filters.created_by.length > 0) {
    where.created_by = { in: filters.created_by };
  }

  if (filters.statuses && filters.statuses.length > 0) {
    where.status = { in: filters.statuses.map(deserializeStatus) };
  }

  if (filters.priorities && filters.priorities.length > 0) {
    where.priority = { in: filters.priorities.map(deserializePriority) };
  }

  if (filters.labels && filters.labels.length > 0) {
    where.labels = { some: { id: { in: filters.labels } } };
  }

  if (filters.search_term) {
    where.OR = [
      { title: { contains: filters.search_term, mode: "insensitive" } },
      { description: { contains: filters.search_term, mode: "insensitive" } },
    ];
  }

  if (filters.parent_id) {
    where.parent_id = filters.parent_id;
  }

  if (filters.parent_type && filters.parent_type.length > 0) {
    where.parent_type = {
      in: filters.parent_type.map(deserializeParentType),
    };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      labels: { select: { id: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const ticketIds = tickets.map((t: any) => t.id);
  const subCounts =
    ticketIds.length > 0
      ? await prisma.ticket.groupBy({
          by: ["parent_id"],
          where: { parent_id: { in: ticketIds }, parent_type: "ticket" },
          _count: true,
        })
      : [];
  const subCountMap = new Map(subCounts.map((s: any) => [s.parent_id, s._count]));

  return tickets.map((t: any) => ({
    id: t.id,
    title: t.title,
    status: serializeStatus(t.status),
    due_date: t.due_date,
    priority: t.priority,
    assignee: t.assignee_id,
    created_by: t.created_by,
    parent_id: t.parent_id,
    parent_type: t.parent_type,
    labels: t.labels.map((l: any) => l.id),
    sub_ticket_count: subCountMap.get(t.id) ?? 0,
  }));
};

export const getTicket = async (id: string, workspaceId: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: fullTicketInclude,
  });

  if (!ticket || ticket.workspace_id !== workspaceId) {
    return null;
  }

  const subTickets = await prisma.ticket.findMany({
    where: { parent_id: id, parent_type: "ticket" },
    select: { id: true },
  });

  return serializeTicketFull({
    ...ticket,
    _subTicketIds: subTickets.map((s: any) => s.id),
  });
};

export const createTicket = async (data: CreateTicketData, userId: string, workspaceId: string) => {
  const resolvedParentId = data.parent_id ?? null;
  const resolvedParentType = data.parent_type ? deserializeParentType(data.parent_type) : null;

  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description ?? "",
      content: data.content ?? "",
      status: data.status ? deserializeStatus(data.status) : undefined,
      priority: data.priority ? deserializePriority(data.priority) : undefined,
      assignee_id: data.assignee ?? null,
      created_by: userId,
      parent_id: resolvedParentId,
      parent_type: resolvedParentType,
      due_date: data.due_date ? new Date(data.due_date) : null,
      workspace_id: workspaceId,
      labels:
        data.labels && data.labels.length > 0
          ? { connect: data.labels.map((id: string) => ({ id })) }
          : undefined,
    },
    include: fullTicketInclude,
  });

  await prisma.activity.create({
    data: {
      type: "ticket_created",
      message: "created this ticket",
      user_id: userId,
      ticket_id: ticket.id,
    },
  });

  return serializeTicketFull({ ...ticket, _subTicketIds: [] });
};

export const updateTicket = async (
  id: string,
  data: UpdateTicketData,
  userId: string,
  workspaceId: string,
) => {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing || existing.workspace_id !== workspaceId) {
    return null;
  }

  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.status !== undefined) updateData.status = deserializeStatus(data.status);
  if (data.priority !== undefined) updateData.priority = deserializePriority(data.priority);
  if (data.assignee !== undefined) updateData.assignee_id = data.assignee;
  if (data.due_date !== undefined)
    updateData.due_date = data.due_date ? new Date(data.due_date) : null;
  if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
  if (data.parent_type !== undefined)
    updateData.parent_type = data.parent_type ? deserializeParentType(data.parent_type) : null;

  if (data.labels !== undefined) {
    updateData.labels = {
      set: data.labels.map((lid: string) => ({ id: lid })),
    };
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: fullTicketInclude,
  });

  if (data.status !== undefined && deserializeStatus(data.status) !== existing.status) {
    await prisma.activity.create({
      data: {
        type: "ticket_status_changed",
        message: `changed status from ${serializeStatus(existing.status)} to ${serializeStatus(ticket.status)}`,
        user_id: userId,
        ticket_id: ticket.id,
      },
    });
  }

  if (
    data.assignee !== undefined &&
    data.assignee !== null &&
    data.assignee !== existing.assignee_id
  ) {
    await prisma.activity.create({
      data: {
        type: "ticket_assigned",
        message: `assigned this ticket`,
        user_id: userId,
        ticket_id: ticket.id,
      },
    });

    const [assignee, actor] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.assignee }, select: { email: true, name: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);

    if (assignee) {
      await prisma.notification.create({
        data: {
          type: "ticket_assigned",
          title: "Ticket Assigned",
          message: `${actor?.name ?? "Someone"} assigned you to "${ticket.title}"`,
          link: `/ticket/${ticket.id}`,
          actor_id: userId,
          user_id: data.assignee,
        },
      });

      sendTicketAssignedEmail(
        assignee.email,
        assignee.name,
        ticket.title,
        ticket.id,
        actor?.name ?? "A teammate",
      ).catch((err) => logger.error("Assign email failed", { error: err.message }));
    }
  }

  const subTickets = await prisma.ticket.findMany({
    where: { parent_id: ticket.id, parent_type: "ticket" },
    select: { id: true },
  });
  return serializeTicketFull({ ...ticket, _subTicketIds: subTickets.map((s: any) => s.id) });
};

export const deleteTicket = async (id: string, workspaceId: string) => {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing || existing.workspace_id !== workspaceId) {
    return false;
  }

  await prisma.ticket.delete({ where: { id } });
  return true;
};

export const listComments = async (ticketId: string, workspaceId: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { workspace_id: true },
  });

  if (!ticket || ticket.workspace_id !== workspaceId) {
    return null;
  }

  const comments = await prisma.comment.findMany({
    where: { ticket_id: ticketId },
    orderBy: { created_at: "asc" },
  });

  return comments.map((c: any) => ({
    id: c.id,
    content: c.content,
    author_id: c.author_id,
    ticket_id: c.ticket_id,
    created_at: c.created_at,
  }));
};

export const createComment = async (
  ticketId: string,
  content: string,
  authorId: string,
  workspaceId: string,
) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { workspace_id: true },
  });

  if (!ticket || ticket.workspace_id !== workspaceId) {
    return null;
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      author_id: authorId,
      ticket_id: ticketId,
    },
  });

  await prisma.activity.create({
    data: {
      type: "comment_added",
      message: "added a comment",
      user_id: authorId,
      ticket_id: ticketId,
    },
  });

  return {
    id: comment.id,
    content: comment.content,
    author_id: comment.author_id,
    ticket_id: comment.ticket_id,
    created_at: comment.created_at,
  };
};

export const listActivities = async (ticketId: string, workspaceId: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { workspace_id: true },
  });

  if (!ticket || ticket.workspace_id !== workspaceId) {
    return null;
  }

  const activities = await prisma.activity.findMany({
    where: { ticket_id: ticketId },
    orderBy: { created_at: "asc" },
  });

  return activities.map((a: any) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    user_id: a.user_id,
    ticket_id: a.ticket_id,
    created_at: a.created_at,
  }));
};
