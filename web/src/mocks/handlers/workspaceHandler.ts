import { http, HttpResponse, delay } from "msw";
import { _workspaces } from "../store";
import type { Workspace } from "@/types";

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
};

export const workspaceHandlers = [
  http.get("/api/workspace", async () => {
    await delay(200);
    const workspace = _workspaces[0];
    if (!workspace) {
      return HttpResponse.json({ error: "No workspace" }, { status: 404 });
    }
    return HttpResponse.json(workspace);
  }),

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

  http.get("/api/workspaces/invitations", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.toLowerCase();
    if (!email) return HttpResponse.json([]);

    const invited = _workspaces.filter((ws) =>
      ws.invited_emails.some((e) => e.toLowerCase() === email),
    );

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

    ws.invited_emails.splice(inviteIdx, 1);

    return HttpResponse.json(ws);
  }),

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

  http.post("/api/workspaces/:id/revoke-invite", async ({ params, request }) => {
    await delay(300);
    const ws = _workspaces.find((w) => w.id === params.id);
    if (!ws) {
      return HttpResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { email } = (await request.json()) as { email: string };
    const idx = ws.invited_emails.findIndex((e) => e.toLowerCase() === email.toLowerCase());
    if (idx >= 0) ws.invited_emails.splice(idx, 1);

    return HttpResponse.json({ success: true });
  }),

  http.delete("/api/workspaces/:id/members/:memberId", async ({ params }) => {
    await delay(300);
    const ws = _workspaces.find((w) => w.id === params.id);
    if (!ws) {
      return HttpResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const memberIdx = ws.members.findIndex((m) => m.id === params.memberId);
    if (memberIdx === -1) {
      return HttpResponse.json({ error: "Member not found" }, { status: 404 });
    }

    ws.members.splice(memberIdx, 1);
    return HttpResponse.json({ success: true });
  }),

  http.patch("/api/workspaces/:id/members/:memberId", async ({ params, request }) => {
    await delay(300);
    const ws = _workspaces.find((w) => w.id === params.id);
    if (!ws) {
      return HttpResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const member = ws.members.find((m) => m.id === params.memberId);
    if (!member) {
      return HttpResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { role } = (await request.json()) as { role: "admin" | "member" };
    member.role = role;
    return HttpResponse.json({ success: true });
  }),
];
