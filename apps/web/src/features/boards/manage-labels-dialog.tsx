"use client";

import * as React from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetchLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from "@/hooks/labels";
import type { Label } from "@/types";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#0ea5e9",
];

interface EditRowProps {
  label: Label;
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
}

const EditRow = ({ label, onSave, onCancel }: EditRowProps) => {
  const [name, setName] = React.useState(label.name);
  const [color, setColor] = React.useState(label.color);

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

interface ManageLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageLabelsDialog = ({ open, onOpenChange }: ManageLabelsDialogProps) => {
  const { data: labels = [] } = useFetchLabels();
  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState(PRESET_COLORS[0]);

  const handleSaveEdit = (id: string, name: string, color: string) => {
    if (!name.trim()) return;
    updateLabel.mutate({ id, data: { name, color } });
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createLabel.mutate({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
    setAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
          <DialogDescription>Create, edit, or delete ticket labels.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {labels.map((label) =>
            editingId === label.id ? (
              <EditRow
                key={label.id}
                label={label}
                onSave={(name, color) => handleSaveEdit(label.id, name, color)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={label.id}
                className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-1 py-1.5"
              >
                <span
                  className="inline-block size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="flex-1 text-sm">{label.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setEditingId(label.id)}
                >
                  <Pencil className="text-muted-foreground size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => deleteLabel.mutate(label.id)}
                >
                  <Trash2 className="text-destructive size-3.5" />
                </Button>
              </div>
            ),
          )}
        </div>

        {adding ? (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="size-7 cursor-pointer rounded border p-0.5"
            />
            <Input
              placeholder="Label name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-7 flex-1 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={handleCreate}
              disabled={!newName.trim()}
            >
              <Check className="size-3.5 text-green-500" />
            </Button>
            <Button size="icon" variant="ghost" className="size-7" onClick={() => setAdding(false)}>
              <X className="text-muted-foreground size-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-1.5"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-4" />
            Add label
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
