"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Loader2, Sparkles, Plus, ArrowRight, Users, Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/auth-store";
import { useCreateWorkspace, useFetchInvitations, useJoinWorkspace } from "@/hooks/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceInvitation } from "@/hooks/workspace/useFetchInvitations";

type Tab = "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const [tab, setTab] = React.useState<Tab>("create");
  const [workspaceName, setWorkspaceName] = React.useState("");

  const email = user?.primaryEmailAddress?.emailAddress;
  const firstName = user?.firstName ?? "there";

  const createWorkspaceMutation = useCreateWorkspace();
  const joinWorkspaceMutation = useJoinWorkspace();
  const { data: invitations = [], isLoading: invitationsLoading } = useFetchInvitations(email);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    await createWorkspaceMutation.mutateAsync({ name: workspaceName.trim() });
    completeOnboarding(workspaceName.trim());
    router.replace("/boards");
  };

  const handleJoin = async (invitation: WorkspaceInvitation) => {
    if (!email) return;
    await joinWorkspaceMutation.mutateAsync({ workspaceId: invitation.id, email });
    completeOnboarding(invitation.name);
    router.replace("/boards");
  };

  return (
    <div className="w-full max-w-md px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-12 items-center justify-center rounded-xl text-lg font-bold">
          CS
        </div>
        <h1 className="text-xl font-semibold">Welcome, {firstName}!</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a new workspace or join an existing one
        </p>
      </div>

      {/* Tabs */}
      <div className="border-border mb-6 flex rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "create"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Plus className="size-4" />
          Create workspace
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "join"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="size-4" />
          Join workspace
          {invitations.length > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold">
              {invitations.length}
            </span>
          )}
        </button>
      </div>

      {/* Create workspace tab */}
      {tab === "create" && (
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ws-name">Workspace name</Label>
            <Input
              id="ws-name"
              placeholder="e.g. Acme Corp, My Team"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              autoFocus
            />
            <p className="text-muted-foreground text-xs">
              This is the name your team will see. You can change it later.
            </p>
          </div>

          {/* Plan card */}
          <div className="border-border rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-500">
                <Sparkles className="size-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Pro Plan</span>
                  <Badge className="bg-indigo-500/15 text-[10px] text-indigo-600 dark:text-indigo-400">
                    Default
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  Unlimited boards, tickets, and members
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!workspaceName.trim() || createWorkspaceMutation.isPending}
            className="w-full"
          >
            {createWorkspaceMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create workspace
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Join workspace tab */}
      {tab === "join" && (
        <div className="flex flex-col gap-4">
          {invitationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center py-12 text-center">
              <Building2 className="mb-3 size-10 opacity-30" />
              <p className="text-sm font-medium">No invitations</p>
              <p className="mt-1 text-xs">
                Ask a workspace owner to invite <br />
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                You&apos;ve been invited to the following workspaces:
              </p>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="border-border flex items-center gap-3 rounded-xl border p-4"
                >
                  <Image
                    src={inv.logo}
                    alt={inv.name}
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-lg"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {inv.member_count} member{inv.member_count !== 1 && "s"} &middot;{" "}
                      {inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1)} plan
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoin(inv)}
                    disabled={joinWorkspaceMutation.isPending}
                  >
                    {joinWorkspaceMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    Join
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
