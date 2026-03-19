import type { User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "usr_01",
    name: "Priya Sharma",
    email: "priya@collabspace.io",
    avatar: "https://ui-avatars.com/api/?name=Priya+Sharma&background=6366f1&color=fff",
    role: "owner",
    status: "online",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2026-03-15T08:00:00Z",
  },
  {
    id: "usr_02",
    name: "Marcus Chen",
    email: "marcus@collabspace.io",
    avatar: "https://ui-avatars.com/api/?name=Marcus+Chen&background=0ea5e9&color=fff",
    role: "admin",
    status: "online",
    created_at: "2025-09-15T10:00:00Z",
    updated_at: "2026-03-14T17:00:00Z",
  },
  {
    id: "usr_03",
    name: "Elena Vasquez",
    email: "elena@collabspace.io",
    avatar: "https://ui-avatars.com/api/?name=Elena+Vasquez&background=f43f5e&color=fff",
    role: "member",
    status: "away",
    created_at: "2025-10-01T09:00:00Z",
    updated_at: "2026-03-13T12:00:00Z",
  },
  {
    id: "usr_04",
    name: "Jordan Okafor",
    email: "jordan@collabspace.io",
    avatar: "https://ui-avatars.com/api/?name=Jordan+Okafor&background=10b981&color=fff",
    role: "member",
    status: "offline",
    created_at: "2025-11-10T14:00:00Z",
    updated_at: "2026-03-12T19:00:00Z",
  },
];
