import type { Request, Response, NextFunction } from "express";
import type { Permission } from "../constants";

jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

jest.mock("../db", () => ({
  prisma: {
    workspaceMember: { findFirst: jest.fn() },
  },
}));

jest.mock("../services/permission.service", () => ({
  getPermissionsForRole: jest.fn(),
}));

import { getAuth } from "@clerk/express";
import { prisma } from "../db";
import { getPermissionsForRole } from "../services/permission.service";
import { authMiddleware, workspaceMiddleware, requirePermission } from "../middleware/auth";

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe("authMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls next() when userId is present", () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: "user_123" });
    const req = { path: "/test", ip: "127.0.0.1" } as Request;
    const res = mockRes();

    authMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect((req as any).userId).toBe("user_123");
  });

  it("returns 401 when no userId", () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: null });
    const req = { path: "/test", ip: "127.0.0.1" } as Request;
    const res = mockRes();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe("workspaceMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads workspace and permissions for authenticated user", async () => {
    const perms = new Set(["ticket:view", "ticket:create"]);
    (prisma.workspaceMember.findFirst as jest.Mock).mockResolvedValue({
      workspace_id: "ws_123",
      role: "member",
    });
    (getPermissionsForRole as jest.Mock).mockResolvedValue(perms);

    const req = { userId: "user_123" } as any;
    const res = mockRes();

    await workspaceMiddleware(req, res, mockNext);

    expect(req.workspaceId).toBe("ws_123");
    expect(req.memberRole).toBe("member");
    expect(req.permissions).toBe(perms);
    expect(mockNext).toHaveBeenCalled();
  });

  it("calls next without setting permissions when no membership", async () => {
    (prisma.workspaceMember.findFirst as jest.Mock).mockResolvedValue(null);

    const req = { userId: "user_orphan" } as any;
    const res = mockRes();

    await workspaceMiddleware(req, res, mockNext);

    expect(req.workspaceId).toBeUndefined();
    expect(req.permissions).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it("calls next when userId is missing", async () => {
    const req = {} as any;
    const res = mockRes();

    await workspaceMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe("requirePermission", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls next when user has required permission", () => {
    const middleware = requirePermission("ticket:view" as Permission);
    const req = {
      permissions: new Set(["ticket:view", "ticket:create"]),
    } as any;
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it("returns 403 when user lacks a permission", () => {
    const middleware = requirePermission("billing:manage" as Permission);
    const req = {
      permissions: new Set(["ticket:view"]),
    } as any;
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      required: "billing:manage",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 403 when permissions are undefined", () => {
    const middleware = requirePermission("ticket:view" as Permission);
    const req = {} as any;
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
  });

  it("checks multiple permissions - passes when all present", () => {
    const middleware = requirePermission("ticket:view" as Permission, "ticket:edit" as Permission);
    const req = {
      permissions: new Set(["ticket:view", "ticket:edit", "ticket:create"]),
    } as any;
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it("checks multiple permissions - fails on first missing", () => {
    const middleware = requirePermission(
      "ticket:view" as Permission,
      "billing:manage" as Permission,
    );
    const req = {
      permissions: new Set(["ticket:view"]),
    } as any;
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      required: "billing:manage",
    });
  });
});
