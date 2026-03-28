import { http, HttpResponse, delay } from "msw";
import { mockUrl } from "../config";

const ALL_PERMISSIONS = [
  "ticket:view",
  "ticket:create",
  "ticket:edit",
  "ticket:delete",
  "ticket:comment",
  "board:create",
  "board:delete",
  "label:manage",
  "member:invite",
  "member:remove",
  "member:role",
  "billing:manage",
  "settings:manage",
];

const _rolePermissions: Record<string, string[]> = {
  admin: [...ALL_PERMISSIONS],
  member: [
    "ticket:view",
    "ticket:create",
    "ticket:edit",
    "ticket:delete",
    "ticket:comment",
    "board:create",
  ],
};

export const permissionHandlers = [
  http.get(mockUrl("/permissions/available"), async () => {
    await delay(200);
    return HttpResponse.json(ALL_PERMISSIONS);
  }),

  http.get(mockUrl("/permissions"), async () => {
    await delay(200);
    return HttpResponse.json(_rolePermissions);
  }),

  http.put(mockUrl("/permissions/:role"), async ({ params, request }) => {
    await delay(300);
    const role = params.role as string;

    if (role === "admin") {
      return HttpResponse.json({ error: "cannot_modify_admin" }, { status: 400 });
    }

    const { permissions } = (await request.json()) as { permissions: string[] };
    const valid = permissions.filter((p) => ALL_PERMISSIONS.includes(p));
    _rolePermissions[role] = valid;

    return HttpResponse.json({ success: true });
  }),
];
