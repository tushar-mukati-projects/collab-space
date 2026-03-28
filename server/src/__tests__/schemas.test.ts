import {
  createTicketSchema,
  updateTicketSchema,
  ticketIdSchema,
  listTicketsSchema,
  createCommentSchema,
} from "../schemas/tickets.schema";

describe("createTicketSchema", () => {
  it("accepts valid ticket data", () => {
    const result = createTicketSchema.safeParse({
      body: {
        title: "Fix login bug",
        description: "Users cannot log in with Google",
        status: "todo",
        priority: "high",
      },
    });
    expect(result.success).toBe(true);
  });

  it("requires title", () => {
    const result = createTicketSchema.safeParse({
      body: { title: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing body", () => {
    const result = createTicketSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts minimal data (title only)", () => {
    const result = createTicketSchema.safeParse({
      body: { title: "Minimal ticket" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = createTicketSchema.safeParse({
      body: {
        title: "Full ticket",
        description: "Detailed description",
        content: "# Heading\nBody",
        status: "in-progress",
        priority: "urgent",
        assignee: "user_123",
        labels: ["lbl_1", "lbl_2"],
        due_date: "2026-04-01T00:00:00Z",
        parent_id: "tkt_parent",
        parent_type: "ticket",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null assignee", () => {
    const result = createTicketSchema.safeParse({
      body: { title: "Unassigned ticket", assignee: null },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null due_date", () => {
    const result = createTicketSchema.safeParse({
      body: { title: "No deadline", due_date: null },
    });
    expect(result.success).toBe(true);
  });
});

describe("updateTicketSchema", () => {
  it("accepts partial update with id param", () => {
    const result = updateTicketSchema.safeParse({
      params: { id: "tkt_123" },
      body: { status: "done" },
    });
    expect(result.success).toBe(true);
  });

  it("requires params.id", () => {
    const result = updateTicketSchema.safeParse({
      params: {},
      body: { status: "done" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty body (passthrough)", () => {
    const result = updateTicketSchema.safeParse({
      params: { id: "tkt_123" },
      body: {},
    });
    expect(result.success).toBe(true);
  });

  it("accepts all updatable fields", () => {
    const result = updateTicketSchema.safeParse({
      params: { id: "tkt_123" },
      body: {
        title: "Updated title",
        description: "Updated desc",
        content: "Updated content",
        status: "in-review",
        priority: "medium",
        assignee: "user_456",
        labels: ["lbl_3"],
        due_date: "2026-05-01T00:00:00Z",
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("ticketIdSchema", () => {
  it("accepts valid id", () => {
    const result = ticketIdSchema.safeParse({ params: { id: "tkt_123" } });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = ticketIdSchema.safeParse({ params: {} });
    expect(result.success).toBe(false);
  });
});

describe("listTicketsSchema", () => {
  it("accepts empty query", () => {
    const result = listTicketsSchema.safeParse({ query: {} });
    expect(result.success).toBe(true);
  });

  it("accepts string filter values", () => {
    const result = listTicketsSchema.safeParse({
      query: { assignees: "user_1", statuses: "todo" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts array filter values", () => {
    const result = listTicketsSchema.safeParse({
      query: {
        assignees: ["user_1", "user_2"],
        statuses: ["todo", "in-progress"],
        priorities: ["high", "urgent"],
        labels: ["lbl_1"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts search_term", () => {
    const result = listTicketsSchema.safeParse({
      query: { search_term: "login" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts parent_id filter", () => {
    const result = listTicketsSchema.safeParse({
      query: { parent_id: "board_123", parent_type: "board" },
    });
    expect(result.success).toBe(true);
  });
});

describe("createCommentSchema", () => {
  it("accepts valid comment", () => {
    const result = createCommentSchema.safeParse({
      params: { id: "tkt_123" },
      body: { content: "Looks good!" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = createCommentSchema.safeParse({
      params: { id: "tkt_123" },
      body: { content: "" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional author_id", () => {
    const result = createCommentSchema.safeParse({
      params: { id: "tkt_123" },
      body: { content: "Great work!", author_id: "user_456" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.author_id).toBe("user_456");
    }
  });
});
