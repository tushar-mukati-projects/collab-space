"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarIcon,
  Send,
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Minus,
  Circle,
  CheckCircle2,
  Clock,
  Eye,
  CircleDashed,
  CircleDot,
  Tag,
  User as UserIcon,
  Loader2,
  SlidersHorizontal,
  Plus,
  CornerDownRight,
  ChevronRight,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TicketEditor, getCollabColor } from "./ticket-editor";
import { useUser } from "@clerk/nextjs";
import { useFetchWorkspace } from "@/hooks/workspace";
import { CreateTicketDialog } from "./create-ticket-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  useFetchTicket,
  useUpdateTicket,
  useDeleteTicket,
  useFetchComments,
  useFetchActivities,
  useCreateComment,
  useTickets,
} from "@/hooks/tickets";
import { useFetchUsers } from "@/hooks/users";
import { useFetchLabels } from "@/hooks/labels";
import { useFetchFavorites, useToggleFavorite } from "@/hooks/favorites";
import type { Ticket, TicketStatus, TicketPriority, User, Label, Comment, Activity } from "@/types";

// ---------------------------------------------------------------------------
// Status / priority options
// ---------------------------------------------------------------------------

const statusOptions: {
  value: TicketStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "backlog", label: "Backlog", icon: CircleDashed, color: "text-muted-foreground" },
  { value: "todo", label: "Todo", icon: Circle, color: "text-foreground" },
  { value: "in-progress", label: "In Progress", icon: Clock, color: "text-yellow-500" },
  { value: "in-review", label: "In Review", icon: Eye, color: "text-blue-500" },
  { value: "done", label: "Done", icon: CheckCircle2, color: "text-green-500" },
];

