"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Circle,
  CheckCircle2,
  Clock,
  Eye,
  CircleDashed,
  User,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TicketEditor } from "./ticket-editor";
import type {
  TicketStatus,
  TicketPriority,
  TicketParentType,
  User as UserType,
  Label,
} from "@/types";
import { useCreateTicket } from "@/hooks/tickets";

// ---------------------------------------------------------------------------
// Options
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
// Compact property button
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserType[];
  labels: Label[];
  boardId?: string;
  parentId?: string;
  parentType?: TicketParentType;
  initialStatus?: TicketStatus;
}

export const CreateTicketDialog = ({
  open,
  onOpenChange,
  users,
  labels,
  boardId,
  parentId,
  parentType,
  initialStatus = "backlog",
}: CreateTicketDialogProps) => {
  const createTicketMutation = useCreateTicket();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [status, setStatus] = React.useState<TicketStatus>(initialStatus);
  const [priority, setPriority] = React.useState<TicketPriority>("none");
  const [assignee, setAssignee] = React.useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = React.useState<string[]>([]);
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined);
  const [editorKey, setEditorKey] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setStatus(initialStatus);
    }
  }, [open, initialStatus]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setStatus(initialStatus);
    setPriority("none");
    setAssignee(null);
    setSelectedLabels([]);
    setDueDate(undefined);
    setEditorKey((k) => k + 1); // remount editor
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    try {
      await createTicketMutation.mutateAsync({
        title: title.trim(),
        content,
        status,
        priority,
        assignee,
        labels: selectedLabels,
        due_date: dueDate ? dueDate.toISOString() : null,
        parent_id: parentId ?? boardId,
        parent_type: parentType ?? (boardId ? "board" : undefined),
      });
      resetForm();
      onOpenChange(false);
      toast.success("Ticket created successfully");
    } catch {
      toast.error("Failed to create ticket");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((l) => l !== labelId) : [...prev, labelId],
    );
  };

  const statusOpt = statusOptions.find((o) => o.value === status)!;
  const priorityOpt = priorityOptions.find((o) => o.value === priority)!;
  const assigneeUser = users.find((u) => u.id === assignee);

  const StatusIcon = statusOpt.icon;
  const PriorityIcon = priorityOpt.icon;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl animate-fade-in-scale"
        onKeyDown={handleKeyDown}
      >
        {/* Title input */}
        <div className="px-5 pt-5 pb-2">
          <input
            placeholder="Issue title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="placeholder:text-muted-foreground/50 w-full bg-transparent text-lg font-semibold outline-none"
          />
        </div>

        {/* Rich text editor */}
        <div className="max-h-[320px] min-h-[160px] flex-1 overflow-y-auto px-4">
          <TicketEditor
            key={editorKey}
            initialContent=""
            onChange={setContent}
            className="bn-compact-editor"
          />
        </div>

        {/* Separator + bottom bar */}
        <div className="border-border mt-auto border-t">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            {/* Property selectors */}
            <div className="flex flex-wrap items-center gap-1">
              {/* Status */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border border border-transparent",
                  )}
                >
                  <StatusIcon className={cn("size-3.5", statusOpt.color)} />
                  {statusOpt.label}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <DropdownMenuItem key={opt.value} onClick={() => setStatus(opt.value)}>
                        <Icon className={cn("size-3.5", opt.color)} />
                        {opt.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border border border-transparent",
                  )}
                >
                  <PriorityIcon className={cn("size-3.5", priorityOpt.color)} />
                  {priorityOpt.label}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  {priorityOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <DropdownMenuItem key={opt.value} onClick={() => setPriority(opt.value)}>
                        <Icon className={cn("size-3.5", opt.color)} />
                        {opt.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Assignee */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border border border-transparent",
                  )}
                >
                  {assigneeUser ? (
                    <>
                      <Avatar size="sm" className="size-3.5">
                        <AvatarImage src={assigneeUser.avatar} alt={assigneeUser.name} />
                        <AvatarFallback className="text-[8px]">
                          {assigneeUser.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {assigneeUser.name.split(" ")[0]}
                    </>
                  ) : (
                    <>
                      <User className="size-3.5" />
                      Assignee
                    </>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem onClick={() => setAssignee(null)}>
                    <User className="size-3.5" />
                    Unassigned
                  </DropdownMenuItem>
                  {users.map((u) => (
                    <DropdownMenuItem key={u.id} onClick={() => setAssignee(u.id)}>
                      <Avatar size="sm" className="size-4">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback className="text-[8px]">
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {u.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Labels */}
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border border border-transparent",
                      )}
                    />
                  }
                >
                  <Tag className="size-3.5" />
                  {selectedLabels.length === 0 ? (
                    "Labels"
                  ) : (
                    <span className="flex items-center gap-0.5">
                      {selectedLabels.slice(0, 2).map((lid) => {
                        const lbl = labels.find((l) => l.id === lid);
                        return lbl ? (
                          <span
                            key={lid}
                            className="inline-block size-2 rounded-full"
                            style={{ backgroundColor: lbl.color }}
                          />
                        ) : null;
                      })}
                      {selectedLabels.length > 0 && <span>{selectedLabels.length}</span>}
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-44 p-1" align="start">
                  {labels.map((lbl) => (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => toggleLabel(lbl.id)}
                      className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                    >
                      <Checkbox
                        checked={selectedLabels.includes(lbl.id)}
                        className="pointer-events-none size-3.5"
                      />
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: lbl.color }}
                      />
                      {lbl.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Due date */}
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border border border-transparent",
                        dueDate && "text-foreground",
                      )}
                    />
                  }
                >
                  <CalendarIcon className="size-3.5" />
                  {dueDate ? format(dueDate, "MMM d") : "Due date"}
                  {dueDate && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDueDate(undefined);
                      }}
                      className="hover:text-destructive ml-0.5"
                    >
                      <X className="size-2.5" />
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!title.trim() || createTicketMutation.isPending}
                className="h-7 gap-1.5 text-xs"
              >
                {createTicketMutation.isPending ? "Creating…" : "Create ticket"}
                {!createTicketMutation.isPending && (
                  <kbd className="text-primary-foreground/60 rounded bg-white/10 px-1 font-mono text-[9px]">
                    ⌘↵
                  </kbd>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
