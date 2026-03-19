"use client";

import { Plus } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { BoardCard } from "./board-card";
import type { TicketSummary, BoardColumn as BoardColumnType, Label } from "@/types";

interface BoardColumnProps {
  column: BoardColumnType;
  tickets: TicketSummary[];
  labelMap?: Map<string, Label>;
  onCardClick?: (ticketId: string) => void;
  onAddTicket?: () => void;
  isOverlay?: boolean;
}

export const BoardColumn = ({
  column,
  tickets,
  labelMap,
  onCardClick,
  onAddTicket,
  isOverlay,
}: BoardColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  return (
    <div
      className={cn(
        "flex h-full w-[300px] min-w-[300px] flex-col rounded-xl",
        isOverlay && "opacity-80",
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between rounded-t-xl px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-full ring-2 ring-background"
            style={{ backgroundColor: column.color }}
          />
          <span className="text-sm font-semibold tracking-tight">{column.name}</span>
          <span className="bg-muted text-muted-foreground flex size-5 items-center justify-center rounded-full text-[11px] font-semibold">
            {tickets.length}
          </span>
        </div>
        {onAddTicket && (
          <button
            type="button"
            onClick={onAddTicket}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1 transition-all duration-200 hover:scale-105"
            title="Add ticket"
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      {/* Droppable card area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto rounded-b-xl px-2 pt-1 pb-2 transition-all duration-200",
          isOver && "bg-primary/5 ring-primary/20 rounded-xl ring-2 ring-inset scale-[1.01]",
        )}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <BoardCard
              key={ticket.id}
              ticket={ticket}
              labelMap={labelMap}
              onCardClick={onCardClick}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tickets.length === 0 && (
          <div className="border-border flex flex-1 items-center justify-center rounded-xl border border-dashed py-8 transition-colors">
            <span className="text-muted-foreground/60 text-xs">No tickets</span>
          </div>
        )}
      </div>
    </div>
  );
};
