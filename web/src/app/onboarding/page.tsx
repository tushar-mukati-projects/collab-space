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
    <div className="animate-fade-in w-full max-w-md px-4">
      <div className="mb-8 text-center">
        <div className="bg-primary/20 text-primary mx-auto mb-4 flex size-12 items-center justify-center rounded-xl text-lg font-bold">
          CS
        </div>
        <h1 className="text-xl font-bold tracking-tight">Welcome, {firstName}!</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a new workspace or join an existing one
        </p>
      </div>

      <div className="border-border mb-6 flex rounded-xl border p-1">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
            tab === "create"
              ? "bg-accent text-accent-foreground shadow-sm"
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
            "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
            tab === "join"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="size-4" />
          Join workspace
          {invitations.length > 0 && (
            <span className="bg-primary animate-fade-in-scale absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white">
              {invitations.length}
            </span>
          )}
        </button>
      </div>

      {tab === "create" && (
        <form onSubmit={handleCreate} className="animate-fade-in flex flex-col gap-5">
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

          <div className="border-border hover:border-primary/30 rounded-xl border p-4 transition-all hover:shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Sparkles className="size-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Pro Plan</span>
                  <Badge className="bg-primary/15 text-primary text-[10px]">Default</Badge>
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
                <Loader2 className="text-primary-foreground/60 size-4 animate-spin" />
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

      {tab === "join" && (
        <div className="animate-fade-in flex flex-col gap-4">
          {invitationsLoading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="border-border flex items-center gap-3 rounded-xl border p-4"
                >
                  <div className="skeleton-shimmer bg-muted size-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-shimmer bg-muted h-4 w-32 rounded" />
                    <div className="skeleton-shimmer bg-muted h-3 w-44 rounded" />
                  </div>
                  <div className="skeleton-shimmer bg-muted h-8 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center py-12 text-center">
              <Building2 className="mb-3 size-10 opacity-20" />
              <p className="text-sm font-medium">No invitations</p>
              <p className="mt-1 text-xs opacity-70">
                Ask a workspace owner to invite <br />
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                You&apos;ve been invited to the following workspaces:
              </p>
              {invitations.map((inv, i) => (
                <div
                  key={inv.id}
                  className="border-border hover:border-primary/30 animate-fade-in flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm"
                  style={{ animationDelay: `${i * 80}ms` }}
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
                    <p className="truncate text-sm font-semibold">{inv.name}</p>
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
                      <Loader2 className="text-primary-foreground/60 size-3.5 animate-spin" />
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
