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
import { useFetchProfile, useUpdateProfile } from "@/hooks/settings";

const ProfileSkeleton = () => (
  <div className="flex flex-col gap-6 animate-fade-in">
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="skeleton-shimmer size-16 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="skeleton-shimmer h-4 w-28 rounded bg-muted" />
            <div className="skeleton-shimmer h-5 w-16 rounded-full bg-muted" />
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="skeleton-shimmer h-3 w-16 rounded bg-muted" />
            <div className="skeleton-shimmer h-8 w-full rounded-lg bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-shimmer h-3 w-12 rounded bg-muted" />
            <div className="skeleton-shimmer h-8 w-full rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ProfileSettings = () => {
  const { data: profile, isLoading } = useFetchProfile();
  const updateProfileMutation = useUpdateProfile();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({ name, email });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const roleBadgeColor = {
    owner: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    admin: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    member: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    guest: "bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400",
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and how others see you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Avatar display */}
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-16 ring-2 ring-background">
              <AvatarImage src={profile?.avatar} alt={profile?.name ?? "User"} />
              <AvatarFallback className="text-lg">
                {profile?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{profile?.name ?? "User"}</span>
              <Badge className={roleBadgeColor[profile?.role ?? "member"]}>
                {profile?.role ?? "member"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Name input */}
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

            {/* Email input */}
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

          {/* Role display */}
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <div className="border-input bg-muted/50 text-muted-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm capitalize">
              {profile?.role ?? "member"}
            </div>
            <p className="text-muted-foreground text-xs">
              Your role is managed by the workspace owner.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
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
