"use client";

import * as React from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  X,
  CalendarIcon,
  Send,
  AlertCircle,
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
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface TicketDetailProps {
  ticket: Ticket;
  users: User[];
  labels: Label[];
  comments: Comment[];
  activities: Activity[];
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Ticket>) => void;
  onAddComment: (ticketId: string, content: string) => void;
}

export const TicketDetail = ({
  ticket,
  users,
  labels,
  comments,
  activities,
  onClose,
  onUpdate,
  onAddComment,
}: TicketDetailProps) => {
  const { data: favorites = [] } = useFetchFavorites();
  const toggleFavMutation = useToggleFavorite();
  const isFavorited = favorites.some((f) => f.ticket_id === ticket.id);

  const [editingTitle, setEditingTitle] = React.useState(false);
  const [titleValue, setTitleValue] = React.useState(ticket.title);
  const [descriptionValue, setDescriptionValue] = React.useState(ticket.description);
  const [commentText, setCommentText] = React.useState("");
  const [labelsOpen, setLabelsOpen] = React.useState(false);

  // Sync when ticket changes
  React.useEffect(() => {
    setTitleValue(ticket.title);
    setDescriptionValue(ticket.description);
  }, [ticket.id, ticket.title, ticket.description]);

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

  // Merge comments and activities into timeline
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

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== ticket.title) {
      onUpdate(ticket.id, { title: titleValue.trim() });
    }
  };

  const handleDescBlur = () => {
    if (descriptionValue !== ticket.description) {
      onUpdate(ticket.id, { description: descriptionValue });
    }
  };

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onAddComment(ticket.id, commentText.trim());
      setCommentText("");
    }
  };

  const toggleLabel = (labelId: string) => {
    const current = ticket.labels ?? [];
    const next = current.includes(labelId)
      ? current.filter((l) => l !== labelId)
      : [...current, labelId];
    onUpdate(ticket.id, { labels: next });
  };

  const selectedDate = ticket.due_date ? new Date(ticket.due_date) : undefined;

  return (
    <div className="border-border bg-background flex h-full flex-col border-l">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <span className="text-muted-foreground font-mono text-xs">{ticket.id}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => toggleFavMutation.mutate(ticket.id)}
            className={cn(
              isFavorited
                ? "text-amber-400 hover:text-amber-500"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Star className={cn("size-4", isFavorited && "fill-amber-400")} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Title */}
          {editingTitle ? (
            <Input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleBlur();
                if (e.key === "Escape") {
                  setTitleValue(ticket.title);
                  setEditingTitle(false);
                }
              }}
              className="text-lg font-semibold"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="hover:text-primary w-full text-left text-lg font-semibold transition-colors"
            >
              {ticket.title}
            </button>
          )}

          {/* Properties grid */}
          <div className="grid grid-cols-[7rem_1fr] gap-x-2 gap-y-3 text-sm">
            {/* Status */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CircleDot className="size-3.5" />
              Status
            </span>
            <Select
              value={ticket.status}
              onValueChange={(val) => onUpdate(ticket.id, { status: val as TicketStatus })}
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
              onValueChange={(val) => onUpdate(ticket.id, { priority: val as TicketPriority })}
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
              onValueChange={(val) =>
                onUpdate(ticket.id, {
                  assignee: val === "__none__" ? null : val,
                })
              }
            >
              <SelectTrigger size="sm" className="h-7 w-auto">
                <SelectValue />
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-auto justify-start gap-1.5"
                  />
                }
              >
                <CalendarIcon className="text-muted-foreground size-3.5" />
                {ticket.due_date ? format(new Date(ticket.due_date), "MMM d, yyyy") : "Set date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) =>
                    onUpdate(ticket.id, {
                      due_date: date ? date.toISOString() : null,
                    })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-muted-foreground text-sm font-medium">Description</h4>
            <Textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              onBlur={handleDescBlur}
              placeholder="Add a description..."
              className="min-h-[6rem] text-sm"
            />
          </div>

          <Separator />

          {/* Activity / Comments */}
          <div className="space-y-4">
            <h4 className="text-muted-foreground text-sm font-medium">Activity</h4>

            {timeline.length === 0 && (
              <p className="text-muted-foreground text-xs">No activity yet.</p>
            )}

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

                // Activity item
                const activity = item.data as Activity;
                const actor = userMap.get(activity.user_id);
                return (
                  <div
                    key={item.id}
                    className="text-muted-foreground flex items-center gap-3 text-xs"
                  >
                    <div className="flex size-6 items-center justify-center">
                      <div className="bg-border size-1.5 rounded-full" />
                    </div>
                    <span>
                      <span className="text-foreground font-medium">
                        {actor?.name ?? "Someone"}
                      </span>{" "}
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
        </div>
      </ScrollArea>
    </div>
  );
};
