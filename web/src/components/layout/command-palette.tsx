"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { useTickets } from "@/hooks/tickets";
import { useFetchUsers } from "@/hooks/users";
import { useFetchLabels } from "@/hooks/labels";
import { cn } from "@/lib/utils";
import {
  Columns3,
  Video,
  Settings,
  TicketPlus,
  CalendarPlus,
  SlidersHorizontal,
  Circle,
  Clock,
  Eye,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  X,
  Ticket,
} from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { TicketStatus, TicketPriority, TicketFilters } from "@/types";

const statusOpts: { value: TicketStatus; label: string; icon: React.ElementType; color: string }[] =
  [
    { value: "backlog", label: "Backlog", icon: CircleDashed, color: "text-muted-foreground" },
    { value: "todo", label: "Todo", icon: Circle, color: "text-foreground" },
    { value: "in-progress", label: "In Progress", icon: Clock, color: "text-yellow-500" },
    { value: "in-review", label: "In Review", icon: Eye, color: "text-blue-500" },
    { value: "done", label: "Done", icon: CheckCircle2, color: "text-green-500" },
  ];

const priorityOpts: {
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

const statusDot: Record<string, string> = {
  backlog: "bg-gray-400",
  todo: "bg-blue-400",
  "in-progress": "bg-yellow-400",
  "in-review": "bg-purple-400",
  done: "bg-green-500",
};

const navigationEntries = [
  { label: "Go to Board", path: "/boards", icon: Columns3 },
  { label: "Go to Meetings", path: "/meetings", icon: Video },
  { label: "Go to Settings", path: "/settings", icon: Settings },
];

const actionEntries = [
  { label: "Create Ticket", icon: TicketPlus, shortcut: "T" },
  { label: "Schedule Meeting", icon: CalendarPlus, shortcut: "M" },
];

export const CommandPalette = () => {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [statuses, setStatuses] = React.useState<TicketStatus[]>([]);
  const [priorities, setPriorities] = React.useState<TicketPriority[]>([]);
  const [assignees, setAssignees] = React.useState<string[]>([]);
  const [labelIds, setLabelIds] = React.useState<string[]>([]);

  const { data: users = [] } = useFetchUsers();
  const { data: labels = [] } = useFetchLabels();

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setFiltersOpen(false);
      setStatuses([]);
      setPriorities([]);
      setAssignees([]);
      setLabelIds([]);
    }
  }, [open]);

  const hasFilters =
    statuses.length > 0 || priorities.length > 0 || assignees.length > 0 || labelIds.length > 0;
  const activeFilterCount =
    (statuses.length > 0 ? 1 : 0) +
    (priorities.length > 0 ? 1 : 0) +
    (assignees.length > 0 ? 1 : 0) +
    (labelIds.length > 0 ? 1 : 0);
  const shouldSearch = !!debouncedSearch || hasFilters;

  const ticketFilters: TicketFilters | undefined = shouldSearch
    ? {
        ...(debouncedSearch ? { search_term: debouncedSearch } : {}),
        ...(statuses.length > 0 ? { statuses } : {}),
        ...(priorities.length > 0 ? { priorities } : {}),
        ...(assignees.length > 0 ? { assignees } : {}),
        ...(labelIds.length > 0 ? { labels: labelIds } : {}),
      }
    : undefined;

  const { data: tickets = [] } = useTickets(ticketFilters);

  const clearFilters = () => {
    setStatuses([]);
    setPriorities([]);
    setAssignees([]);
    setLabelIds([]);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    toggleCommandPalette();
  };

  const handleSelectTicket = (ticketId: string) => {
    router.push(`/ticket/${ticketId}`);
    toggleCommandPalette();
  };

  const handleAction = () => {
    toggleCommandPalette();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={toggleCommandPalette}
      title="Search"
      description="Search tickets, navigate, or run commands"
      className="sm:max-w-xl"
    >
      <Command>
        <div className="flex items-center gap-1 px-2 pt-2">
          <div className="flex-1">
            <CommandInput
              placeholder="Search tickets or type a command..."
              value={search}
              onValueChange={setSearch}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              filtersOpen || hasFilters
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
            title="Toggle filters"
          >
            <SlidersHorizontal className="size-4" />
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full text-[8px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="border-border flex flex-wrap items-center gap-1.5 border-t px-3 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  statuses.length > 0
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                Status
                {statuses.length > 0 && (
                  <span className="bg-primary/15 rounded px-1 text-[10px]">{statuses.length}</span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {statusOpts.map((opt) => {
                  const Icon = opt.icon;
                  const checked = statuses.includes(opt.value);
                  return (
                    <DropdownMenuItem
                      key={opt.value}
                      onSelect={(e) => {
                        e.preventDefault();
                        setStatuses((prev) =>
                          checked ? prev.filter((s) => s !== opt.value) : [...prev, opt.value],
                        );
                      }}
                    >
                      <Checkbox checked={checked} className="pointer-events-none size-3.5" />
                      <Icon className={cn("size-3.5", opt.color)} />
                      {opt.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  priorities.length > 0
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                Priority
                {priorities.length > 0 && (
                  <span className="bg-primary/15 rounded px-1 text-[10px]">
                    {priorities.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {priorityOpts.map((opt) => {
                  const Icon = opt.icon;
                  const checked = priorities.includes(opt.value);
                  return (
                    <DropdownMenuItem
                      key={opt.value}
                      onSelect={(e) => {
                        e.preventDefault();
                        setPriorities((prev) =>
                          checked ? prev.filter((p) => p !== opt.value) : [...prev, opt.value],
                        );
                      }}
                    >
                      <Checkbox checked={checked} className="pointer-events-none size-3.5" />
                      <Icon className={cn("size-3.5", opt.color)} />
                      {opt.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  assignees.length > 0
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                Assignee
                {assignees.length > 0 && (
                  <span className="bg-primary/15 rounded px-1 text-[10px]">{assignees.length}</span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {users.map((u) => {
                  const checked = assignees.includes(u.id);
                  return (
                    <DropdownMenuItem
                      key={u.id}
                      onSelect={(e) => {
                        e.preventDefault();
                        setAssignees((prev) =>
                          checked ? prev.filter((a) => a !== u.id) : [...prev, u.id],
                        );
                      }}
                    >
                      <Checkbox checked={checked} className="pointer-events-none size-3.5" />
                      {u.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                      labelIds.length > 0
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  />
                }
              >
                Labels
                {labelIds.length > 0 && (
                  <span className="bg-primary/15 rounded px-1 text-[10px]">{labelIds.length}</span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" align="start">
                {labels.map((lbl) => {
                  const checked = labelIds.includes(lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() =>
                        setLabelIds((prev) =>
                          checked ? prev.filter((l) => l !== lbl.id) : [...prev, lbl.id],
                        )
                      }
                      className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                    >
                      <Checkbox checked={checked} className="pointer-events-none size-3.5" />
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: lbl.color }}
                      />
                      {lbl.name}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1 text-xs transition-colors"
              >
                <X className="size-3" />
                Clear
              </button>
            )}
          </div>
        )}

        <CommandList className={cn(shouldSearch && "max-h-80")}>
          {shouldSearch && (
            <>
              {tickets.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center py-8 text-sm">
                  <Ticket className="mb-2 size-6 opacity-40" />
                  <p>No tickets found</p>
                </div>
              ) : (
                <CommandGroup heading={`Tickets (${tickets.length})`}>
                  {tickets.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={`ticket:${t.id}:${t.title}`}
                      onSelect={() => handleSelectTicket(t.id)}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          statusDot[t.status] ?? "bg-gray-400",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      <span className="text-muted-foreground shrink-0 text-[10px] uppercase">
                        {t.id}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
            </>
          )}

          {!shouldSearch && <CommandEmpty>Type to search tickets...</CommandEmpty>}

          <CommandGroup heading="Navigation">
            {navigationEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <CommandItem key={entry.path} onSelect={() => handleNavigate(entry.path)}>
                  <Icon className="size-4 text-zinc-400" />
                  <span>{entry.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            {actionEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <CommandItem key={entry.label} onSelect={() => handleAction()}>
                  <Icon className="size-4 text-zinc-400" />
                  <span>{entry.label}</span>
                  {entry.shortcut && <CommandShortcut>{entry.shortcut}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
