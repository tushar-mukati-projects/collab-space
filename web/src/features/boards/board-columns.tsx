"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMoveTicket } from "@/hooks/board";
import { useFetchLabels } from "@/hooks/labels";
import { useFetchUsers } from "@/hooks/users";
import { useTickets } from "@/hooks/tickets";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type {
  BoardSummary,
  TicketSummary,
  BoardColumn as BoardColumnType,
  TicketStatus,
  TicketPriority,
  TicketFilters,
  Label,
} from "@/types";
import { BoardColumn } from "./board-column";
import { BoardCard } from "./board-card";
import { CreateTicketDialog } from "@/features/tickets/create-ticket-dialog";
import { Search, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Static column definitions — drives the visual layout
// ---------------------------------------------------------------------------

const COLUMN_DEFS: { status: TicketStatus; name: string; color: string }[] = [
  { status: "backlog", name: "Backlog", color: "#6b7280" },
  { status: "todo", name: "Todo", color: "#3b82f6" },
  { status: "in-progress", name: "In Progress", color: "#f59e0b" },
  { status: "in-review", name: "In Review", color: "#8b5cf6" },
  { status: "done", name: "Done", color: "#10b981" },
];

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "in-review", label: "In Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

const buildColumns = (tickets: TicketSummary[]): BoardColumnType[] => {
  return COLUMN_DEFS.map((def, idx) => ({
    id: `col_${def.status}`,
    name: def.name,
    color: def.color,
    status: def.status,
    order: idx,
    tickets: tickets.filter((t) => t.status === def.status),
  }));
};

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

interface FilterBarProps {
  filters: TicketFilters;
  onFiltersChange: (f: TicketFilters) => void;
  users: { id: string; name: string }[];
  labels: Label[];
}

const FilterBar = ({ filters, onFiltersChange, users, labels }: FilterBarProps) => {
  const activeCount = [
    filters.statuses?.length,
    filters.priorities?.length,
    filters.assignees?.length,
    filters.labels?.length,
    filters.search_term ? 1 : 0,
  ].reduce<number>((a, b) => a + (b ?? 0), 0);

  const toggle = <T extends string>(key: keyof TicketFilters, value: T) => {
    const current = (filters[key] as T[] | undefined) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onFiltersChange({ ...filters, [key]: next.length > 0 ? next : undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <input
          placeholder="Search tickets…"
          value={filters.search_term ?? ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search_term: e.target.value || undefined })
          }
          className="bg-background border-border text-foreground placeholder:text-muted-foreground h-7 w-44 rounded-md border pr-2 pl-8 text-sm outline-none focus:ring-1 focus:ring-inset"
        />
      </div>

      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border hover:bg-accent inline-flex h-7 items-center gap-1 rounded-md border bg-transparent px-2.5 text-xs font-medium transition-colors",
            (filters.statuses?.length ?? 0) > 0 && "border-primary text-primary",
          )}
        >
          Status
          {(filters.statuses?.length ?? 0) > 0 && (
            <span className="rounded-full bg-primary px-1 text-[10px] text-white">
              {filters.statuses!.length}
            </span>
          )}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={(filters.statuses ?? []).includes(opt.value)}
              onCheckedChange={() => toggle("statuses", opt.value)}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border hover:bg-accent inline-flex h-7 items-center gap-1 rounded-md border bg-transparent px-2.5 text-xs font-medium transition-colors",
            (filters.priorities?.length ?? 0) > 0 && "border-primary text-primary",
          )}
        >
          Priority
          {(filters.priorities?.length ?? 0) > 0 && (
            <span className="rounded-full bg-primary px-1 text-[10px] text-white">
              {filters.priorities!.length}
            </span>
          )}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          {PRIORITY_OPTIONS.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={(filters.priorities ?? []).includes(opt.value)}
              onCheckedChange={() => toggle("priorities", opt.value)}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Assignee filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border hover:bg-accent inline-flex h-7 items-center gap-1 rounded-md border bg-transparent px-2.5 text-xs font-medium transition-colors",
            (filters.assignees?.length ?? 0) > 0 && "border-primary text-primary",
          )}
        >
          Assignee
          {(filters.assignees?.length ?? 0) > 0 && (
            <span className="rounded-full bg-primary px-1 text-[10px] text-white">
              {filters.assignees!.length}
            </span>
          )}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {users.map((u) => (
            <DropdownMenuCheckboxItem
              key={u.id}
              checked={(filters.assignees ?? []).includes(u.id)}
              onCheckedChange={() => toggle("assignees", u.id)}
            >
              {u.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Labels filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border hover:bg-accent inline-flex h-7 items-center gap-1 rounded-md border bg-transparent px-2.5 text-xs font-medium transition-colors",
            (filters.labels?.length ?? 0) > 0 && "border-primary text-primary",
          )}
        >
          Labels
          {(filters.labels?.length ?? 0) > 0 && (
            <span className="rounded-full bg-primary px-1 text-[10px] text-white">
              {filters.labels!.length}
            </span>
          )}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {labels.map((lbl) => (
            <DropdownMenuCheckboxItem
              key={lbl.id}
              checked={(filters.labels ?? []).includes(lbl.id)}
              onCheckedChange={() => toggle("labels", lbl.id)}
            >
              <span
                className="mr-1 inline-block size-2 rounded-full"
                style={{ backgroundColor: lbl.color }}
              />
              {lbl.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear filters */}
      {activeCount > 0 && (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs transition-colors"
          onClick={() => onFiltersChange({})}
        >
          <X className="size-3" />
          Clear
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BoardColumnsProps {
  board: BoardSummary;
  onCardClick: (ticketId: string) => void;
}

export const BoardColumns = ({ board, onCardClick }: BoardColumnsProps) => {
  const moveTicketMutation = useMoveTicket();
  const { data: labels = [] } = useFetchLabels();
  const { data: users = [] } = useFetchUsers();

  const [activeFilters, setActiveFilters] = React.useState<TicketFilters>({});
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets({
    parent_id: board.id,
    parent_type: ["board"],
    ...activeFilters,
  });

  const labelMap = React.useMemo(() => {
    const map = new Map<string, Label>();
    labels.forEach((l) => map.set(l.id, l));
    return map;
  }, [labels]);

  // Columns from server data
  const serverColumns = React.useMemo(() => buildColumns(tickets), [tickets]);

  // Local override during drag (null = use server columns)
  const [dragColumns, setDragColumns] = React.useState<BoardColumnType[] | null>(null);
  const localColumns = dragColumns ?? serverColumns;

  const setLocalColumns = (
    updater: BoardColumnType[] | ((prev: BoardColumnType[]) => BoardColumnType[]),
  ) => {
    if (typeof updater === "function") {
      setDragColumns((prev) => updater(prev ?? serverColumns));
    } else {
      setDragColumns(updater);
    }
  };

  // Create ticket dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createInitialStatus, setCreateInitialStatus] = React.useState<TicketStatus>("backlog");

  const handleAddTicket = (status: TicketStatus) => {
    setCreateInitialStatus(status);
    setCreateDialogOpen(true);
  };

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const ticketMap = React.useMemo(() => {
    const map = new Map<string, TicketSummary>();
    for (const col of localColumns) {
      for (const t of col.tickets) {
        map.set(t.id, t);
      }
    }
    return map;
  }, [localColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findColumnByTicketId = (ticketId: string): BoardColumnType | undefined =>
    localColumns.find((col) => col.tickets.some((t) => t.id === ticketId));

  const moveTicketLocal = (
    ticketId: string,
    fromColumnId: string,
    toColumnId: string,
    newIndex: number,
  ) => {
    setLocalColumns((prev) => {
      const next = prev.map((col) => ({ ...col, tickets: [...col.tickets] }));
      const fromCol = next.find((c) => c.id === fromColumnId);
      const toCol = next.find((c) => c.id === toColumnId);
      if (!fromCol || !toCol) return prev;
      const ticketIdx = fromCol.tickets.findIndex((t) => t.id === ticketId);
      if (ticketIdx === -1) return prev;
      const [ticket] = fromCol.tickets.splice(ticketIdx, 1);
      const destColDef = COLUMN_DEFS.find((d) => `col_${d.status}` === toColumnId);
      if (destColDef) ticket.status = destColDef.status;
      toCol.tickets.splice(newIndex, 0, ticket);
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeTicketId = active.id as string;
    const overId = over.id as string;
    const fromColumn = findColumnByTicketId(activeTicketId);
    if (!fromColumn) return;

    let toColumn: BoardColumnType | undefined;
    let overIndex: number;

    const overIsColumn = localColumns.some((col) => col.id === overId);
    if (overIsColumn) {
      toColumn = localColumns.find((col) => col.id === overId);
      overIndex = toColumn ? toColumn.tickets.length : 0;
    } else {
      toColumn = findColumnByTicketId(overId);
      overIndex = toColumn ? toColumn.tickets.findIndex((t) => t.id === overId) : 0;
      if (overIndex === -1) overIndex = 0;
    }

    if (!toColumn || fromColumn.id === toColumn.id) return;
    moveTicketLocal(activeTicketId, fromColumn.id, toColumn.id, overIndex);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTicketId = active.id as string;
    const overId = over.id as string;
    const fromColumn = findColumnByTicketId(activeTicketId);
    if (!fromColumn) return;

    const overIsColumn = localColumns.some((col) => col.id === overId);
    if (overIsColumn) {
      const toColumn = localColumns.find((col) => col.id === overId);
      if (toColumn && fromColumn.id !== toColumn.id) {
        moveTicketLocal(activeTicketId, fromColumn.id, toColumn.id, toColumn.tickets.length);
      }
    } else {
      const toColumn = findColumnByTicketId(overId);
      if (!toColumn) return;
      const overIndex = toColumn.tickets.findIndex((t) => t.id === overId);
      if (fromColumn.id === toColumn.id) {
        const activeIndex = fromColumn.tickets.findIndex((t) => t.id === activeTicketId);
        if (activeIndex !== overIndex) {
          moveTicketLocal(activeTicketId, fromColumn.id, toColumn.id, overIndex);
        }
      }
    }

    const finalColumn = findColumnByTicketId(activeTicketId);
    if (finalColumn) {
      const ticketIndex = finalColumn.tickets.findIndex((t) => t.id === activeTicketId);
      moveTicketMutation.mutate(
        {
          ticket_id: activeTicketId,
          to_status: finalColumn.status,
          index: ticketIndex >= 0 ? ticketIndex : 0,
        },
        {
          onSuccess: () => setDragColumns(null),
          onError: () => setDragColumns(null),
        },
      );
    }
  };

  const activeTicket = activeId ? ticketMap.get(activeId) : undefined;

  return (
    <>
      <FilterBar
        filters={activeFilters}
        onFiltersChange={setActiveFilters}
        users={users}
        labels={labels}
      />
      <ScrollArea className="flex-1">
        {ticketsLoading ? (
          <div className="flex gap-4 pt-2 pb-4 animate-fade-in" style={{ minWidth: "fit-content" }}>
            {COLUMN_DEFS.map((col) => (
              <div key={col.status} className="w-[300px] shrink-0 space-y-3">
                <div className="flex items-center gap-2 px-1 py-2.5">
                  <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: col.color, opacity: 0.4 }} />
                  <div className="skeleton-shimmer h-3.5 w-20 rounded bg-muted" />
                  <div className="skeleton-shimmer size-5 rounded-full bg-muted" />
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="border-border bg-card space-y-2.5 rounded-xl border p-3">
                    <div className="skeleton-shimmer h-3.5 w-5 rounded bg-muted" />
                    <div className="skeleton-shimmer h-4 w-3/4 rounded bg-muted" />
                    <div className="skeleton-shimmer h-3 w-1/2 rounded bg-muted" />
                    <div className="flex gap-1">
                      <div className="skeleton-shimmer h-4 w-12 rounded-full bg-muted" />
                      <div className="skeleton-shimmer h-4 w-10 rounded-full bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 pt-2 pb-4" style={{ minWidth: "fit-content" }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {localColumns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  tickets={column.tickets}
                  labelMap={labelMap}
                  onCardClick={onCardClick}
                  onAddTicket={() => handleAddTicket(column.status)}
                />
              ))}

              <DragOverlay>
                {activeTicket ? (
                  <div className="w-[276px]">
                    <BoardCard ticket={activeTicket} labelMap={labelMap} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        users={users}
        labels={labels}
        boardId={board.id}
        initialStatus={createInitialStatus}
      />
    </>
  );
};
