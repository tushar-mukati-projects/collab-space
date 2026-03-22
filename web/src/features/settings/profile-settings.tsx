"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAppGate } from "@/lib/app-gate";

const roleBadgeColor: Record<string, string> = {
  admin: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  member: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
};

export const ProfileSettings = () => {
  const { user } = useAppGate();

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal details and role in this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="ring-background size-16 ring-2">
              <AvatarImage src={user?.avatar} alt={user?.name ?? "User"} />
              <AvatarFallback className="text-lg">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{user?.name ?? "User"}</span>
              <Badge className={roleBadgeColor[user?.role ?? "member"]}>
                {user?.role ?? "member"}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Full Name</Label>
              <div className="border-input bg-muted/50 text-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm">
                {user?.name ?? "—"}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <div className="border-input bg-muted/50 text-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm">
                {user?.email ?? "—"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <div className="border-input bg-muted/50 text-muted-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm capitalize">
              {user?.role ?? "member"}
            </div>
            <p className="text-muted-foreground text-xs">
              Your role is managed by workspace admins.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
