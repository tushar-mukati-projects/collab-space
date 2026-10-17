import OpenAI from "openai";
import type {
  ChatCompletionTool,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { prisma } from "../db.js";
import { serializeStatus } from "../utils.js";
import { logger } from "../logger.js";
import type { Response } from "express";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_tickets",
      description:
        "Get tickets from the workspace. Can filter by status, priority, or assignee name. Returns up to 20 tickets.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["backlog", "todo", "in_progress", "in_review", "done"],
            description: "Filter by ticket status",
          },
          priority: {
            type: "string",
            enum: ["urgent", "high", "medium", "low", "none"],
            description: "Filter by priority",
          },
          assignee_name: {
            type: "string",
            description: "Filter by assignee name (partial match)",
          },
          search: {
            type: "string",
            description: "Search tickets by title",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overdue_tickets",
      description: "Get all tickets that are past their due date and not yet completed.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_team_workload",
      description: "Get the number of tickets assigned to each team member, broken down by status.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_workspace_summary",
      description:
        "Get a high-level summary of the workspace: total tickets, completion rate, boards, and member count.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_meetings",
      description: "Get upcoming and recent meetings in the workspace.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, string>,
  workspaceId: string,
): Promise<string> {
  switch (name) {
    case "get_tickets": {
      const where: Record<string, unknown> = { workspace_id: workspaceId };
      if (args.status) where.status = args.status;
      if (args.priority) where.priority = args.priority;
      if (args.search) {
        where.title = { contains: args.search, mode: "insensitive" };
      }

      let tickets = await prisma.ticket.findMany({
        where,
        include: {
          ticketLabels: { include: { label: { select: { name: true } } } },
        },
        orderBy: { created_at: "desc" },
        take: 20,
      });

      if (args.assignee_name) {
        const users = await prisma.user.findMany({
          where: {
            name: { contains: args.assignee_name, mode: "insensitive" },
            memberships: { some: { workspace_id: workspaceId } },
          },
          select: { id: true },
        });
        const userIds = new Set(users.map((u) => u.id));
        tickets = tickets.filter((t) => t.assignee_id && userIds.has(t.assignee_id));
      }

      const users = await prisma.user.findMany({
        where: { memberships: { some: { workspace_id: workspaceId } } },
        select: { id: true, name: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u.name]));

      return JSON.stringify(
        tickets.map((t) => ({
          id: t.id,
          title: t.title,
          status: serializeStatus(t.status),
          priority: t.priority,
          assignee: t.assignee_id ? (userMap.get(t.assignee_id) ?? "Unknown") : "Unassigned",
          due_date: t.due_date?.toISOString().split("T")[0] ?? null,
          labels: t.ticketLabels.map((tl) => tl.label.name),
        })),
      );
    }

    case "get_overdue_tickets": {
      const tickets = await prisma.ticket.findMany({
        where: {
          workspace_id: workspaceId,
          due_date: { lt: new Date() },
          status: { not: "done" },
        },
        orderBy: { due_date: "asc" },
      });

      const users = await prisma.user.findMany({
        where: { memberships: { some: { workspace_id: workspaceId } } },
        select: { id: true, name: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u.name]));

      return JSON.stringify(
        tickets.map((t) => ({
          id: t.id,
          title: t.title,
          status: serializeStatus(t.status),
          assignee: t.assignee_id ? (userMap.get(t.assignee_id) ?? "Unknown") : "Unassigned",
          due_date: t.due_date?.toISOString().split("T")[0],
        })),
      );
    }

    case "get_team_workload": {
      const users = await prisma.user.findMany({
        where: { memberships: { some: { workspace_id: workspaceId } } },
        select: { id: true, name: true },
      });

      const tickets = await prisma.ticket.findMany({
        where: { workspace_id: workspaceId },
        select: { assignee_id: true, status: true },
      });

      const workload = users.map((u) => {
        const assigned = tickets.filter((t) => t.assignee_id === u.id);
        return {
          name: u.name,
          total: assigned.length,
          done: assigned.filter((t) => t.status === "done").length,
          in_progress: assigned.filter((t) => t.status === "in_progress").length,
          todo: assigned.filter((t) => t.status === "todo").length,
          backlog: assigned.filter((t) => t.status === "backlog").length,
        };
      });

      return JSON.stringify(workload);
    }

    case "get_workspace_summary": {
      const [ticketCount, doneCount, boardCount, memberCount] = await Promise.all([
        prisma.ticket.count({ where: { workspace_id: workspaceId } }),
        prisma.ticket.count({ where: { workspace_id: workspaceId, status: "done" } }),
        prisma.board.count({ where: { workspace_id: workspaceId } }),
        prisma.workspaceMember.count({ where: { workspace_id: workspaceId } }),
      ]);

      return JSON.stringify({
        total_tickets: ticketCount,
        completed: doneCount,
        completion_rate: ticketCount > 0 ? Math.round((doneCount / ticketCount) * 100) : 0,
        boards: boardCount,
        members: memberCount,
      });
    }

    case "get_meetings": {
      const meetings = await prisma.meeting.findMany({
        where: { workspace_id: workspaceId },
        include: { participants: { select: { user_id: true } } },
        orderBy: { start_time: "desc" },
        take: 10,
      });

      const users = await prisma.user.findMany({
        where: { memberships: { some: { workspace_id: workspaceId } } },
        select: { id: true, name: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u.name]));

      return JSON.stringify(
        meetings.map((m) => ({
          id: m.id,
          title: m.title,
          start_time: m.start_time.toISOString(),
          end_time: m.end_time.toISOString(),
          status: m.status,
          participants: m.participants.map((p) => userMap.get(p.user_id) ?? "Unknown"),
        })),
      );
    }

    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

const SYSTEM_PROMPT = `You are "Ask CollabSpace", an AI assistant for a project management workspace. You help team members understand their workspace — tickets, assignments, deadlines, meetings, and team workload.

Use the available tools to fetch real-time workspace data before answering. Don't guess — always call the appropriate tool first.

When referencing tickets in your response, ALWAYS include a clickable markdown link using the ticket's real UUID from the tool results: [Ticket Title](/ticket/UUID)
When referencing meetings, link to: [Meeting Title](/meetings/MEETING_ID)

Be concise and helpful. Use markdown formatting (bold, lists) for readability.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatStream = async (messages: ChatMessage[], workspaceId: string, res: Response) => {
  if (!process.env.OPENAI_API_KEY) {
    res.write(
      `data: ${JSON.stringify({ type: "text", content: "AI assistant is not configured. Please add an OPENAI_API_KEY." })}\n\n`,
    );
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const controller = new AbortController();
  let aborted = false;
  res.on("close", () => {
    aborted = true;
    controller.abort();
  });

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  try {
    let response = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: chatMessages,
        tools,
        temperature: 0.3,
        max_tokens: 1000,
      },
      { signal: controller.signal },
    );

    let choice = response.choices[0];

    let rounds = 0;
    while (
      !aborted &&
      choice?.finish_reason === "tool_calls" &&
      choice.message.tool_calls &&
      rounds < 3
    ) {
      rounds++;
      chatMessages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        const fn = toolCall as { id: string; function: { name: string; arguments: string } };
        res.write(`data: ${JSON.stringify({ type: "tool_call", name: fn.function.name })}\n\n`);

        const args = JSON.parse(fn.function.arguments || "{}");
        const result = await executeTool(fn.function.name, args, workspaceId);

        chatMessages.push({
          role: "tool",
          tool_call_id: fn.id,
          content: result,
        });
      }

      response = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages: chatMessages,
          tools,
          temperature: 0.3,
          max_tokens: 1000,
        },
        { signal: controller.signal },
      );

      choice = response.choices[0];
    }

    if (!aborted) {
      const answer = choice?.message?.content;
      if (answer) {
        res.write(`data: ${JSON.stringify({ type: "text", content: answer })}\n\n`);
      } else {
        const stream = await openai.chat.completions.create(
          {
            model: "gpt-4o-mini",
            messages: chatMessages,
            temperature: 0.3,
            max_tokens: 1000,
            stream: true,
          },
          { signal: controller.signal },
        );

        let streamed = false;
        for await (const chunk of stream) {
          if (aborted) break;
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            streamed = true;
            res.write(`data: ${JSON.stringify({ type: "text", content: delta })}\n\n`);
          }
        }
        if (!streamed && !aborted) {
          res.write(
            `data: ${JSON.stringify({ type: "text", content: "I couldn't find enough information to answer that." })}\n\n`,
          );
        }
      }
    }
  } catch (err: unknown) {
    if (!aborted) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("AI chat stream failed", { error: message });
      res.write(
        `data: ${JSON.stringify({ type: "text", content: "Sorry, something went wrong. Please try again." })}\n\n`,
      );
    }
  }

  if (!aborted) {
    res.write("data: [DONE]\n\n");
    res.end();
  }
};
