"use client";

import * as React from "react";
import { Save, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAppGate } from "@/lib/app-gate";
import { useUpdateProfile } from "@/hooks/settings";

const roleBadgeColor: Record<string, string> = {
  admin: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  member: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
};

export const ProfileSettings = () => {
  const { user } = useAppGate();
  const updateProfileMutation = useUpdateProfile();

  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({ name, email });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and how others see you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-16 ring-2 ring-background">
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
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
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

      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : updateProfileMutation.isSuccess ? (
            <Check className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
