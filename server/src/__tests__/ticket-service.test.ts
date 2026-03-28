jest.mock("../db", () => ({
  prisma: {
    ticket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    activity: { create: jest.fn(), findMany: jest.fn() },
    comment: { findMany: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn() },
    notification: { create: jest.fn() },
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

const mockTicket = {
  id: "tkt_1",
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
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  labels: [{ id: "lbl_1" }],
  comments: [{ id: "cmt_1" }],
};

beforeEach(() => jest.clearAllMocks());

describe("listTickets", () => {
  it("returns serialized ticket summaries", async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([mockTicket]);
    (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([]);

    const result = await listTickets("ws_1", {});

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "tkt_1",
      title: "Test ticket",
      status: "todo",
      priority: "high",
      assignee: null,
      labels: ["lbl_1"],
    });
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspace_id: "ws_1" },
      }),
    );
  });

  it("applies assignee filter", async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([]);

    await listTickets("ws_1", { assignees: ["user_1"] });

    const call = (prisma.ticket.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.assignee_id).toEqual({ in: ["user_1"] });
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
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR).toEqual([
      { title: { contains: "login", mode: "insensitive" } },
      { description: { contains: "login", mode: "insensitive" } },
    ]);
  });

  it("includes sub-ticket counts", async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([mockTicket]);
    (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([
      { parent_id: "tkt_1", _count: 3 },
    ]);

    const result = await listTickets("ws_1", {});

    expect(result[0].sub_ticket_count).toBe(3);
  });
});

describe("getTicket", () => {
  it("returns full ticket with sub-tickets", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([{ id: "sub_1" }]);

    const result = await getTicket("tkt_1", "ws_1");

    expect(result).toBeDefined();
    expect(result!.id).toBe("tkt_1");
    expect(result!.sub_tickets).toEqual(["sub_1"]);
    expect(result!.labels).toEqual(["lbl_1"]);
    expect(result!.comments).toEqual(["cmt_1"]);
  });

  it("returns null for wrong workspace", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

    const result = await getTicket("tkt_1", "ws_wrong");

    expect(result).toBeNull();
  });

  it("returns null when ticket not found", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getTicket("nonexistent", "ws_1");

    expect(result).toBeNull();
  });
});

describe("createTicket", () => {
  it("creates ticket and activity", async () => {
    (prisma.ticket.create as jest.Mock).mockResolvedValue({
      ...mockTicket,
      status: "backlog",
    });
    (prisma.activity.create as jest.Mock).mockResolvedValue({});

    const result = await createTicket(
      { title: "New ticket" },
      "user_1",
      "ws_1",
    );

    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "New ticket",
          created_by: "user_1",
          workspace_id: "ws_1",
        }),
      }),
    );
    expect(prisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "ticket_created",
          message: "created this ticket",
        }),
      }),
    );
    expect(result).toBeDefined();
  });

  it("connects labels when provided", async () => {
    (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.activity.create as jest.Mock).mockResolvedValue({});

    await createTicket(
      { title: "Labeled ticket", labels: ["lbl_1", "lbl_2"] },
      "user_1",
      "ws_1",
    );

    const call = (prisma.ticket.create as jest.Mock).mock.calls[0][0];
    expect(call.data.labels).toEqual({
      connect: [{ id: "lbl_1" }, { id: "lbl_2" }],
    });
  });
});

describe("updateTicket", () => {
  const existingTicket = {
    ...mockTicket,
    status: "todo",
    assignee_id: null,
  };

  it("updates ticket fields", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(existingTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      ...mockTicket,
      status: "in_progress",
    });
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);

    const result = await updateTicket(
      "tkt_1",
      { status: "in-progress" },
      "user_1",
      "ws_1",
    );

    expect(result).toBeDefined();
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "tkt_1" },
        data: expect.objectContaining({ status: "in_progress" }),
      }),
    );
  });

  it("creates status change activity", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(existingTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      ...mockTicket,
      status: "done",
    });
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);

    await updateTicket("tkt_1", { status: "done" }, "user_1", "ws_1");

    expect(prisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "ticket_status_changed",
        }),
      }),
    );
  });

  it("sends email on assignee change", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(existingTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      ...mockTicket,
      assignee_id: "user_2",
    });
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.id === "user_2")
        return Promise.resolve({ email: "new@test.com", name: "New User" });
      if (where.id === "user_1")
        return Promise.resolve({ name: "Assigner" });
      return Promise.resolve(null);
    });

    await updateTicket("tkt_1", { assignee: "user_2" }, "user_1", "ws_1");

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "ticket_assigned",
          user_id: "user_2",
        }),
      }),
    );
    expect(sendTicketAssignedEmail).toHaveBeenCalledWith(
      "new@test.com",
      "New User",
      "Test ticket",
      "tkt_1",
      "Assigner",
    );
  });

  it("returns null for non-existent ticket", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateTicket("bad_id", { title: "X" }, "user_1", "ws_1");

    expect(result).toBeNull();
  });

  it("returns null for wrong workspace", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(existingTicket);

    const result = await updateTicket("tkt_1", { title: "X" }, "user_1", "ws_wrong");

    expect(result).toBeNull();
  });
});

describe("deleteTicket", () => {
  it("deletes existing ticket", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.delete as jest.Mock).mockResolvedValue({});

    const result = await deleteTicket("tkt_1", "ws_1");

    expect(result).toBe(true);
    expect(prisma.ticket.delete).toHaveBeenCalledWith({ where: { id: "tkt_1" } });
  });

  it("returns false for non-existent ticket", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await deleteTicket("nonexistent", "ws_1");

    expect(result).toBe(false);
  });

  it("returns false for wrong workspace", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

    const result = await deleteTicket("tkt_1", "ws_wrong");

    expect(result).toBe(false);
  });
});

describe("listComments", () => {
  it("returns comments for valid ticket", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ workspace_id: "ws_1" });
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([
      {
        id: "cmt_1",
        content: "Nice work!",
        author_id: "user_2",
        ticket_id: "tkt_1",
        created_at: new Date(),
      },
    ]);

    const result = await listComments("tkt_1", "ws_1");

    expect(result).toHaveLength(1);
    expect(result![0].content).toBe("Nice work!");
  });

  it("returns null for wrong workspace", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ workspace_id: "ws_other" });

    const result = await listComments("tkt_1", "ws_1");

    expect(result).toBeNull();
  });
});

describe("createComment", () => {
  it("creates comment and activity", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ workspace_id: "ws_1" });
    (prisma.comment.create as jest.Mock).mockResolvedValue({
      id: "cmt_new",
      content: "LGTM",
      author_id: "user_1",
      ticket_id: "tkt_1",
      created_at: new Date(),
    });
    (prisma.activity.create as jest.Mock).mockResolvedValue({});

    const result = await createComment("tkt_1", "LGTM", "user_1", "ws_1");

    expect(result).toBeDefined();
    expect(result!.content).toBe("LGTM");
    expect(prisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "comment_added",
          message: "added a comment",
        }),
      }),
    );
  });
});

describe("listActivities", () => {
  it("returns activities for valid ticket", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ workspace_id: "ws_1" });
    const mockActivities = [
      {
        id: "act_1",
        type: "ticket_created",
        message: "created this ticket",
        user_id: "user_1",
        ticket_id: "tkt_1",
        created_at: new Date(),
      },
    ];

    ((prisma as any).activity.findMany as jest.Mock).mockResolvedValue(mockActivities);

    const result = await listActivities("tkt_1", "ws_1");

    expect(result).toHaveLength(1);
    expect(result![0].type).toBe("ticket_created");
  });
});
