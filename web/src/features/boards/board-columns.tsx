"use client";

import * as React from "react";
import { useFetchLabels } from "@/hooks/labels";
import { useFetchUsers } from "@/hooks/users";
import { useTickets } from "@/hooks/tickets";
import { useFetchStatuses } from "@/hooks/statuses";
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
import { CreateTicketDialog } from "@/features/tickets/create-ticket-dialog";
import { Search, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ColumnDef = { status: TicketStatus; name: string; color: string };

const COLUMN_DEFS: ColumnDef[] = [
  { status: "backlog", name: "Backlog", color: "#6b7280" },
  { status: "todo", name: "Todo", color: "#3b82f6" },
  { status: "in-progress", name: "In Progress", color: "#f59e0b" },
  { status: "in-review", name: "In Review", color: "#8b5cf6" },
  { status: "done", name: "Done", color: "#10b981" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

const buildColumns = (tickets: TicketSummary[], defs: ColumnDef[]): BoardColumnType[] => {
  return defs.map((def, idx) => ({
    id: `col_${def.status}`,
    name: def.name,
    color: def.color,
    status: def.status,
    order: idx,
    tickets: tickets.filter((t) => t.status === def.status),
  }));
};

interface FilterBarProps {
  filters: TicketFilters;
  onFiltersChange: (f: TicketFilters) => void;
  users: { id: string; name: string }[];
  labels: Label[];
  statusOptions: { value: TicketStatus; label: string }[];
}

const FilterBar = ({ filters, onFiltersChange, users, labels, statusOptions }: FilterBarProps) => {
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
    <div className="flex flex-wrap items-center gap-2 py-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
        <input
          placeholder="Search tickets…"
          value={filters.search_term ?? ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search_term: e.target.value || undefined })
          }
          className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-background h-8 w-48 rounded-lg border pr-3 pl-9 text-sm transition-colors outline-none focus:ring-1 focus:ring-inset"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-lg border bg-transparent px-3 text-xs font-medium transition-colors",
            (filters.statuses?.length ?? 0) > 0 && "border-primary text-primary",
          )}
        >
          Status
          {(filters.statuses?.length ?? 0) > 0 && (
            <span className="bg-primary rounded-full px-1.5 text-[10px] font-semibold text-white">
              {filters.statuses!.length}
            </span>
          )}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          {statusOptions.map((opt) => (
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

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-lg border bg-transparent px-3 text-xs font-medium transition-colors",
            (filters.priorities?.length ?? 0) > 0 && "border-primary text-primary",
          )}
        >
          Priority
          {(filters.priorities?.length ?? 0) > 0 && (
            <span className="bg-primary rounded-full px-1.5 text-[10px] font-semibold text-white">
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

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-lg border bg-transparent px-3 text-xs font-medium transition-colors",
            (filters.assignees?.length ?? 0) > 0 && "border-primary text-primary",
          )}
        >
          Assignee
          {(filters.assignees?.length ?? 0) > 0 && (
            <span className="bg-primary rounded-full px-1.5 text-[10px] font-semibold text-white">
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

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-lg border bg-transparent px-3 text-xs font-medium transition-colors",
            (filters.labels?.length ?? 0) > 0 && "border-primary text-primary",
          )}
        >
          Labels
          {(filters.labels?.length ?? 0) > 0 && (
            <span className="bg-primary rounded-full px-1.5 text-[10px] font-semibold text-white">
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

      {activeCount > 0 && (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs transition-colors"
          onClick={() => onFiltersChange({})}
        >
          <X className="size-3" />
          Clear
        </button>
      )}
    </div>
  );
};

interface BoardColumnsProps {
  board: BoardSummary;
  onCardClick: (ticketId: string) => void;
}

export const BoardColumns = ({ board, onCardClick }: BoardColumnsProps) => {
  const { data: labels = [] } = useFetchLabels();
  const { data: users = [] } = useFetchUsers();
  const { data: statusDefs = [] } = useFetchStatuses();

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

  const columnDefs = React.useMemo<ColumnDef[]>(
    () =>
      statusDefs.length > 0
        ? [...statusDefs]
            .sort((a, b) => a.order - b.order)
            .map((s) => ({ status: s.value, name: s.name, color: s.color }))
        : COLUMN_DEFS,
    [statusDefs],
  );
  const statusOptions = React.useMemo(
    () => columnDefs.map((d) => ({ value: d.status, label: d.name })),
    [columnDefs],
  );

  const columns = React.useMemo(() => buildColumns(tickets, columnDefs), [tickets, columnDefs]);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createInitialStatus, setCreateInitialStatus] = React.useState<TicketStatus>("backlog");

  const handleAddTicket = (status: TicketStatus) => {
    setCreateInitialStatus(status);
    setCreateDialogOpen(true);
  };

  return (
    <>
      <FilterBar
        filters={activeFilters}
        onFiltersChange={setActiveFilters}
        users={users}
        labels={labels}
        statusOptions={statusOptions}
      />
      <ScrollArea className="flex-1">
        {ticketsLoading ? (
          <div className="animate-fade-in flex gap-4 pt-2 pb-4" style={{ minWidth: "fit-content" }}>
            {COLUMN_DEFS.map((col) => (
              <div key={col.status} className="w-[300px] shrink-0 space-y-3">
                <div className="flex items-center gap-2 px-1 py-2.5">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: col.color, opacity: 0.4 }}
                  />
                  <div className="skeleton-shimmer bg-muted h-3.5 w-20 rounded" />
                  <div className="skeleton-shimmer bg-muted size-5 rounded-full" />
                </div>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="border-border bg-card space-y-3 rounded-xl border p-3.5 shadow-sm"
                  >
                    <div className="skeleton-shimmer bg-muted h-3.5 w-6 rounded" />
                    <div className="skeleton-shimmer bg-muted h-4 w-4/5 rounded" />
                    <div className="skeleton-shimmer bg-muted h-3.5 w-1/2 rounded" />
                    <div className="flex gap-1.5">
                      <div className="skeleton-shimmer bg-muted h-5 w-14 rounded-full" />
                      <div className="skeleton-shimmer bg-muted h-5 w-12 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 pt-2 pb-4" style={{ minWidth: "fit-content" }}>
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                tickets={column.tickets}
                labelMap={labelMap}
                onCardClick={onCardClick}
                onAddTicket={() => handleAddTicket(column.status)}
              />
            ))}
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
