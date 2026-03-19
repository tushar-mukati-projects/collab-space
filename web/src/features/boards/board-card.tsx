"use client";

import * as React from "react";
import { format } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarIcon,
  GripVertical,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Circle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFetchFavorites, useToggleFavorite } from "@/hooks/favorites";
import type { TicketSummary, TicketPriority, Label } from "@/types";

// ---------------------------------------------------------------------------
// Priority icon
// ---------------------------------------------------------------------------

const priorityConfig: Record<TicketPriority, { icon: React.ElementType; color: string }> = {
  urgent: { icon: AlertCircle, color: "text-red-500" },
  high: { icon: ArrowUp, color: "text-orange-500" },
  medium: { icon: Minus, color: "text-blue-500" },
  low: { icon: ArrowDown, color: "text-green-500" },
  none: { icon: Circle, color: "text-muted-foreground" },
};

const PriorityIcon = ({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) => {
  const cfg = priorityConfig[priority];
  const Icon = cfg.icon;
  return <Icon className={cn("size-4", cfg.color, className)} />;
};

// ---------------------------------------------------------------------------
// Board card
// ---------------------------------------------------------------------------

interface BoardCardProps {
  ticket: TicketSummary;
  labelMap?: Map<string, Label>;
  onCardClick?: (ticketId: string) => void;
}

export const BoardCard = ({ ticket, labelMap, onCardClick }: BoardCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: "card", ticket },
  });
  const { data: favorites = [] } = useFetchFavorites();
  const toggleFavorite = useToggleFavorite();

  const isFavorited = favorites.some((f) => f.ticket_id === ticket.id);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-drag-handle]") || target.closest("[data-fav-btn]")) return;
    onCardClick?.(ticket.id);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate(ticket.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group border-border bg-card relative cursor-pointer rounded-xl border p-3 transition-all duration-200",
        "hover:border-border/70 hover:shadow-md hover:-translate-y-0.5",
        isDragging && "ring-primary/20 opacity-50 shadow-lg ring-2 rotate-1",
      )}
      onClick={handleClick}
    >
      {/* Drag handle */}
      <button
        type="button"
        data-drag-handle
        className="absolute top-1/2 left-1 -translate-y-1/2 cursor-grab rounded-md p-0.5 opacity-0 transition-all duration-200 group-hover:opacity-60 hover:!opacity-100 hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="text-muted-foreground size-3.5" />
      </button>

      {/* Favorite star */}
      <button
        type="button"
        data-fav-btn
        onClick={handleToggleFav}
        className={cn(
          "absolute top-2 right-2 rounded-md p-0.5 transition-all duration-200",
          isFavorited
            ? "opacity-100 scale-100"
            : "opacity-0 scale-90 group-hover:opacity-60 group-hover:scale-100 hover:!opacity-100",
          toggleFavorite.isPending && "pointer-events-none animate-pulse",
        )}
      >
        <Star
          className={cn(
            "size-3.5 transition-colors",
            isFavorited ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
          )}
        />
      </button>

      <div className="space-y-2 pl-3">
        {/* Priority */}
        <div className="flex items-center gap-2">
          <PriorityIcon priority={ticket.priority} className="size-3.5" />
        </div>

        {/* Title */}
        <p className="line-clamp-2 text-sm leading-snug font-medium">{ticket.title}</p>

        {/* Colorful label pills */}
        {ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.labels.map((labelId) => {
              const label = labelMap?.get(labelId);
              if (!label) return null;
              return (
                <span
                  key={labelId}
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium transition-colors"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                  }}
                >
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Bottom row: due date */}
        <div className="flex items-center justify-between">
          {ticket.due_date ? (
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <CalendarIcon className="size-3" />
              {format(new Date(ticket.due_date), "MMM d")}
            </span>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
};
