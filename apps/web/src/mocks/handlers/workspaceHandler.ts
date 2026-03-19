import { http, HttpResponse, delay } from "msw";
import { _workspaces } from "../store";
import type { Workspace } from "@/types";

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
};

export const workspaceHandlers = [
  // GET /api/workspace — return the first workspace (current workspace)
  http.get("/api/workspace", async () => {
    await delay(200);
    const workspace = _workspaces[0];
    if (!workspace) {
      return HttpResponse.json({ error: "No workspace" }, { status: 404 });
    }
    return HttpResponse.json(workspace);
  }),

  // POST /api/workspaces — create a new workspace
  http.post("/api/workspaces", async ({ request }) => {
    await delay(400);
    const { name } = (await request.json()) as { name: string };
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const workspace: Workspace = {
      id: generateId("ws"),
      name,
      slug,
      logo: `https://ui-avatars.com/api/?name=${initials}&background=6366f1&color=fff&bold=true`,
      members: [],
      plan: "pro",
      invited_emails: [],
    };
    _workspaces.push(workspace);
    return HttpResponse.json(workspace, { status: 201 });
  }),

  // GET /api/workspaces/invitations?email=... — get workspaces where email is invited
  http.get("/api/workspaces/invitations", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.toLowerCase();
    if (!email) return HttpResponse.json([]);

    const invited = _workspaces.filter((ws) =>
      ws.invited_emails.some((e) => e.toLowerCase() === email),
    );

    // Return minimal info (don't leak member data)
    return HttpResponse.json(
      invited.map((ws) => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        logo: ws.logo,
        plan: ws.plan,
        member_count: ws.members.length,
      })),
    );
  }),

  // POST /api/workspaces/:id/join — join a workspace by invitation
  http.post("/api/workspaces/:id/join", async ({ params, request }) => {
    await delay(400);
    const ws = _workspaces.find((w) => w.id === params.id);
    if (!ws) {
      return HttpResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { email } = (await request.json()) as { email: string };
    const inviteIdx = ws.invited_emails.findIndex((e) => e.toLowerCase() === email.toLowerCase());

    if (inviteIdx === -1) {
      return HttpResponse.json({ error: "No invitation found for this email" }, { status: 403 });
    }

    // Remove from invited, add as member
    ws.invited_emails.splice(inviteIdx, 1);

    return HttpResponse.json(ws);
  }),

  // POST /api/workspaces/:id/invite — invite an email to workspace
  http.post("/api/workspaces/:id/invite", async ({ params, request }) => {
    await delay(300);
    const ws = _workspaces.find((w) => w.id === params.id);
    if (!ws) {
      return HttpResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { email } = (await request.json()) as { email: string };
    if (!ws.invited_emails.includes(email.toLowerCase())) {
      ws.invited_emails.push(email.toLowerCase());
    }

    return HttpResponse.json({ success: true });
  }),
];
