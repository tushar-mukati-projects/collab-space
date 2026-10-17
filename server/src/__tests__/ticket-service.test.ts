jest.mock("../db", () => ({
  prisma: {
    ticket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
    },
    activity: { create: jest.fn(), findMany: jest.fn() },
    comment: { findMany: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn() },
    notification: { create: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
    label: { findMany: jest.fn() },
    notificationPrefs: { findUnique: jest.fn() },
  },
}));

jest.mock("../services/email.service", () => ({
  sendTicketAssignedEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("../logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { prisma } from "../db";
import {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  listComments,
  createComment,
  listActivities,
} from "../services/ticket.service";
import { sendTicketAssignedEmail } from "../services/email.service";

const TICKET_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const CREATED_AT = new Date("2026-01-01");
const UPDATED_AT = new Date("2026-01-01");

const mockTicket = {
  id: TICKET_ID,
  title: "Test ticket",
  description: "A test",
  content: "# Test",
  status: "todo",
  priority: "high",
  assignee_id: null,
  created_by: "user_1",
  parent_id: null,
  parent_type: null,
  due_date: null,
  workspace_id: "ws_1",
  created_at: CREATED_AT,
  updated_at: UPDATED_AT,
  ticketLabels: [{ label_id: "lbl_1" }],
  comments: [{ id: "cmt_1" }],
};

beforeEach(() => jest.clearAllMocks());

describe("listTickets", () => {
  it("returns full serialized ticket summary", async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([mockTicket]);
    (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([]);

    const result = await listTickets("ws_1", {});

    expect(result).toEqual([
      {
        id: TICKET_ID,
        title: "Test ticket",
        status: "todo",
        due_date: null,
        priority: "high",
        assignee: null,
        created_by: "user_1",
        parent_id: null,
        parent_type: null,
        labels: ["lbl_1"],
        sub_ticket_count: 0,
      },
    ]);
  });

  it("applies assignee filter", async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([]);

    await listTickets("ws_1", { assignees: ["user_1"] });

    const call = (prisma.ticket.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where).toEqual({
      workspace_id: "ws_1",
      assignee_id: { in: ["user_1"] },
    });
  });

  it("applies status filter with deserialization", async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([]);

    await listTickets("ws_1", { statuses: ["in-progress"] });

    const call = (prisma.ticket.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.status).toEqual({ in: ["in_progress"] });
  });

  it("applies search term filter", async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([]);

    await listTickets("ws_1", { search_term: "login" });

    const call = (prisma.ticket.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.OR).toEqual([
      { title: { contains: "login", mode: "insensitive" } },
      { description: { contains: "login", mode: "insensitive" } },
    ]);
  });

  it("includes sub-ticket counts", async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([mockTicket]);
    (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([{ parent_id: TICKET_ID, _count: 3 }]);

    const result = await listTickets("ws_1", {});

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: TICKET_ID,
        sub_ticket_count: 3,
      }),
    );
  });
});

describe("getTicket", () => {
  it("returns full ticket response", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([{ id: "sub_1" }]);

    const result = await getTicket(TICKET_ID, "ws_1");

    expect(result).toEqual({
      id: TICKET_ID,
      title: "Test ticket",
      description: "A test",
      content: "# Test",
      status: "todo",
      priority: "high",
      assignee: null,
      created_by: "user_1",
      parent_id: null,
      parent_type: null,
      labels: ["lbl_1"],
      due_date: null,
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      sub_tickets: ["sub_1"],
      comments: ["cmt_1"],
      workspace_id: "ws_1",
    });
  });

  it("returns null for wrong workspace", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

    const result = await getTicket(TICKET_ID, "ws_wrong");

    expect(result).toBeNull();
  });

  it("returns null when ticket not found", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getTicket("nonexistent", "ws_1");

    expect(result).toBeNull();
  });
});

describe("createTicket", () => {
  it("returns full created ticket response", async () => {
    const createdTicket = { ...mockTicket, status: "backlog" };
    (prisma.ticket.create as jest.Mock).mockResolvedValue(createdTicket);
    (prisma.activity.create as jest.Mock).mockResolvedValue({});

    const result = await createTicket({ title: "New ticket" }, "user_1", "ws_1");

    expect(result).toEqual({
      id: TICKET_ID,
      title: "Test ticket",
      description: "A test",
      content: "# Test",
      status: "backlog",
      priority: "high",
      assignee: null,
      created_by: "user_1",
      parent_id: null,
      parent_type: null,
      labels: ["lbl_1"],
      due_date: null,
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      sub_tickets: [],
      comments: ["cmt_1"],
      workspace_id: "ws_1",
    });

    expect(prisma.activity.create).toHaveBeenCalledWith({
      data: {
        type: "ticket_created",
        message: "created this ticket",
        user_id: "user_1",
        ticket_id: TICKET_ID,
      },
    });
  });

  it("creates ticket labels when provided", async () => {
    (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.activity.create as jest.Mock).mockResolvedValue({});
    (prisma.label.findMany as jest.Mock).mockResolvedValue([{ id: "lbl_1" }, { id: "lbl_2" }]);

    await createTicket({ title: "Labeled ticket", labels: ["lbl_1", "lbl_2"] }, "user_1", "ws_1");

    const call = (prisma.ticket.create as jest.Mock).mock.calls[0][0];
    expect(call.data.ticketLabels).toEqual({
      create: [{ label_id: "lbl_1" }, { label_id: "lbl_2" }],
    });
  });
});

