"use client";

import * as React from "react";
import { Mail, Smartphone, Loader2, Bell, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFetchNotificationPrefs, useUpdateNotificationPrefs } from "@/hooks/settings";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

const notificationTypes = [
  {
    key: "ticket_assigned",
    label: "Ticket assigned to me",
    description: "Get notified when a ticket is assigned to you.",
  },
  {
    key: "mentioned",
    label: "Mentioned in comment",
    description: "Get notified when someone mentions you in a comment or document.",
  },
  {
    key: "meeting_starting",
    label: "Meeting starting soon",
    description: "Get a reminder before your scheduled meetings.",
  },
  {
    key: "status_changed",
    label: "Ticket status changed",
    description: "Get notified when a ticket you are watching changes status.",
  },
];

export const NotificationSettings = () => {
  const { data: prefs, isLoading } = useFetchNotificationPrefs();
  const updatePrefsMutation = useUpdateNotificationPrefs();

  if (isLoading || !prefs) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="skeleton-shimmer h-5 w-36 rounded bg-muted" />
            <div className="skeleton-shimmer h-3 w-56 rounded bg-muted" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="skeleton-shimmer size-4 rounded bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="skeleton-shimmer h-4 w-40 rounded bg-muted" />
                    <div className="skeleton-shimmer h-3 w-64 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const togglePreference = (key: string) => {
    const currentValue = prefs[key as keyof typeof prefs] as boolean;
    updatePrefsMutation.mutate({ [key]: !currentValue }, {
      onSuccess: () => toast.success("Notification preferences updated"),
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Notification types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose which notifications you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {notificationTypes.map((pref, i) => (
            <React.Fragment key={pref.key}>
              <div
                className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition-colors"
                onClick={() => togglePreference(pref.key)}
              >
                <div className="pt-0.5">
                  <Checkbox
                    checked={prefs[pref.key as keyof typeof prefs] as boolean}
                    onCheckedChange={() => togglePreference(pref.key)}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <Label className="cursor-pointer text-sm font-medium">{pref.label}</Label>
                  <span className="text-muted-foreground text-xs">{pref.description}</span>
                </div>
              </div>
              {i < notificationTypes.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      {/* Delivery channels with inline test buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Channels</CardTitle>
          <CardDescription>Control how you receive your notifications.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {/* Email */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-3">
            <div className="cursor-pointer" onClick={() => togglePreference("email_enabled")}>
              <Checkbox
                checked={prefs.email_enabled}
                onCheckedChange={() => togglePreference("email_enabled")}
              />
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Mail className="size-4" />
            </div>
            <div
              className="flex flex-1 cursor-pointer flex-col gap-0.5"
              onClick={() => togglePreference("email_enabled")}
            >
              <Label className="cursor-pointer text-sm font-medium">Email Notifications</Label>
              <span className="text-muted-foreground text-xs">
                Receive notifications to your email address.
              </span>
            </div>
            <TestButton
              type="email"
              label="Test"
              onClick={async () => {
                const res = await axiosInstance.post("/settings/test-email");
                toast.success(`Test email sent to ${res.data.sent_to}`);
              }}
            />
            <span
              className={cn(
                "text-xs font-medium",
                prefs.email_enabled
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {prefs.email_enabled ? "On" : "Off"}
            </span>
          </div>

          <Separator />

          {/* Push */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-3">
            <div className="cursor-pointer" onClick={() => togglePreference("push_enabled")}>
              <Checkbox
                checked={prefs.push_enabled}
                onCheckedChange={() => togglePreference("push_enabled")}
              />
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <Smartphone className="size-4" />
            </div>
            <div
              className="flex flex-1 cursor-pointer flex-col gap-0.5"
              onClick={() => togglePreference("push_enabled")}
            >
              <Label className="cursor-pointer text-sm font-medium">Push Notifications</Label>
              <span className="text-muted-foreground text-xs">
                Receive browser and desktop push notifications.
              </span>
            </div>
            <TestButton
              type="push"
              label="Test"
              onClick={async () => {
                if (!("Notification" in window)) throw new Error("Not supported");
                if (Notification.permission !== "granted") {
                  const perm = await Notification.requestPermission();
                  if (perm !== "granted") throw new Error("Permission denied");
                }
                new Notification("CollabSpace", {
                  body: "Push notifications are working!",
                  icon: "/next.svg",
                });
                toast.success("Push notification sent");
              }}
            />
            <span
              className={cn(
                "text-xs font-medium",
                prefs.push_enabled
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {prefs.push_enabled ? "On" : "Off"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TestButton = ({
  type,
  label,
  onClick,
}: {
  type: string;
  label: string;
  onClick: () => Promise<void>;
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await onClick();
    } catch {
      toast.error(`Failed to test ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="xs" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
      {label}
    </Button>
  );
};
