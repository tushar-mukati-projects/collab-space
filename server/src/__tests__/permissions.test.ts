import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  WORKSPACE_ROLES,
} from "../constants";

describe("Permission constants", () => {
  it("has all expected permissions defined", () => {
    const expected = [
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
    expect(ALL_PERMISSIONS).toEqual(expect.arrayContaining(expected));
    expect(ALL_PERMISSIONS.length).toBe(expected.length);
  });

  it("PERMISSIONS object values match ALL_PERMISSIONS array", () => {
    const values = Object.values(PERMISSIONS);
    expect(values.sort()).toEqual([...ALL_PERMISSIONS].sort());
  });
});

describe("Default role permissions", () => {
  it("admin role has all permissions", () => {
    const adminPerms = DEFAULT_ROLE_PERMISSIONS[WORKSPACE_ROLES.ADMIN];
    expect(adminPerms).toEqual(expect.arrayContaining(ALL_PERMISSIONS));
    expect(adminPerms.length).toBe(ALL_PERMISSIONS.length);
  });

  it("member role has basic ticket permissions", () => {
    const memberPerms = DEFAULT_ROLE_PERMISSIONS[WORKSPACE_ROLES.MEMBER];
    expect(memberPerms).toContain(PERMISSIONS.TICKET_VIEW);
    expect(memberPerms).toContain(PERMISSIONS.TICKET_CREATE);
    expect(memberPerms).toContain(PERMISSIONS.TICKET_EDIT);
    expect(memberPerms).toContain(PERMISSIONS.TICKET_DELETE);
    expect(memberPerms).toContain(PERMISSIONS.TICKET_COMMENT);
    expect(memberPerms).toContain(PERMISSIONS.BOARD_CREATE);
  });

  it("member role does NOT have admin-level permissions", () => {
    const memberPerms = DEFAULT_ROLE_PERMISSIONS[WORKSPACE_ROLES.MEMBER];
    expect(memberPerms).not.toContain(PERMISSIONS.BILLING_MANAGE);
    expect(memberPerms).not.toContain(PERMISSIONS.SETTINGS_MANAGE);
    expect(memberPerms).not.toContain(PERMISSIONS.MEMBER_INVITE);
    expect(memberPerms).not.toContain(PERMISSIONS.MEMBER_REMOVE);
    expect(memberPerms).not.toContain(PERMISSIONS.MEMBER_ROLE);
  });

  it("has exactly 2 roles defined", () => {
    expect(Object.keys(DEFAULT_ROLE_PERMISSIONS)).toHaveLength(2);
    expect(DEFAULT_ROLE_PERMISSIONS).toHaveProperty("admin");
    expect(DEFAULT_ROLE_PERMISSIONS).toHaveProperty("member");
  });
});

describe("WORKSPACE_ROLES", () => {
  it("has admin and member", () => {
    expect(WORKSPACE_ROLES.ADMIN).toBe("admin");
    expect(WORKSPACE_ROLES.MEMBER).toBe("member");
  });
});