describe("updateTicket", () => {
  const existingTicket = {
    ...mockTicket,
    status: "todo",
    assignee_id: null,
  };

  it("returns full updated ticket response", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(existingTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      ...mockTicket,
      status: "in_progress",
    });
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([{ id: "sub_1" }]);

    const result = await updateTicket(TICKET_ID, { status: "in-progress" }, "user_1", "ws_1");

    expect(result).toEqual({
      id: TICKET_ID,
      title: "Test ticket",
      description: "A test",
      content: "# Test",
      status: "in-progress",
      priority: "high",
      assignee: null,
      created_by: "user_1",
      parent_id: null,
      parent_type: null,
      labels: ["lbl_1"],
      due_date: null,
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      sub_tickets: ["sub_1"],
      comments: ["cmt_1"],
      workspace_id: "ws_1",
    });
  });

  it("creates status change activity with full message", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(existingTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue({ ...mockTicket, status: "done" });
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);

    await updateTicket(TICKET_ID, { status: "done" }, "user_1", "ws_1");

    expect(prisma.activity.create).toHaveBeenCalledWith({
      data: {
        type: "ticket_status_changed",
        message: "changed status from todo to done",
        user_id: "user_1",
        ticket_id: TICKET_ID,
      },
    });
  });

  it("sends email and creates notification on assignee change", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(existingTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue({ ...mockTicket, assignee_id: "user_2" });
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue({ user_id: "user_2" });
    (prisma.notificationPrefs.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.id === "user_2")
        return Promise.resolve({ email: "new@test.com", name: "New User" });
      if (where.id === "user_1") return Promise.resolve({ name: "Assigner" });
      return Promise.resolve(null);
    });

    await updateTicket(TICKET_ID, { assignee: "user_2" }, "user_1", "ws_1");

    expect(prisma.activity.create).toHaveBeenCalledWith({
      data: {
        type: "ticket_assigned",
        message: "assigned this ticket",
        user_id: "user_1",
        ticket_id: TICKET_ID,
      },
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        type: "ticket_assigned",
        title: "Ticket Assigned",
        message: 'Assigner assigned you to "Test ticket"',
        link: `/ticket/${TICKET_ID}`,
        actor_id: "user_1",
        user_id: "user_2",
        workspace_id: "ws_1",
      },
    });

    expect(sendTicketAssignedEmail).toHaveBeenCalledWith(
      "new@test.com",
      "New User",
      "Test ticket",
      TICKET_ID,
      "Assigner",
    );
  });

  it("returns null for non-existent ticket", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    expect(await updateTicket("bad_id", { title: "X" }, "user_1", "ws_1")).toBeNull();
  });

  it("returns null for wrong workspace", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(existingTicket);

    expect(await updateTicket(TICKET_ID, { title: "X" }, "user_1", "ws_wrong")).toBeNull();
  });
});

describe("deleteTicket", () => {
  it("deletes existing ticket and its subtree atomically and returns true", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.ticket.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const result = await deleteTicket(TICKET_ID, "ws_1");

    expect(result).toBe(true);
    expect(prisma.ticket.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [TICKET_ID] } } });
  });

  it("returns false for non-existent ticket", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    expect(await deleteTicket("nonexistent", "ws_1")).toBe(false);
  });

  it("returns false for wrong workspace", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

    expect(await deleteTicket(TICKET_ID, "ws_wrong")).toBe(false);
  });
});

describe("listComments", () => {
  const COMMENT_DATE = new Date("2026-03-15T10:00:00Z");

  it("returns full comment response", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ workspace_id: "ws_1" });
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([
      {
        id: "cmt_1",
        content: "Nice work!",
        author_id: "user_2",
        ticket_id: TICKET_ID,
        created_at: COMMENT_DATE,
      },
    ]);

    const result = await listComments(TICKET_ID, "ws_1");

    expect(result).toEqual([
      {
        id: "cmt_1",
        content: "Nice work!",
        author_id: "user_2",
        ticket_id: TICKET_ID,
        created_at: COMMENT_DATE,
      },
    ]);
  });

  it("returns null for wrong workspace", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ workspace_id: "ws_other" });

    expect(await listComments(TICKET_ID, "ws_1")).toBeNull();
  });
});

describe("createComment", () => {
  const COMMENT_DATE = new Date("2026-03-15T10:00:00Z");

  it("returns full created comment and creates activity", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ workspace_id: "ws_1" });
    (prisma.comment.create as jest.Mock).mockResolvedValue({
      id: "cmt_new",
      content: "LGTM",
      author_id: "user_1",
      ticket_id: TICKET_ID,
      created_at: COMMENT_DATE,
    });
    (prisma.activity.create as jest.Mock).mockResolvedValue({});

    const result = await createComment(TICKET_ID, "LGTM", "user_1", "ws_1");

    expect(result).toEqual({
      id: "cmt_new",
      content: "LGTM",
      author_id: "user_1",
      ticket_id: TICKET_ID,
      created_at: COMMENT_DATE,
    });

    expect(prisma.activity.create).toHaveBeenCalledWith({
      data: {
        type: "comment_added",
        message: "added a comment",
        user_id: "user_1",
        ticket_id: TICKET_ID,
      },
    });
  });
});

describe("listActivities", () => {
  const ACTIVITY_DATE = new Date("2026-03-15T10:00:00Z");

  it("returns full activity response", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ workspace_id: "ws_1" });
    ((prisma as any).activity.findMany as jest.Mock).mockResolvedValue([
      {
        id: "act_1",
        type: "ticket_created",
        message: "created this ticket",
        user_id: "user_1",
        ticket_id: TICKET_ID,
        created_at: ACTIVITY_DATE,
      },
    ]);

    const result = await listActivities(TICKET_ID, "ws_1");

    expect(result).toEqual([
      {
        id: "act_1",
        type: "ticket_created",
        message: "created this ticket",
        user_id: "user_1",
        ticket_id: TICKET_ID,
        created_at: ACTIVITY_DATE,
      },
    ]);
  });
});
