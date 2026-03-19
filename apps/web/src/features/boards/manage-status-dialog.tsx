"use client";

import * as React from "react";
import { Pencil, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetchStatuses, useUpdateStatus } from "@/hooks/statuses";
import type { StatusDefinition } from "@/types";

interface EditRowProps {
  status: StatusDefinition;
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
}

const EditRow = ({ status, onSave, onCancel }: EditRowProps) => {
  const [name, setName] = React.useState(status.name);
  const [color, setColor] = React.useState(status.color);

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="size-7 cursor-pointer rounded border p-0.5"
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-7 flex-1 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(name, color);
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        onClick={() => onSave(name, color)}
        disabled={!name.trim()}
      >
        <Check className="size-3.5 text-green-500" />
      </Button>
      <Button size="icon" variant="ghost" className="size-7" onClick={onCancel}>
        <X className="text-muted-foreground size-3.5" />
      </Button>
    </div>
  );
};

interface ManageStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageStatusDialog = ({ open, onOpenChange }: ManageStatusDialogProps) => {
  const { data: statuses = [] } = useFetchStatuses();
  const updateStatus = useUpdateStatus();
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const handleSave = (id: string, name: string, color: string) => {
    if (!name.trim()) return;
    updateStatus.mutate({ id, data: { name, color } });
    setEditingId(null);
  };

  const sorted = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Statuses</DialogTitle>
          <DialogDescription>Customize the name and color of each ticket status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {sorted.map((status) =>
            editingId === status.id ? (
              <EditRow
                key={status.id}
                status={status}
                onSave={(name, color) => handleSave(status.id, name, color)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={status.id}
                className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-1 py-1.5"
              >
                <span
                  className="inline-block size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="flex-1 text-sm font-medium">{status.name}</span>
                <span className="text-muted-foreground font-mono text-xs">{status.value}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setEditingId(status.id)}
                >
                  <Pencil className="text-muted-foreground size-3.5" />
                </Button>
              </div>
            ),
          )}
        </div>

        <p className="text-muted-foreground mt-2 text-xs">
          Status values are fixed. You can rename them and change their color.
        </p>
      </DialogContent>
    </Dialog>
  );
};
