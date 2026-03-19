"use client";

import * as React from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useFetchProfile, useUpdateProfile } from "@/hooks/settings";

export const ProfileSettings = () => {
  const { data: profile, isLoading } = useFetchProfile();
  const updateProfileMutation = useUpdateProfile();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfileMutation.mutateAsync({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const roleBadgeColor = {
    owner: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    admin: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    member: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    guest: "bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400",
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and how others see you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Avatar display */}
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-16">
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
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            Changes saved successfully
          </span>
        )}
        <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
          <Save className="size-4" />
          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
