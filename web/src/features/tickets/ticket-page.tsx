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
  Check,
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

const getUserInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
};

type TicketPropertyDraft = Pick<Ticket, "status" | "priority" | "assignee" | "labels" | "due_date">;

const createPropertyDraft = (ticket: Ticket): TicketPropertyDraft => ({
  status: ticket.status,
  priority: ticket.priority,
  assignee: ticket.assignee,
  labels: [...ticket.labels],
  due_date: ticket.due_date,
});

const propertyDraftEquals = (left: TicketPropertyDraft, right: TicketPropertyDraft) =>
  left.status === right.status &&
  left.priority === right.priority &&
  left.assignee === right.assignee &&
  left.due_date === right.due_date &&
  left.labels.length === right.labels.length &&
  left.labels.every((labelId, index) => labelId === right.labels[index]);

interface PropertyFieldProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}

const PropertyField = ({ icon: Icon, label, children }: PropertyFieldProps) => (
  <div className="border-border/60 bg-card/80 rounded-2xl border p-3 shadow-xs">
    <div className="text-muted-foreground mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
      <Icon className="size-3.5" />
      <span>{label}</span>
    </div>
    {children}
  </div>
);

const TicketSkeleton = () => (
  <div className="animate-fade-in flex h-full">
    <div className="flex flex-1 flex-col">
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <div className="skeleton-shimmer bg-muted h-4 w-16 rounded" />
        <div className="flex gap-2">
          <div className="skeleton-shimmer bg-muted h-6 w-14 rounded" />
          <div className="skeleton-shimmer bg-muted h-6 w-14 rounded" />
        </div>
      </div>
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="skeleton-shimmer bg-muted h-6 w-3/4 rounded" />
          <div className="skeleton-shimmer bg-muted h-4 w-full rounded" />
          <div className="skeleton-shimmer bg-muted h-4 w-2/3 rounded" />
          <div className="skeleton-shimmer bg-muted h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
    <div className="border-border hidden w-95 border-l lg:block">
      <div className="space-y-4 p-4">
        <div className="skeleton-shimmer bg-muted h-5 w-24 rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton-shimmer bg-muted h-4 w-20 rounded" />
            <div className="skeleton-shimmer bg-muted h-7 w-28 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
  const contentUpdateMutation = useUpdateTicket();
  const propertyUpdateMutation = useUpdateTicket();
  const deleteTicketMutation = useDeleteTicket();
  const createCommentMutation = useCreateComment();
  const { data: favorites = [] } = useFetchFavorites();
  const toggleFavMutation = useToggleFavorite();
  const isFavorited = favorites.some((f) => f.ticket_id === ticketId);

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

  const parentTicketId = ticket?.parent_type === "ticket" ? (ticket.parent_id ?? "") : "";
  const { data: parentTicket } = useFetchTicket(parentTicketId, fetchEnabled);

  const { data: subTickets = [] } = useTickets(
    fetchEnabled ? { parent_id: ticketId, parent_type: ["ticket"] } : undefined,
  );

  const [commentText, setCommentText] = React.useState("");
  const [labelsOpen, setLabelsOpen] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const [propertiesSaveStatus, setPropertiesSaveStatus] = React.useState<"idle" | "saved">("idle");
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [createSubOpen, setCreateSubOpen] = React.useState(false);
  const [dueDateOpen, setDueDateOpen] = React.useState(false);
  const [propertyDraft, setPropertyDraft] = React.useState<TicketPropertyDraft | null>(null);

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const propertyStatusTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const propertyTicketIdRef = React.useRef<string | null>(null);

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
        contentUpdateMutation.mutate(
          { id: ticketId, data: { content: value } },
          {
            onSuccess: () => {
              setSaveStatus("saved");
              setTimeout(() => setSaveStatus("idle"), 2000);
            },
            onError: () => setSaveStatus("idle"),
          },
        );
      }, 800);
    },
    [ticketId, contentUpdateMutation],
  );

  const handleContentChange = (value: string) => {
    if (collabConfig) return;
    debouncedSaveContent(value);
  };

  const syncedPropertyDraft = React.useMemo(
    () => (ticket ? createPropertyDraft(ticket) : null),
    [ticket],
  );

  React.useEffect(() => {
    if (!ticket || !syncedPropertyDraft) return;

    setPropertyDraft((current) => {
      const isSameTicket = propertyTicketIdRef.current === ticket.id;

      if (!current || !isSameTicket) {
        return syncedPropertyDraft;
      }

      return propertyDraftEquals(current, syncedPropertyDraft) ? syncedPropertyDraft : current;
    });

    propertyTicketIdRef.current = ticket.id;
  }, [syncedPropertyDraft, ticket]);

  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (propertyStatusTimerRef.current) clearTimeout(propertyStatusTimerRef.current);
    };
  }, []);

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

  if (ticketLoading) {
    return <TicketSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="animate-fade-in flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">Ticket not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/boards")}>
          <ArrowLeft className="size-4" />
          Back to Board
        </Button>
      </div>
    );
  }

  const currentProperties = propertyDraft ?? syncedPropertyDraft ?? createPropertyDraft(ticket);
  const isPropertiesDirty = !propertyDraftEquals(currentProperties, createPropertyDraft(ticket));
  const isPropertiesSaving = propertyUpdateMutation.isPending;
  const showPropertyActions = isPropertiesDirty || isPropertiesSaving;
  const selectedDate = currentProperties.due_date
    ? new Date(currentProperties.due_date)
    : undefined;
  const selectedLabels = currentProperties.labels
    .map((labelId) => labelMap.get(labelId))
    .filter((label): label is Label => Boolean(label));
  const visibleLabels = selectedLabels.slice(0, 2);
  const hiddenLabelCount = selectedLabels.length - visibleLabels.length;

  const updatePropertyDraft = <K extends keyof TicketPropertyDraft>(
    key: K,
    value: TicketPropertyDraft[K],
  ) => {
    setPropertiesSaveStatus("idle");
    setPropertyDraft((current) => ({
      ...(current ?? currentProperties),
      [key]: value,
    }));
  };

  const toggleLabel = (labelId: string) => {
    setPropertiesSaveStatus("idle");
    setPropertyDraft((current) => {
      const base = current ?? currentProperties;
      const nextLabels = base.labels.includes(labelId)
        ? base.labels.filter((existingLabelId) => existingLabelId !== labelId)
        : [...base.labels, labelId];

      return {
        ...base,
        labels: nextLabels,
      };
    });
    setLabelsOpen(false);
  };

  const handleCancelProperties = () => {
    setLabelsOpen(false);
    setDueDateOpen(false);
    setPropertiesSaveStatus("idle");
    setPropertyDraft(createPropertyDraft(ticket));
  };

  const handleSaveProperties = () => {
    if (!isPropertiesDirty || isPropertiesSaving) return;

    propertyUpdateMutation.mutate(
      { id: ticketId, data: currentProperties },
      {
        onSuccess: () => {
          setLabelsOpen(false);
          setDueDateOpen(false);
          setPropertiesSaveStatus("saved");

          if (propertyStatusTimerRef.current) clearTimeout(propertyStatusTimerRef.current);
          propertyStatusTimerRef.current = setTimeout(() => {
            setPropertiesSaveStatus("idle");
          }, 2000);
        },
        onError: () => {
          setPropertiesSaveStatus("idle");
        },
      },
    );
  };

  const propertyTriggerClassName =
    "h-10 w-full rounded-xl border-border/60 bg-background px-3 text-sm shadow-none transition-colors hover:bg-accent/30";
  const propertyContentClassName =
    "rounded-2xl border border-border/70 bg-background/98 p-2 shadow-xl";
  const propertyItemClassName = "min-h-10 rounded-xl px-2 py-2 text-sm";

  const propertiesPanel = (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <div className="border-border/60 bg-card/80 rounded-2xl border p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Properties</h4>
              <div className="text-muted-foreground flex min-h-5 items-center gap-1.5 text-xs">
                {isPropertiesSaving ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Saving changes...
                  </>
                ) : propertiesSaveStatus === "saved" ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    Changes saved
                  </>
                ) : isPropertiesDirty ? (
                  <>
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    Unsaved changes
                  </>
                ) : null}
              </div>
            </div>

            {showPropertyActions ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelProperties}
                  disabled={!isPropertiesDirty || isPropertiesSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProperties}
                  disabled={!isPropertiesDirty || isPropertiesSaving}
                >
                  {isPropertiesSaving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative">
          <div
            className={cn(
              "space-y-3 transition-opacity",
              isPropertiesSaving && "pointer-events-none opacity-45",
            )}
          >
            <PropertyField icon={CircleDot} label="Status">
              <Select
                value={currentProperties.status}
                disabled={isPropertiesSaving}
                onValueChange={(value) => updatePropertyDraft("status", value as TicketStatus)}
              >
                <SelectTrigger size="sm" className={propertyTriggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className={propertyContentClassName}>
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={propertyItemClassName}
                      >
                        <Icon className={cn("size-3.5", opt.color)} />
                        {opt.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </PropertyField>

            <PropertyField icon={AlertCircle} label="Priority">
              <Select
                value={currentProperties.priority}
                disabled={isPropertiesSaving}
                onValueChange={(value) => updatePropertyDraft("priority", value as TicketPriority)}
              >
                <SelectTrigger size="sm" className={propertyTriggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className={propertyContentClassName}>
                  {priorityOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={propertyItemClassName}
                      >
                        <Icon className={cn("size-3.5", opt.color)} />
                        {opt.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </PropertyField>

            <PropertyField icon={UserIcon} label="Assignee">
              <Select
                value={currentProperties.assignee ?? "__none__"}
                disabled={isPropertiesSaving}
                onValueChange={(value) =>
                  updatePropertyDraft("assignee", value === "__none__" ? null : value)
                }
              >
                <SelectTrigger size="sm" className={propertyTriggerClassName}>
                  <SelectValue>
                    {(() => {
                      if (!currentProperties.assignee) return "Unassigned";

                      const assignee = userMap.get(currentProperties.assignee);
                      if (!assignee) return "Unassigned";

                      return (
                        <span className="flex items-center gap-2">
                          <Avatar size="sm" className="size-5">
                            <AvatarImage src={assignee.avatar} alt={assignee.name} />
                            <AvatarFallback className="text-[9px]">
                              {getUserInitials(assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{assignee.name}</span>
                        </span>
                      );
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start" className={propertyContentClassName}>
                  <SelectItem value="__none__" className={propertyItemClassName}>
                    Unassigned
                  </SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id} className={propertyItemClassName}>
                      <Avatar size="sm" className="size-5">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-[9px]">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{user.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropertyField>

            <PropertyField icon={UserIcon} label="Created by">
              <div className="border-border/60 bg-background flex min-h-10 items-center gap-2 rounded-xl border px-3">
                {(() => {
                  const creator = userMap.get(ticket.created_by);

                  return creator ? (
                    <>
                      <Avatar size="sm" className="size-5">
                        <AvatarImage src={creator.avatar} alt={creator.name} />
                        <AvatarFallback className="text-[9px]">
                          {getUserInitials(creator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium">{creator.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">Unknown creator</span>
                  );
                })()}
              </div>
            </PropertyField>

            <PropertyField icon={Tag} label="Labels">
              <Popover
                open={labelsOpen}
                onOpenChange={(open) => {
                  if (isPropertiesSaving) return;
                  setLabelsOpen(open);
                }}
              >
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/60 bg-background hover:bg-accent/30 h-auto min-h-10 w-full justify-start rounded-xl px-3 py-2 text-left shadow-none"
                    />
                  }
                >
                  {selectedLabels.length === 0 ? (
                    <span className="text-muted-foreground">Select labels</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {visibleLabels.map((label) => (
                        <span
                          key={label.id}
                          className="border-border/60 bg-muted/35 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          {label.name}
                        </span>
                      ))}
                      {hiddenLabelCount > 0 && (
                        <span className="text-muted-foreground text-[11px] font-medium">
                          +{hiddenLabelCount} more
                        </span>
                      )}
                    </div>
                  )}
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className={cn("w-64 gap-0", propertyContentClassName)}
                >
                  <div className="border-border/60 mb-2 border-b px-1 pb-2">
                    <p className="text-sm font-semibold">Labels</p>
                    <p className="text-muted-foreground text-[11px]">
                      Pick a label, then save the ticket changes.
                    </p>
                  </div>
                  <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                    {labels.map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => toggleLabel(label.id)}
                        className="hover:bg-accent flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors"
                      >
                        <Checkbox
                          checked={currentProperties.labels.includes(label.id)}
                          className="pointer-events-none"
                        />
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="truncate">{label.name}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </PropertyField>

            <PropertyField icon={CalendarIcon} label="Due date">
              <Popover
                open={dueDateOpen}
                onOpenChange={(open) => {
                  if (isPropertiesSaving) return;
                  setDueDateOpen(open);
                }}
              >
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/60 bg-background hover:bg-accent/30 h-10 w-full justify-start rounded-xl px-3 text-left shadow-none"
                    />
                  }
                >
                  <CalendarIcon className="text-muted-foreground size-3.5" />
                  <span className="truncate">
                    {currentProperties.due_date
                      ? format(new Date(currentProperties.due_date), "MMM d, yyyy")
                      : "Set a due date"}
                  </span>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className={cn("w-auto p-2", propertyContentClassName)}
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      updatePropertyDraft("due_date", date ? date.toISOString() : null);
                      setDueDateOpen(false);
                    }}
                  />
                  <div className="border-border/60 flex justify-end border-t px-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updatePropertyDraft("due_date", null);
                        setDueDateOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </PropertyField>

            {ticket.parent_type === "ticket" && parentTicket && (
              <PropertyField icon={CornerDownRight} label="Parent ticket">
                <button
                  type="button"
                  onClick={() => router.push(`/ticket/${parentTicket.id}`)}
                  className="border-border/60 text-foreground hover:border-primary/35 hover:bg-accent bg-background flex min-h-10 w-full items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition-colors"
                >
                  <CornerDownRight className="text-muted-foreground size-3.5 rotate-180" />
                  <span className="truncate">{parentTicket.title}</span>
                </button>
              </PropertyField>
            )}
          </div>

          {isPropertiesSaving && (
            <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
              <div className="border-border/70 bg-background flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm">
                <Loader2 className="size-3.5 animate-spin" />
                Saving properties...
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Sub-tickets</h4>
          <button
            type="button"
            onClick={() => setCreateSubOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-all"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>

        {subTickets.length === 0 && (
          <p className="text-muted-foreground/60 text-xs">No sub-tickets yet.</p>
        )}

        {subTickets.map((sub) => {
          const statusOpt = statusOptions.find((o) => o.value === sub.status);
          const StatusIcon = statusOpt?.icon ?? Circle;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => router.push(`/ticket/${sub.id}`)}
              className="hover:bg-accent flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all"
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

  const activitySection = (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Activity</h4>

      {timeline.length === 0 && (
        <p className="text-muted-foreground/60 text-xs">No activity yet.</p>
      )}

      <div className="space-y-4">
        {timeline.map((item) => {
          if (item.type === "comment") {
            const comment = item.data as Comment;
            const author = userMap.get(comment.author_id);
            return (
              <div key={item.id} className="animate-fade-in flex gap-3">
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
        <Button
          size="icon"
          onClick={handleSubmitComment}
          disabled={!commentText.trim() || createCommentMutation.isPending}
        >
          {createCommentMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-border bg-background/80 flex shrink-0 items-center justify-between border-b px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="text-muted-foreground save-indicator flex items-center gap-1.5 text-xs">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="animate-fade-in flex items-center gap-1 text-xs text-emerald-500">
                <Check className="size-3" />
                Saved
              </span>
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
              disabled={deleteTicketMutation.isPending}
              className={cn(
                "text-muted-foreground hover:text-destructive hover:bg-destructive/8 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all",
                deleteTicketMutation.isPending && "pointer-events-none opacity-50",
              )}
            >
              {deleteTicketMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all lg:hidden"
            >
              <SlidersHorizontal className="size-3.5" />
              Details
            </button>
            <button
              type="button"
              onClick={() => toggleFavMutation.mutate(ticketId)}
              disabled={toggleFavMutation.isPending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all",
                isFavorited
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                toggleFavMutation.isPending && "opacity-60",
              )}
            >
              {toggleFavMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Star className={cn("size-3.5", isFavorited && "fill-amber-400")} />
              )}
              {isFavorited ? "Favorited" : "Favorite"}
            </button>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-6xl py-4 sm:px-10 lg:px-16 lg:py-6">
            <TicketEditor
              key={collabConfig ? `${ticketId}-collab` : ticketId}
              initialContent={ticket.content ?? ""}
              onChange={handleContentChange}
              mentionUsers={users.map((u) => ({ id: u.id, name: u.name }))}
              collaboration={collabConfig}
            />

            <div className="px-4 sm:px-0">
              <Separator className="my-6" />
              {activitySection}
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="border-border hidden w-95 flex-col border-l lg:flex">
        <ScrollArea className="flex-1">{propertiesPanel}</ScrollArea>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="bottom" className="flex max-h-[88vh] flex-col p-0">
          <SheetHeader className="border-border shrink-0 border-b px-4 py-3">
            <SheetTitle className="text-sm">Details</SheetTitle>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1">{propertiesPanel}</ScrollArea>
        </SheetContent>
      </Sheet>

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
