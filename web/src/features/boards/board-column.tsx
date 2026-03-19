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
      <div className="flex items-center justify-between rounded-t-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="text-sm font-semibold">{column.name}</span>
          <span className="bg-muted text-muted-foreground flex size-5 items-center justify-center rounded-full text-[11px] font-medium">
            {tickets.length}
          </span>
        </div>
        {onAddTicket && (
          <button
            type="button"
            onClick={onAddTicket}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-0.5 transition-colors"
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
          "flex flex-1 flex-col gap-2 overflow-y-auto rounded-b-xl px-2 pt-1 pb-2 transition-colors",
          isOver && "bg-primary/5 ring-primary/20 rounded-xl ring-2 ring-inset",
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
          <div className="border-border flex flex-1 items-center justify-center rounded-lg border border-dashed py-8">
            <span className="text-muted-foreground text-xs">No tickets</span>
          </div>
        )}
      </div>
    </div>
  );
};
