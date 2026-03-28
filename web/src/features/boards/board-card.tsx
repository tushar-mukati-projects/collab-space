"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle, ArrowUp, ArrowDown, Minus, Circle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFetchFavorites, useToggleFavorite } from "@/hooks/favorites";
import type { TicketSummary, TicketPriority, Label } from "@/types";

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

interface BoardCardProps {
  ticket: TicketSummary;
  labelMap?: Map<string, Label>;
  onCardClick?: (ticketId: string) => void;
}

export const BoardCard = ({ ticket, labelMap, onCardClick }: BoardCardProps) => {
  const { data: favorites = [] } = useFetchFavorites();
  const toggleFavorite = useToggleFavorite();
  const isFavorited = favorites.some((f) => f.ticket_id === ticket.id);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-fav-btn]")) return;
    onCardClick?.(ticket.id);
  };

  return (
    <div
      className={cn(
        "group border-border bg-card relative cursor-pointer rounded-xl border p-3.5 shadow-sm transition-all duration-200",
        "hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md",
      )}
      onClick={handleClick}
    >
      <button
        type="button"
        data-fav-btn
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite.mutate(ticket.id);
        }}
        className={cn(
          "absolute top-2.5 right-2.5 rounded-md p-1 transition-all duration-200",
          isFavorited
            ? "scale-100 opacity-100"
            : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-50 hover:!opacity-100",
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

      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={ticket.priority} className="size-3.5" />
          {ticket.sub_ticket_count > 0 && (
            <span className="text-muted-foreground text-[10px] font-medium">
              {ticket.sub_ticket_count} sub
            </span>
          )}
        </div>

        <p className="line-clamp-2 pr-5 text-[13px] leading-snug font-medium">{ticket.title}</p>

        {ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ticket.labels.map((labelId) => {
              const label = labelMap?.get(labelId);
              if (!label) return null;
              return (
                <span
                  key={labelId}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${label.color}18`,
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

        {ticket.due_date && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <CalendarIcon className="size-3" />
            {format(new Date(ticket.due_date), "MMM d")}
          </div>
        )}
      </div>
    </div>
  );
};
