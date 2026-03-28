"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFetchBoards, useCreateBoard, useDeleteBoard } from "@/hooks/board";
import { BoardColumns } from "./board-columns";
import { ManageLabelsDialog } from "./manage-labels-dialog";
import { ManageStatusDialog } from "./manage-status-dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, Loader2, Tag, CircleDot, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission, PERMISSION_LABEL } from "@/hooks/usePermission";

const BoardSkeleton = () => (
  <div className="animate-fade-in space-y-2">
    {[1, 2].map((i) => (
      <div key={i} className="border-border bg-card rounded-xl border">
        <div className="flex items-center px-4 py-3.5">
          <div className="flex flex-1 items-center gap-3">
            <div className="skeleton-shimmer bg-muted h-4 w-4 rounded" />
            <div className="skeleton-shimmer bg-muted h-4 w-32 rounded" />
            <div className="skeleton-shimmer bg-muted h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer bg-muted h-3 w-20 rounded" />
            <div className="skeleton-shimmer bg-muted h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const BoardView = () => {
  const router = useRouter();
  const { data: boards, isLoading } = useFetchBoards();
  const [openBoardId, setOpenBoardId] = useState<string | null>(null);
  const createBoardMutation = useCreateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const canCreateBoard = usePermission("board:create");
  const canDeleteBoard = usePermission("board:delete");
  const canManageLabels = usePermission("label:manage");
  const canManageSettings = usePermission("settings:manage");

  const effectiveOpenId = openBoardId ?? boards?.[0]?.id ?? null;

  const toggleBoard = (boardId: string) => {
    setOpenBoardId(effectiveOpenId === boardId ? null : boardId);
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    await createBoardMutation.mutateAsync({ name: newBoardName.trim() });
    setNewBoardName("");
    setShowCreateInput(false);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="skeleton-shimmer bg-muted h-8 w-24 rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton-shimmer bg-muted h-8 w-28 rounded-lg" />
            <div className="skeleton-shimmer bg-muted h-8 w-28 rounded-lg" />
            <div className="skeleton-shimmer bg-muted h-8 w-24 rounded-lg" />
          </div>
        </div>
        <BoardSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="animate-fade-in mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Boards</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => canManageSettings && setStatusDialogOpen(true)}
            disabled={!canManageSettings}
            title={
              !canManageSettings ? `Requires: ${PERMISSION_LABEL["settings:manage"]}` : undefined
            }
            className="gap-1.5"
          >
            <CircleDot className="size-3.5" />
            Manage Status
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => canManageLabels && setLabelsDialogOpen(true)}
            disabled={!canManageLabels}
            title={!canManageLabels ? `Requires: ${PERMISSION_LABEL["label:manage"]}` : undefined}
            className="gap-1.5"
          >
            <Tag className="size-3.5" />
            Manage Labels
          </Button>
          <Button
            size="sm"
            onClick={() => canCreateBoard && setShowCreateInput(true)}
            disabled={!canCreateBoard}
            title={!canCreateBoard ? `Requires: ${PERMISSION_LABEL["board:create"]}` : undefined}
          >
            <Plus className="size-4" />
            New Board
          </Button>
        </div>
      </div>

      {showCreateInput && (
        <div className="animate-fade-in mb-4 flex items-center gap-2">
          <input
            className="bg-background focus:ring-ring/30 focus:border-primary rounded-lg border px-3 py-1.5 text-sm transition-all outline-none focus:ring-2"
            placeholder="Board name..."
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateBoard} disabled={createBoardMutation.isPending}>
            {createBoardMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowCreateInput(false);
              setNewBoardName("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {boards?.map((board, index) => (
          <div
            key={board.id}
            className="bg-card border-border hover:border-border/80 animate-fade-in rounded-xl border transition-all duration-200 hover:shadow-sm"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center">
              <button
                className="hover:bg-muted/50 flex flex-1 items-center justify-between rounded-l-xl px-4 py-3.5 text-left transition-colors"
                onClick={() => toggleBoard(board.id)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "transition-transform duration-200",
                      effectiveOpenId === board.id && "rotate-90",
                    )}
                  >
                    <ChevronRight className="text-muted-foreground size-4" />
                  </span>
                  <span className="font-semibold">{board.name}</span>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                    {board.ticket_counts.total} tickets
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-yellow-400" />
                    {board.ticket_counts.in_progress} in progress
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-green-500" />
                    {board.ticket_counts.done} done
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canDeleteBoard && confirm(`Delete board "${board.name}"?`)) {
                    deleteBoardMutation.mutate(board.id);
                  }
                }}
                disabled={!canDeleteBoard || deleteBoardMutation.isPending}
                title={
                  !canDeleteBoard ? `Requires: ${PERMISSION_LABEL["board:delete"]}` : undefined
                }
                className={cn(
                  "text-muted-foreground mr-2 inline-flex items-center justify-center rounded-lg p-2 transition-all",
                  canDeleteBoard
                    ? "hover:text-destructive hover:bg-destructive/8"
                    : "cursor-not-allowed opacity-40",
                  deleteBoardMutation.isPending && "pointer-events-none opacity-50",
                )}
              >
                {deleteBoardMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </div>

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                effectiveOpenId === board.id
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t px-4 pt-2 pb-4">
                  <BoardColumns
                    board={board}
                    onCardClick={(ticketId) => router.push(`/ticket/${ticketId}`)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ManageLabelsDialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen} />
      <ManageStatusDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen} />
    </div>
  );
};
