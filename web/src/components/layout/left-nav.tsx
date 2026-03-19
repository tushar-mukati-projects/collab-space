"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useUIStore } from "@/stores/ui-store";
import { useOnboardingStore } from "@/stores/auth-store";
import { useFetchWorkspace } from "@/hooks/workspace";
import { useTickets } from "@/hooks/tickets";
import { useFetchFavorites } from "@/hooks/favorites";
import { cn } from "@/lib/utils";
import { Search, Settings, LogOut, LayoutGrid, Video, Ticket, Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { NotificationPanel } from "@/components/layout/notification-panel";

const navLinks = [
  { label: "Board", href: "/boards", icon: LayoutGrid },
  { label: "Meetings", href: "/meetings", icon: Video },
];

const navItemBase =
  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors";

const statusDot: Record<string, string> = {
  backlog: "bg-gray-400",
  todo: "bg-blue-400",
  "in-progress": "bg-yellow-400",
  "in-review": "bg-purple-400",
  done: "bg-green-500",
};

interface LeftNavProps {
  onClose?: () => void;
}

export const LeftNav = ({ onClose }: LeftNavProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);
  const { data: workspace } = useFetchWorkspace();
  const currentUserId = clerkUser?.id;
  const myTicketFilters = React.useMemo(
    () => (currentUserId ? { assignees: [currentUserId] } : undefined),
    [currentUserId],
  );
  const { data: myTickets = [] } = useTickets(myTicketFilters);
  const { data: favorites = [] } = useFetchFavorites();

  const wsInitials =
    workspace?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) ?? "CS";
  const currentUserName = clerkUser?.fullName ?? clerkUser?.firstName ?? "User";
  const currentUserEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  const currentUserAvatar = clerkUser?.imageUrl;
  const initials = currentUserName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      {/* Workspace header */}
      <div className="shrink-0 px-3 pt-4 pb-3">
        <Link
          href="/boards"
          onClick={onClose}
          className="hover:bg-accent/60 flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/20 text-xs font-semibold text-indigo-400">
            {wsInitials}
          </span>
          <span className="truncate text-sm font-semibold">{workspace?.name ?? "CollabSpace"}</span>
        </Link>
      </div>

      {/* Scrollable middle section */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-2">
        {/* Search + Inbox + My Tickets */}
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              toggleCommandPalette();
              onClose?.();
            }}
            className={cn(
              navItemBase,
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Search className="size-4 shrink-0" />
            <span>Search</span>
            <kbd className="border-border bg-muted text-muted-foreground pointer-events-none ml-auto hidden items-center rounded border px-1.5 font-mono text-[10px] sm:inline-flex">
              ⌘K
            </kbd>
          </button>

          <NotificationPanel variant="nav" />

          {/* My Tickets panel */}
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
              <Ticket className="size-4 shrink-0" />
              <span>My Tickets</span>
              {myTickets.length > 0 && (
                <span className="bg-muted text-muted-foreground ml-auto rounded-full px-1.5 py-0 text-[10px] font-semibold">
                  {myTickets.length}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent side="right" sideOffset={8} align="start" className="w-auto p-0">
              <div className="flex h-[min(32rem,80vh)] w-72 flex-col">
                <div className="border-border flex shrink-0 items-center border-b px-3 py-2">
                  <h2 className="text-sm font-semibold">My Tickets</h2>
                  {myTickets.length > 0 && (
                    <span className="bg-muted text-muted-foreground ml-2 rounded-full px-1.5 py-0 text-[10px] font-semibold">
                      {myTickets.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {myTickets.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-sm">
                      <Ticket className="mb-3 size-8 opacity-40" />
                      <p className="font-medium">No tickets</p>
                      <p className="text-xs">No assigned tickets yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col py-1">
                      {myTickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => router.push(`/ticket/${ticket.id}`)}
                          className="hover:bg-muted/50 flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors"
                        >
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              statusDot[ticket.status] ?? "bg-gray-400",
                            )}
                          />
                          <span className="text-foreground min-w-0 flex-1 truncate text-xs font-medium">
                            {ticket.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Favorites popover — same style as My Tickets */}
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
            <Star className="size-4 shrink-0" />
            <span>Favorites</span>
            {favorites.length > 0 && (
              <span className="bg-muted text-muted-foreground ml-auto rounded-full px-1.5 py-0 text-[10px] font-semibold">
                {favorites.length}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent side="right" sideOffset={8} align="start" className="w-auto p-0">
            <div className="flex h-[min(32rem,80vh)] w-72 flex-col">
              <div className="border-border flex shrink-0 items-center border-b px-3 py-2">
                <h2 className="text-sm font-semibold">Favorites</h2>
                {favorites.length > 0 && (
                  <span className="bg-muted text-muted-foreground ml-2 rounded-full px-1.5 py-0 text-[10px] font-semibold">
                    {favorites.length}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {favorites.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-sm">
                    <Star className="mb-3 size-8 opacity-40" />
                    <p className="font-medium">No favorites</p>
                    <p className="text-xs">Star tickets to pin them here</p>
                  </div>
                ) : (
                  <div className="flex flex-col py-1">
                    {favorites.map((fav) => (
                      <button
                        key={fav.id}
                        type="button"
                        onClick={() => router.push(`/ticket/${fav.ticket_id}`)}
                        className="hover:bg-muted/50 flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors"
                      >
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            statusDot[fav.status] ?? "bg-gray-400",
                          )}
                        />
                        <span className="text-foreground min-w-0 flex-1 truncate text-xs font-medium">
                          {fav.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Nav links */}
        <div className="space-y-0.5">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  navItemBase,
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <link.icon className="size-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Settings + Log out + User (fixed at bottom) */}
      <div className="border-border shrink-0 space-y-0.5 border-t px-2 py-2">
        <button
          type="button"
          onClick={() => {
            router.push("/settings");
            onClose?.();
          }}
          className={cn(
            navItemBase,
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </button>
        <button
          type="button"
          onClick={() => {
            resetOnboarding();
            signOut();
          }}
          className={cn(
            navItemBase,
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          Log out
        </button>
      </div>

      <div className="border-border shrink-0 border-t px-2 py-2">
        <div className={cn(navItemBase, "text-muted-foreground cursor-default")}>
          <Avatar size="sm" className="shrink-0">
            <AvatarImage src={currentUserAvatar} />
            <AvatarFallback className="text-xs">{initials ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-foreground truncate text-sm font-medium">{currentUserName}</p>
            <p className="text-muted-foreground truncate text-xs">{currentUserEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
