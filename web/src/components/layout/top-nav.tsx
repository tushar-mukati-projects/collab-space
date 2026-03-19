"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useFetchWorkspace } from "@/hooks/workspace";
import { useFetchTicket, useUpdateTicket } from "@/hooks/tickets";
import { cn } from "@/lib/utils";
import { ChevronRight, Menu, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LeftNav } from "@/components/layout/left-nav";

export const TopNav = () => {
  const pathname = usePathname();
  const { data: workspace } = useFetchWorkspace();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const ticketMatch = pathname.match(/^\/ticket\/([^/]+)/);
  const ticketId = ticketMatch?.[1] ?? "";
  const { data: ticket } = useFetchTicket(ticketId);
  const updateTicketMutation = useUpdateTicket();

  const [titleEditing, setTitleEditing] = React.useState(false);
  const [titleValue, setTitleValue] = React.useState("");
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ticket) setTitleValue(ticket.title);
  }, [ticket]);

  const handleTitleClick = () => {
    setTitleEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleTitleChange = (value: string) => {
    setTitleValue(value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (value.trim() && value.trim() !== ticket?.title) {
        updateTicketMutation.mutate({ id: ticketId, data: { title: value.trim() } });
      }
    }, 600);
  };

  const handleTitleBlur = () => {
    setTitleEditing(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (titleValue.trim() && titleValue.trim() !== ticket?.title) {
      updateTicketMutation.mutate({ id: ticketId, data: { title: titleValue.trim() } });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  return (
    <>
      {/* Top bar: always on mobile; on desktop only when on a ticket page */}
      <header
        className={cn(
          "border-border bg-background/80 backdrop-blur-sm flex h-12 shrink-0 items-center gap-2 border-b px-3",
          !ticketId && "sm:hidden",
        )}
      >
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 sm:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Breadcrumb — ticket pages only */}
        {ticketId && (
          <div className="text-muted-foreground ml-auto flex min-w-0 flex-1 items-center gap-1 text-sm sm:ml-0">
            <span className="hidden shrink-0 opacity-70 sm:inline">{workspace?.name ?? "CollabSpace"}</span>
            <ChevronRight className="hidden size-3 shrink-0 opacity-40 sm:block" />
            <span className="hidden shrink-0 opacity-70 sm:inline">ticket</span>
            <ChevronRight className="hidden size-3 shrink-0 opacity-40 sm:block" />
            {titleEditing ? (
              <input
                ref={inputRef}
                value={titleValue}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-foreground min-w-0 flex-1 rounded-md border border-indigo-400/50 bg-indigo-500/5 px-2 py-0.5 font-medium outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={handleTitleClick}
                className="text-foreground hover:bg-accent min-w-0 truncate rounded-md px-2 py-0.5 text-left font-medium transition-all"
                title="Click to edit title"
              >
                {titleValue || ticket?.title || "…"}
              </button>
            )}

            {/* Save status indicator */}
            {updateTicketMutation.isPending && (
              <Loader2 className="ml-1 size-3.5 shrink-0 animate-spin text-indigo-500" />
            )}
            {updateTicketMutation.isSuccess && !updateTicketMutation.isPending && (
              <span className="ml-1 flex items-center gap-0.5 text-xs text-emerald-500 animate-fade-in">
                <Check className="size-3" />
                Saved
              </span>
            )}
          </div>
        )}
      </header>

      {/* Mobile nav drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-64 p-0">
          <LeftNav onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};
