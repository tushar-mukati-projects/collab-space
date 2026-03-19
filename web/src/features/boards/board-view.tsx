"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFetchBoards, useCreateBoard, useDeleteBoard } from "@/hooks/board";
import { BoardColumns } from "./board-columns";
import { ManageLabelsDialog } from "./manage-labels-dialog";
import { ManageStatusDialog } from "./manage-status-dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Loader2, Tag, CircleDot, Trash2 } from "lucide-react";

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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Boards</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStatusDialogOpen(true)}
            className="gap-1.5"
          >
            <CircleDot className="size-3.5" />
            Manage Status
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLabelsDialogOpen(true)}
            className="gap-1.5"
          >
            <Tag className="size-3.5" />
            Manage Labels
          </Button>
          <Button size="sm" onClick={() => setShowCreateInput(true)}>
            <Plus className="size-4" />
            New Board
          </Button>
        </div>
      </div>

      {showCreateInput && (
        <div className="mb-4 flex items-center gap-2">
          <input
            className="bg-background focus:ring-ring rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2"
            placeholder="Board name..."
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateBoard} disabled={createBoardMutation.isPending}>
            Create
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
        {boards?.map((board) => (
          <div key={board.id} className="bg-card rounded-lg border">
            <div className="flex items-center">
              <button
                className="hover:bg-muted/50 flex flex-1 items-center justify-between px-4 py-3 text-left transition-colors"
                onClick={() => toggleBoard(board.id)}
              >
                <div className="flex items-center gap-3">
                  {effectiveOpenId === board.id ? (
                    <ChevronDown className="text-muted-foreground size-4" />
                  ) : (
                    <ChevronRight className="text-muted-foreground size-4" />
                  )}
                  <span className="font-medium">{board.name}</span>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    {board.ticket_counts.total} tickets
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <span>{board.ticket_counts.in_progress} in progress</span>
                  <span>{board.ticket_counts.done} done</span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete board "${board.name}"?`)) {
                    deleteBoardMutation.mutate(board.id);
                  }
                }}
                className="text-muted-foreground hover:text-destructive hover:bg-accent mr-2 inline-flex items-center justify-center rounded-md p-2 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {effectiveOpenId === board.id && (
              <div className="border-t px-4 pt-2 pb-4">
                <BoardColumns
                  board={board}
                  onCardClick={(ticketId) => router.push(`/ticket/${ticketId}`)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <ManageLabelsDialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen} />
      <ManageStatusDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen} />
    </div>
  );
};
