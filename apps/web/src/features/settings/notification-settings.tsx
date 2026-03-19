"use client";

import * as React from "react";
import { Mail, Smartphone, Loader2, Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFetchNotificationPrefs, useUpdateNotificationPrefs } from "@/hooks/settings";
import { usePushSubscribe } from "@/hooks/notifications";

interface NotificationPref {
  id: string;
  key: string;
  label: string;
  description: string;
}

const notificationTypes: NotificationPref[] = [
  {
    id: "ticket_assigned",
    key: "ticket_assigned",
    label: "Ticket assigned to me",
    description: "Get notified when a ticket is assigned to you.",
  },
  {
    id: "mentioned",
    key: "mentioned",
    label: "Mentioned in comment",
    description: "Get notified when someone mentions you in a comment or document.",
  },
  {
    id: "meeting_starting",
    key: "meeting_starting",
    label: "Meeting starting soon",
    description: "Get a reminder before your scheduled meetings.",
  },
  {
    id: "status_changed",
    key: "status_changed",
    label: "Ticket status changed",
    description: "Get notified when a ticket you are watching changes status.",
  },
];

export const NotificationSettings = () => {
  const { data: prefs, isLoading } = useFetchNotificationPrefs();
  const updatePrefsMutation = useUpdateNotificationPrefs();
  const pushSubscribeMutation = usePushSubscribe();
  const [pushPermission, setPushPermission] = React.useState<NotificationPermission>("default");

  React.useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleEnablePush = async () => {
    await pushSubscribeMutation.mutateAsync();
    setPushPermission(Notification.permission);
    // Also enable push in preferences
    if (!prefs?.push_enabled) {
      updatePrefsMutation.mutate({ push_enabled: true });
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("CollabSpace", {
        body: "Push notifications are working! You'll receive alerts for tickets, mentions, and meetings.",
        icon: "/icon-192.png",
      });
    }
  };

  if (isLoading || !prefs) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const togglePreference = (key: string) => {
    const currentValue = prefs[key as keyof typeof prefs] as boolean;
    updatePrefsMutation.mutate({ [key]: !currentValue });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Notification types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose which notifications you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {notificationTypes.map((pref, i) => (
            <React.Fragment key={pref.id}>
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

      {/* Delivery channels */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Channels</CardTitle>
          <CardDescription>Control how you receive your notifications.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {/* Email */}
          <div
            className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors"
            onClick={() => togglePreference("email_enabled")}
          >
            <div>
              <Checkbox
                checked={prefs.email_enabled}
                onCheckedChange={() => togglePreference("email_enabled")}
              />
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Mail className="size-4" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <Label className="cursor-pointer text-sm font-medium">Email Notifications</Label>
              <span className="text-muted-foreground text-xs">
                Receive notifications to your email address.
              </span>
            </div>
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
          <div
            className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors"
            onClick={() => togglePreference("push_enabled")}
          >
            <div>
              <Checkbox
                checked={prefs.push_enabled}
                onCheckedChange={() => togglePreference("push_enabled")}
              />
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <Smartphone className="size-4" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <Label className="cursor-pointer text-sm font-medium">Push Notifications</Label>
              <span className="text-muted-foreground text-xs">
                Receive browser and desktop push notifications.
              </span>
            </div>
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

      {/* Push notification setup */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Push Notifications</CardTitle>
          <CardDescription>
            Enable browser notifications to get real-time alerts even when this tab is in the
            background.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="bg-muted/50 flex items-center gap-4 rounded-lg p-4">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                pushPermission === "granted"
                  ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : pushPermission === "denied"
                    ? "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                    : "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
              )}
            >
              {pushPermission === "granted" ? (
                <BellRing className="size-5" />
              ) : (
                <Bell className="size-5" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium">
                {pushPermission === "granted"
                  ? "Push notifications are enabled"
                  : pushPermission === "denied"
                    ? "Push notifications are blocked"
                    : "Push notifications are not enabled"}
              </span>
              <span className="text-muted-foreground text-xs">
                {pushPermission === "granted"
                  ? "You'll receive real-time browser notifications for important events."
                  : pushPermission === "denied"
                    ? "Please allow notifications in your browser settings to enable push."
                    : "Click the button to allow browser notifications."}
              </span>
            </div>
            {pushPermission === "granted" ? (
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                Test
              </Button>
            ) : pushPermission !== "denied" ? (
              <Button
                size="sm"
                onClick={handleEnablePush}
                disabled={pushSubscribeMutation.isPending}
              >
                {pushSubscribeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Bell className="size-4" />
                )}
                Enable
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
