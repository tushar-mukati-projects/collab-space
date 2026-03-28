"use client";

import { Plus, LayoutList } from "lucide-react";
import { BoardCard } from "./board-card";
import type { TicketSummary, BoardColumn as BoardColumnType, Label } from "@/types";

interface BoardColumnProps {
  column: BoardColumnType;
  tickets: TicketSummary[];
  labelMap?: Map<string, Label>;
  onCardClick?: (ticketId: string) => void;
  onAddTicket?: () => void;
}

export const BoardColumn = ({
  column,
  tickets,
  labelMap,
  onCardClick,
  onAddTicket,
}: BoardColumnProps) => {
  return (
    <div className="flex h-full w-[300px] min-w-[300px] flex-col rounded-xl">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block size-2.5 rounded-full shadow-sm"
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
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-all duration-200"
            title="Add ticket"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-2 pt-0.5 pb-3">
        {tickets.map((ticket) => (
          <BoardCard
            key={ticket.id}
            ticket={ticket}
            labelMap={labelMap}
            onCardClick={onCardClick}
          />
        ))}

        {tickets.length === 0 && (
          <div className="border-border/60 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 transition-colors">
            <LayoutList className="text-muted-foreground/40 size-5" />
            <span className="text-muted-foreground/50 text-xs">No tickets</span>
          </div>
        )}
      </div>
    </div>
  );
};
