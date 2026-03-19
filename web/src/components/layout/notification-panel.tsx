"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFetchNotifications, useUpdateNotifications } from "@/hooks/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const typeInitials: Record<string, string> = {
  ticket_assigned: "TA",
  mentioned: "M",
  meeting_starting: "MS",
  document_shared: "DS",
  status_changed: "SC",
};

const navItemBase =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200";

interface NotificationPanelProps {
  variant?: "icon" | "nav";
}

export const NotificationPanel = ({ variant = "icon" }: NotificationPanelProps) => {
  const router = useRouter();
  const { data: notifications = [] } = useFetchNotifications();
  const updateNotificationsMutation = useUpdateNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = notifications.map((n) => n.id);
    updateNotificationsMutation.mutate({ ids, status: { read: true } });
  };

  const handleClickNotification = (notificationId: string, link: string, isRead: boolean) => {
    if (!isRead) {
      updateNotificationsMutation.mutate({ ids: [notificationId], status: { read: true } });
    }
    // Normalize link: /tickets/tkt_01 → /ticket/tkt_01
    const normalized = link.replace(/^\/tickets\//, "/ticket/");
    router.push(normalized);
  };

  const notificationList = (
    <div className="flex-1 overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-sm">
          <Inbox className="mb-3 size-8 opacity-30" />
          <p className="font-medium">All caught up</p>
          <p className="text-xs opacity-70">No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {notifications.map((notification, i) => (
            <button
              key={notification.id}
              onClick={() =>
                handleClickNotification(notification.id, notification.link, notification.read)
              }
              className={cn(
                "hover:bg-accent/60 flex w-full items-start gap-3 px-3 py-2.5 text-left transition-all animate-fade-in",
                !notification.read && "bg-indigo-500/[0.04]",
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex shrink-0 items-center pt-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    notification.read ? "bg-transparent" : "bg-indigo-500",
                  )}
                />
              </div>
              <Avatar size="sm">
                <AvatarFallback className="text-[10px]">
                  {typeInitials[notification.type] ?? "N"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-xs leading-tight font-medium">
                  {notification.title}
                </p>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                  {notification.message}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const panelContent = (
    <div className="flex h-[min(32rem,80vh)] w-80 flex-col">
      {/* Header */}
      <div className="border-border flex shrink-0 items-center justify-between border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Inbox</h2>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleMarkAllRead}
            disabled={updateNotificationsMutation.isPending}
            className="text-muted-foreground text-xs"
          >
            {updateNotificationsMutation.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Check className="size-3" />
            )}
            Mark all read
          </Button>
        )}
      </div>
      {notificationList}
    </div>
  );

  if (variant === "nav") {
    return (
      <Popover>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                navItemBase,
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            />
          }
        >
          <div className="relative shrink-0">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white animate-fade-in-scale">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span>Inbox</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent side="right" sideOffset={8} align="start" className="w-auto p-0">
          {panelContent}
        </PopoverContent>
      </Popover>
    );
  }

  // icon variant (legacy, kept for any standalone use)
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="relative inline-flex items-center justify-center rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-zinc-200"
          />
        }
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent side="right" sideOffset={8} align="start" className="w-auto p-0">
        {panelContent}
      </PopoverContent>
    </Popover>
  );
};
