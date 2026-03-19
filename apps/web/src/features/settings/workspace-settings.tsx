"use client";

import * as React from "react";
import { Save, UserPlus, X, Loader2, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useFetchWorkspaceSettings, useUpdateWorkspaceSettings } from "@/hooks/settings";
import { useInviteToWorkspace } from "@/hooks/workspace";

const roleBadgeStyles: Record<string, string> = {
  owner: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  admin: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  member: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  guest: "bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400",
};

const planBadgeStyles: Record<string, string> = {
  free: "bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400",
  pro: "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  enterprise: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const WorkspaceSettings = () => {
  const { data: workspace, isLoading } = useFetchWorkspaceSettings();
  const updateWorkspaceMutation = useUpdateWorkspaceSettings();
  const inviteMutation = useInviteToWorkspace(workspace?.id ?? "");
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [emailError, setEmailError] = React.useState("");

  React.useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name);
    }
  }, [workspace]);

  const handleSave = async () => {
    await updateWorkspaceMutation.mutateAsync({ name: workspaceName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Check if already a member
    if (workspace?.members.some((m) => m.email.toLowerCase() === email)) {
      setEmailError("This person is already a member");
      return;
    }

    // Check if already invited
    if (workspace?.invited_emails.includes(email)) {
      setEmailError("This person has already been invited");
      return;
    }

    setEmailError("");
    await inviteMutation.mutateAsync(email);
    setInviteEmail("");
  };

  const handleInviteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInvite();
    }
  };

  if (isLoading || !workspace) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Manage your workspace name, logo, and plan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-14 rounded-xl after:rounded-xl">
              <AvatarImage src={workspace.logo} alt={workspace.name} />
              <AvatarFallback className="rounded-xl text-lg">
                {workspace.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{workspace.name}</span>
              <span className="text-muted-foreground text-xs">{workspace.slug}</span>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input
                id="ws-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Workspace name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Current Plan</Label>
              <div className="border-input bg-muted/50 flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm">
                <Badge className={planBadgeStyles[workspace.plan] ?? planBadgeStyles.free}>
                  {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage workspace members and their roles.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Invite input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setEmailError("");
                }}
                onKeyDown={handleInviteKeyDown}
                placeholder="Invite by email address..."
                className="flex-1"
                type="email"
              />
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {inviteMutation.isPending ? "Sending..." : "Invite"}
              </Button>
            </div>
            {emailError && <p className="text-destructive text-xs">{emailError}</p>}
          </div>

          {/* Pending invitations */}
          {workspace.invited_emails.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium">
                  <Clock className="size-3" />
                  Pending Invitations ({workspace.invited_emails.length})
                </span>
                {workspace.invited_emails.map((email) => (
                  <div
                    key={email}
                    className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="bg-muted flex size-8 items-center justify-center rounded-full">
                      <Mail className="text-muted-foreground size-3.5" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-muted-foreground text-sm">{email}</span>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          {/* Members list */}
          <div className="flex flex-col gap-1">
            {workspace.members.map((member) => (
              <div
                key={member.id}
                className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
              >
                <Avatar size="sm">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-muted-foreground text-xs">{member.email}</span>
                </div>
                <Badge className={roleBadgeStyles[member.role] ?? roleBadgeStyles.member}>
                  {member.role}
                </Badge>
                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-2">
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            Changes saved successfully
          </span>
        )}
        <Button onClick={handleSave} disabled={updateWorkspaceMutation.isPending}>
          <Save className="size-4" />
          {updateWorkspaceMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
