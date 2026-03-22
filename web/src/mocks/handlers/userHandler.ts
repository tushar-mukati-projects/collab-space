import { http, HttpResponse, delay } from "msw";
import { mockUsers } from "../data";
import { mockUrl } from "../config";
import type { User } from "@/types";

const _users: User[] = structuredClone(mockUsers);

export const userHandlers = [
  http.get(mockUrl("/users/me"), async () => {
    await delay(200);
    const currentUser = _users[0];
    return HttpResponse.json({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
      workspace_id: "ws_01",
      role: currentUser.role,
    });
  }),

  http.get(mockUrl("/users"), async () => {
    await delay(200);
    return HttpResponse.json(_users);
  }),

  http.get(mockUrl("/users/:id"), async ({ params }) => {
    await delay(200);
    const user = _users.find((u) => u.id === params.id);
    if (!user) {
      return HttpResponse.json({ error: "User not found" }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),
];
