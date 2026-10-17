"use client";

import * as React from "react";
import { Shield, Loader2, Info, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useFetchWorkspace } from "@/hooks/workspace";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface PermissionDef {
  key: string;
  label: string;
}

const PERMISSION_GROUPS: Record<string, { label: string; keys: string[] }> = {
  tickets: {
    label: "Tickets",
    keys: ["ticket:view", "ticket:create", "ticket:edit", "ticket:delete", "ticket:comment"],
  },
  boards: {
    label: "Boards",
    keys: ["board:create", "board:delete"],
  },
  workspace: {
    label: "Workspace",
    keys: ["label:manage", "settings:manage"],
  },
  members: {
    label: "Members",
    keys: ["member:invite", "member:remove", "member:role"],
  },
  billing: {
    label: "Billing",
    keys: ["billing:manage"],
  },
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 dark:text-indigo-300",
  member: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
};

const DEFAULT_ROLE_STYLE = "bg-zinc-500/15 text-zinc-700 border-zinc-500/30 dark:text-zinc-300";

const PermissionsSkeleton = () => (
  <div className="animate-fade-in flex flex-col gap-6">
    <div className="border-border bg-card space-y-4 rounded-xl border p-6">
      <div className="skeleton-shimmer bg-muted h-5 w-32 rounded" />
      <div className="skeleton-shimmer bg-muted h-3 w-64 rounded" />
      <div className="bg-border h-px" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="skeleton-shimmer bg-muted h-4 w-40 rounded" />
          <div className="flex gap-1.5">
            <div className="skeleton-shimmer bg-muted h-6 w-14 rounded-full" />
            <div className="skeleton-shimmer bg-muted h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PermissionsSettings = () => {
  const queryClient = useQueryClient();
  const { data: workspace, isLoading: wsLoading } = useFetchWorkspace();
  const [saving, setSaving] = React.useState<string | null>(null);

  const { data: available } = useQuery({
    queryKey: ["permissions", "available"],
    queryFn: async () => {
      const res = await axiosInstance.get<PermissionDef[]>("/permissions/available");
      return res.data;
    },
  });

  const { data: rolePerms, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions", "workspace"],
    queryFn: async () => {
      const res = await axiosInstance.get<Record<string, string[]>>("/permissions");
      return res.data;
    },
    enabled: workspace?.current_user_role === "admin",
  });

  const isAdmin = workspace?.current_user_role === "admin";
  const isLoading = wsLoading || permsLoading;

  if (isLoading || !workspace) return <PermissionsSkeleton />;

  if (!isAdmin) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="text-muted-foreground mb-3 size-10" />
            <p className="text-muted-foreground text-sm">
              Only admins can manage role permissions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const labelMap = new Map(available?.map((a) => [a.key, a.label]) ?? []);
  const allRoles = Object.keys(rolePerms ?? {});

  const getRolesForPermission = (permKey: string): string[] => {
    if (!rolePerms) return [];
    return allRoles.filter((role) => rolePerms[role]?.includes(permKey));
  };

  const getMissingRolesForPermission = (permKey: string): string[] => {
    const current = getRolesForPermission(permKey);
    return allRoles.filter((r) => r !== "admin" && !current.includes(r));
  };

  const toggleRolePermission = async (role: string, permKey: string, add: boolean) => {
    if (role === "admin") return;
    const current = rolePerms?.[role] ?? [];
    const next = add ? [...current, permKey] : current.filter((p) => p !== permKey);

    setSaving(permKey);
    try {
      await axiosInstance.put(`/permissions/${role}`, { permissions: next });
      queryClient.setQueryData(
        ["permissions", "workspace"],
        (old: Record<string, string[]> | undefined) => (old ? { ...old, [role]: next } : old),
      );
      toast.success(`${add ? "Granted" : "Revoked"} permission for ${role}`);
    } catch {
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>
            Control what each role can do. Click a role chip to remove it, or use + to grant access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="bg-muted/50 flex items-start gap-2.5 rounded-lg p-3">
            <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <p className="text-muted-foreground text-xs leading-relaxed">
              <Badge
                variant="outline"
                className={cn("mx-0.5 px-1.5 py-0 text-[10px]", ROLE_STYLES.admin)}
              >
                admin
              </Badge>{" "}
              always has full access and cannot be restricted. Other roles can be toggled per
              permission.
            </p>
          </div>

          {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
            <div key={groupKey}>
              <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                {group.label}
              </h4>
              <div className="flex flex-col gap-0.5">
                {group.keys.map((permKey) => {
                  const label = labelMap.get(permKey) ?? permKey;
                  const activeRoles = getRolesForPermission(permKey);
                  const missingRoles = getMissingRolesForPermission(permKey);
                  const isSaving = saving === permKey;

                  return (
                    <div
                      key={permKey}
                      className="hover:bg-muted/50 flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors"
                    >
                      <span className="text-sm">{label}</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {activeRoles.map((role) => {
                          const isAdminRole = role === "admin";
                          return (
                            <Badge
                              key={role}
                              variant="outline"
                              className={cn(
                                "gap-1 px-2 py-0.5 text-[11px] font-medium",
                                ROLE_STYLES[role] ?? DEFAULT_ROLE_STYLE,
                                !isAdminRole && "cursor-pointer",
                                isAdminRole && "opacity-70",
                              )}
                              onClick={() => {
                                if (!isAdminRole && !isSaving) {
                                  toggleRolePermission(role, permKey, false);
                                }
                              }}
                            >
                              {role}
                              {!isAdminRole && <X className="size-3" />}
                            </Badge>
                          );
                        })}

                        {missingRoles.length > 0 && (
                          <Popover>
                            <PopoverTrigger
                              disabled={isSaving}
                              className={cn(
                                "border-border hover:bg-muted flex size-6 items-center justify-center rounded-full border border-dashed transition-colors",
                                isSaving && "opacity-50",
                              )}
                            >
                              {isSaving ? (
                                <Loader2 className="text-muted-foreground size-3 animate-spin" />
                              ) : (
                                <Plus className="text-muted-foreground size-3" />
                              )}
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-auto p-1.5">
                              <div className="flex flex-col gap-0.5">
                                {missingRoles.map((role) => (
                                  <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRolePermission(role, permKey, true)}
                                    className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors"
                                  >
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "px-1.5 py-0 text-[10px]",
                                        ROLE_STYLES[role] ?? DEFAULT_ROLE_STYLE,
                                      )}
                                    >
                                      {role}
                                    </Badge>
                                    <span className="text-muted-foreground text-xs">
                                      Grant access
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