const priorityOptions: {
  value: TicketPriority;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "urgent", label: "Urgent", icon: AlertCircle, color: "text-red-500" },
  { value: "high", label: "High", icon: ArrowUp, color: "text-orange-500" },
  { value: "medium", label: "Medium", icon: Minus, color: "text-blue-500" },
  { value: "low", label: "Low", icon: ArrowDown, color: "text-green-500" },
  { value: "none", label: "None", icon: Circle, color: "text-muted-foreground" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getUserInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TicketPageProps {
  ticketId: string;
}

export const TicketPage = ({ ticketId }: TicketPageProps) => {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { data: workspace } = useFetchWorkspace();
  const [isDeleted, setIsDeleted] = React.useState(false);
  const fetchEnabled = !isDeleted;
  const { data: ticket, isLoading: ticketLoading } = useFetchTicket(ticketId, fetchEnabled);
  const { data: users = [] } = useFetchUsers();
  const { data: labels = [] } = useFetchLabels();
  const { data: comments = [] } = useFetchComments(ticketId, fetchEnabled);
  const { data: activities = [] } = useFetchActivities(ticketId, fetchEnabled);
  const updateTicketMutation = useUpdateTicket();
  const deleteTicketMutation = useDeleteTicket();
  const createCommentMutation = useCreateComment();
  const { data: favorites = [] } = useFetchFavorites();
  const toggleFavMutation = useToggleFavorite();
  const isFavorited = favorites.some((f) => f.ticket_id === ticketId);

  // Collaboration config — works in two modes:
  // 1. WebSocket (NEXT_PUBLIC_COLLAB_URL=ws://...) — for self-hosted with Hocuspocus
  // 2. Serverless (NEXT_PUBLIC_COLLAB_URL=serverless) — polling via API routes, works on Vercel
  const collabConfig = React.useMemo(() => {
    const collabUrl = process.env.NEXT_PUBLIC_COLLAB_URL;
    if (!collabUrl || !clerkUser?.id || !workspace) return undefined;
    const wsId =
      typeof workspace === "object" && "id" in workspace ? (workspace as { id: string }).id : "";
    if (!wsId) return undefined;
    return {
      documentName: `ticket:${ticketId}`,
      user: {
        name: clerkUser.fullName ?? clerkUser.firstName ?? "User",
        color: getCollabColor(clerkUser.id),
      },
      token: `${clerkUser.id}:${wsId}`,
    };
  }, [ticketId, clerkUser, workspace]);
  // Parent ticket (only fetched when this ticket is a sub-ticket)
  const parentTicketId = ticket?.parent_type === "ticket" ? (ticket.parent_id ?? "") : "";
  const { data: parentTicket } = useFetchTicket(parentTicketId, fetchEnabled);

  const { data: subTickets = [] } = useTickets(
    fetchEnabled ? { parent_id: ticketId, parent_type: ["ticket"] } : undefined,
  );

  const [commentText, setCommentText] = React.useState("");
  const [labelsOpen, setLabelsOpen] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [createSubOpen, setCreateSubOpen] = React.useState(false);

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const userMap = React.useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const labelMap = React.useMemo(() => {
    const map = new Map<string, Label>();
    labels.forEach((l) => map.set(l.id, l));
    return map;
  }, [labels]);

  const timeline = React.useMemo(() => {
    const items: {
      id: string;
      type: "comment" | "activity";
      created_at: string;
      data: Comment | Activity;
    }[] = [];

    comments.forEach((c) =>
      items.push({ id: c.id, type: "comment", created_at: c.created_at, data: c }),
    );
    activities.forEach((a) =>
      items.push({ id: a.id, type: "activity", created_at: a.created_at, data: a }),
    );

    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return items;
  }, [comments, activities]);

  const debouncedSaveContent = React.useCallback(
    (value: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(() => {
        updateTicketMutation.mutate(
          { id: ticketId, data: { content: value } },
          {
            onSuccess: () => setSaveStatus("saved"),
            onError: () => setSaveStatus("idle"),
          },
        );
      }, 800);
    },
    [ticketId, updateTicketMutation],
  );

  const handleContentChange = (value: string) => {
    if (collabConfig) return; // Yjs/Hocuspocus handles persistence
    debouncedSaveContent(value);
  };

  const handleUpdate = (data: Partial<Ticket>) => {
    updateTicketMutation.mutate({ id: ticketId, data });
  };

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      createCommentMutation.mutate({
        content: commentText.trim(),
        author_id: "usr_01",
        ticket_id: ticketId,
      });
      setCommentText("");
    }
  };

  const toggleLabel = (labelId: string) => {
    if (!ticket) return;
    const current = ticket.labels ?? [];
    const next = current.includes(labelId)
      ? current.filter((l) => l !== labelId)
      : [...current, labelId];
    handleUpdate({ labels: next });
  };

  if (ticketLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">Ticket not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/boards")}>
          <ArrowLeft className="size-4" />
          Back to Board
        </Button>
      </div>
    );
  }

  const selectedDate = ticket.due_date ? new Date(ticket.due_date) : undefined;

  // ---------------------------------------------------------------------------
  // Properties + Activity panel — shared between desktop sidebar and mobile sheet
  // ---------------------------------------------------------------------------

  const propertiesPanel = (
    <div className="space-y-6 p-4">
      {/* Properties section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Properties</h4>

        <div className="grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-3 text-sm">
          {/* Status */}
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CircleDot className="size-3.5" />
            Status
          </span>
          <Select
            value={ticket.status}
            onValueChange={(val) => handleUpdate({ status: val as TicketStatus })}
          >
            <SelectTrigger size="sm" className="h-7 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <Icon className={cn("size-3.5", opt.color)} />
                    {opt.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Priority */}
          <span className="text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="size-3.5" />
            Priority
          </span>
          <Select
            value={ticket.priority}
            onValueChange={(val) => handleUpdate({ priority: val as TicketPriority })}
          >
            <SelectTrigger size="sm" className="h-7 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <Icon className={cn("size-3.5", opt.color)} />
                    {opt.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Assignee */}
          <span className="text-muted-foreground flex items-center gap-1.5">
            <UserIcon className="size-3.5" />
            Assignee
          </span>
          <Select
            value={ticket.assignee ?? "__none__"}
            onValueChange={(val) => handleUpdate({ assignee: val === "__none__" ? null : val })}
          >
            <SelectTrigger size="sm" className="h-7 w-auto">
              <SelectValue>
                {(() => {
                  if (!ticket.assignee) return "Unassigned";
                  const u = userMap.get(ticket.assignee);
                  if (!u) return "Unassigned";
                  return (
                    <span className="flex items-center gap-1.5">
                      <Avatar size="sm" className="size-4">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback className="text-[8px]">
                          {getUserInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      {u.name}
                    </span>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Unassigned</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <Avatar size="sm" className="size-4">
                    <AvatarImage src={u.avatar} alt={u.name} />
                    <AvatarFallback className="text-[8px]">
                      {getUserInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Created by */}
          <span className="text-muted-foreground flex items-center gap-1.5">
            <UserIcon className="size-3.5" />
            Created by
          </span>
          <div className="flex items-center gap-1.5">
            {(() => {
              const creator = userMap.get(ticket.created_by);
              return creator ? (
                <>
                  <Avatar size="sm" className="size-4">
                    <AvatarImage src={creator.avatar} alt={creator.name} />
                    <AvatarFallback className="text-[8px]">
                      {getUserInitials(creator.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{creator.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              );
            })()}
          </div>

          {/* Labels */}
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Tag className="size-3.5" />
            Labels
          </span>
          <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="h-7 w-auto justify-start gap-1" />
              }
            >
              {ticket.labels.length === 0 ? (
                <span className="text-muted-foreground">Add labels</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {ticket.labels.map((lid) => {
                    const lbl = labelMap.get(lid);
                    if (!lbl) return null;
                    return (
                      <span
                        key={lbl.id}
                        className="border-border inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px]"
                      >
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: lbl.color }}
                        />
                        {lbl.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              {labels.map((lbl) => (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => toggleLabel(lbl.id)}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={ticket.labels.includes(lbl.id)}
                    className="pointer-events-none"
                  />
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: lbl.color }}
                  />
                  {lbl.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Due date */}
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            Due date
          </span>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="h-7 w-auto justify-start gap-1.5" />
              }
            >
              <CalendarIcon className="text-muted-foreground size-3.5" />
              {ticket.due_date ? format(new Date(ticket.due_date), "MMM d, yyyy") : "Set date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => handleUpdate({ due_date: date ? date.toISOString() : null })}
              />
            </PopoverContent>
          </Popover>
          {/* Parent ticket */}
          {ticket.parent_type === "ticket" && parentTicket && (
            <>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CornerDownRight className="size-3.5 rotate-180" />
                Parent
              </span>
              <button
                type="button"
                onClick={() => router.push(`/ticket/${parentTicket.id}`)}
                className="text-foreground hover:text-primary truncate text-left text-sm font-medium transition-colors"
              >
                {parentTicket.title}
              </button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Sub-tickets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Sub-tickets</h4>
          <button
            type="button"
            onClick={() => setCreateSubOpen(true)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>

        {subTickets.length === 0 && (
          <p className="text-muted-foreground text-xs">No sub-tickets yet.</p>
        )}

        {subTickets.map((sub) => {
          const statusOpt = statusOptions.find((o) => o.value === sub.status);
          const StatusIcon = statusOpt?.icon ?? Circle;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => router.push(`/ticket/${sub.id}`)}
              className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
            >
              <StatusIcon className={cn("size-3.5 shrink-0", statusOpt?.color)} />
              <span className="truncate text-sm">{sub.title}</span>
              <ChevronRight className="text-muted-foreground ml-auto size-3 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Activity & Comments — rendered below the editor in the main column
  // ---------------------------------------------------------------------------

  const activitySection = (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Activity</h4>

      {timeline.length === 0 && <p className="text-muted-foreground text-xs">No activity yet.</p>}

      <div className="space-y-4">
        {timeline.map((item) => {
          if (item.type === "comment") {
            const comment = item.data as Comment;
            const author = userMap.get(comment.author_id);
            return (
              <div key={item.id} className="flex gap-3">
                <Avatar size="sm">
                  {author && (
                    <>
                      <AvatarImage src={author.avatar} alt={author.name} />
                      <AvatarFallback>{getUserInitials(author.name)}</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{author?.name ?? "Unknown"}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            );
          }

          const activity = item.data as Activity;
          const actor = userMap.get(activity.user_id);
          return (
            <div key={item.id} className="text-muted-foreground flex items-center gap-3 text-xs">
              <div className="flex size-6 items-center justify-center">
                <div className="bg-border size-1.5 rounded-full" />
              </div>
              <span>
                <span className="text-foreground font-medium">{actor?.name ?? "Someone"}</span>{" "}
                {activity.message}{" "}
                <span>
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Add comment */}
      <div className="flex gap-2 pt-2">
        <Input
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
          className="text-sm"
        />
        <Button size="icon" onClick={handleSubmitComment} disabled={!commentText.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Left column — title + markdown content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Toolbar bar */}
        <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            {saveStatus !== "idle" && (
              <p className="text-muted-foreground text-xs">
                {saveStatus === "saving" ? "Saving…" : "Saved"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this ticket?")) {
                  setIsDeleted(true);
                  deleteTicketMutation.mutate(ticketId, {
                    onSuccess: () => router.push("/boards"),
                  });
                }
              }}
              className="text-muted-foreground hover:text-destructive hover:bg-accent inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors lg:hidden"
            >
              <SlidersHorizontal className="size-3.5" />
              Details
            </button>
            <button
              type="button"
              onClick={() => toggleFavMutation.mutate(ticketId)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                isFavorited
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <Star className={cn("size-3.5", isFavorited && "fill-amber-400")} />
              {isFavorited ? "Favorited" : "Favorite"}
            </button>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-6xl py-4 sm:px-10 lg:px-16 lg:py-6">
            {/* Rich text editor */}
            <TicketEditor
              key={collabConfig ? `${ticketId}-collab` : ticketId}
              initialContent={ticket.content ?? ""}
              onChange={handleContentChange}
              mentionUsers={users.map((u) => ({ id: u.id, name: u.name }))}
              collaboration={collabConfig}
            />

            {/* Activity & Comments — below editor */}
            <div className="px-4 sm:px-0">
              <Separator className="my-6" />
              {activitySection}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Desktop right column — properties & activity */}
      <div className="border-border hidden w-[380px] flex-col border-l lg:flex">
        <ScrollArea className="flex-1">{propertiesPanel}</ScrollArea>
      </div>

      {/* Mobile details sheet (bottom drawer) */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="bottom" className="flex max-h-[88vh] flex-col p-0">
          <SheetHeader className="border-border shrink-0 border-b px-4 py-3">
            <SheetTitle className="text-sm">Details</SheetTitle>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1">{propertiesPanel}</ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Create sub-ticket dialog */}
      <CreateTicketDialog
        open={createSubOpen}
        onOpenChange={setCreateSubOpen}
        users={users}
        labels={labels}
        parentId={ticketId}
        parentType="ticket"
      />
    </div>
  );
};
