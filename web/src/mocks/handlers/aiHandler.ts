import { http, HttpResponse } from "msw";
import { _tickets } from "../store";
import { mockUsers } from "../data";
import { mockUrl } from "../config";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const encoder = new TextEncoder();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildReply(lastMessage: string) {
  const total = _tickets.length;
  const done = _tickets.filter((t) => t.status === "done").length;
  const inProgress = _tickets.filter((t) => t.status === "in-progress").length;
  const userMap = new Map(mockUsers.map((u) => [u.id, u.name]));

  if (lastMessage.includes("overdue")) {
    const overdue = _tickets.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done",
    );
    return {
      tools: ["get_overdue_tickets"],
      text:
        overdue.length === 0
          ? "No overdue tickets right now. Your team is on track!"
          : `There are **${overdue.length} overdue tickets**:\n${overdue.map((t) => `- [${t.title}](/ticket/${t.id}) — assigned to ${userMap.get(t.assignee ?? "") ?? "Unassigned"}`).join("\n")}`,
    };
  }

  if (lastMessage.includes("assigned") || lastMessage.includes("most tickets")) {
    const counts: Record<string, number> = {};
    for (const t of _tickets) {
      const name = t.assignee ? (userMap.get(t.assignee) ?? "Unknown") : "Unassigned";
      counts[name] = (counts[name] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      tools: ["get_team_workload"],
      text: `**Ticket distribution:**\n${sorted.map(([name, count]) => `- **${name}**: ${count} tickets`).join("\n")}`,
    };
  }

  if (lastMessage.includes("progress") || lastMessage.includes("summarize")) {
    const progressTickets = _tickets.filter((t) => t.status === "in-progress");
    return {
      tools: ["get_workspace_summary", "get_tickets"],
      text: `**Workspace summary:**\n- **${total}** total tickets\n- **${inProgress}** in progress\n- **${done}** completed\n\n**Currently in progress:**\n${progressTickets.length === 0 ? "None right now." : progressTickets.map((t) => `- [${t.title}](/ticket/${t.id}) → ${userMap.get(t.assignee ?? "") ?? "Unassigned"}`).join("\n")}`,
    };
  }

  if (lastMessage.includes("meeting")) {
    return {
      tools: ["get_meetings"],
      text: "Check the [Meetings](/meetings) page for upcoming meetings. Your team has several scheduled this week.",
    };
  }

  const recent = _tickets.slice(0, 3);
  return {
    tools: ["get_workspace_summary"],
    text: `Here's your workspace overview:\n\n- **${total} tickets** across your boards\n- **${done} completed**, **${inProgress} in progress**\n- **${mockUsers.length} team members**\n\n**Recent tickets:**\n${recent.map((t) => `- [${t.title}](/ticket/${t.id})`).join("\n")}\n\nTry asking about overdue tickets, team workload, or meetings!`,
  };
}

export const aiHandlers = [
  http.post(mockUrl("/ai/chat"), async ({ request }) => {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() ?? "";
    const { tools, text } = buildReply(lastMessage);

    const stream = new ReadableStream({
      async start(controller) {
        for (const tool of tools) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "tool_call", name: tool })}\n\n`),
          );
          await delay(600);
        }

        await delay(300);
        const words = text.split(" ");
        for (let i = 0; i < words.length; i += 2) {
          const chunk = words.slice(i, i + 2).join(" ") + " ";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`),
          );
          await delay(40);
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }),
];
