"use client";

import * as React from "react";
import { format, setHours, setMinutes } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCreateMeeting } from "@/hooks/meetings";
import type { User } from "@/types";

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
}

// Generate time slots in 30-min intervals
const generateTimeSlots = (): { value: string; label: string }[] => {
  const slots: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      const minuteStr = m.toString().padStart(2, "0");
      const label = `${hour12}:${minuteStr} ${ampm}`;
      const value = `${h.toString().padStart(2, "0")}:${minuteStr}`;
      slots.push({ value, label });
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

export const ScheduleMeetingDialog = ({
  open,
  onOpenChange,
  users,
}: ScheduleMeetingDialogProps) => {
  const createMeetingMutation = useCreateMeeting();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = React.useState("10:00");
  const [endTime, setEndTime] = React.useState("11:00");
  const [selectedParticipants, setSelectedParticipants] = React.useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(undefined);
    setStartTime("10:00");
    setEndTime("11:00");
    setSelectedParticipants([]);
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const removeParticipant = (userId: string) => {
    setSelectedParticipants((prev) => prev.filter((id) => id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    try {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);

      const startDateTime = setMinutes(setHours(date, startH), startM);
      const endDateTime = setMinutes(setHours(date, endH), endM);

      await createMeetingMutation.mutateAsync({
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        participants: selectedParticipants,
        workspace_id: "ws_01",
      });

      resetForm();
      onOpenChange(false);
    } catch {
      // mutation error handled by React Query
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>Set up a new meeting with your team.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-title">Title</Label>
            <Input
              id="meeting-title"
              placeholder="Sprint Planning, Design Review..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-desc">Description</Label>
            <Textarea
              id="meeting-desc"
              placeholder="What is this meeting about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  />
                }
              >
                <CalendarIcon className="size-4" />
                {date ? format(date, "EEEE, MMMM d, yyyy") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Start Time</Label>
              <Select
                value={startTime}
                onValueChange={(val) => {
                  if (val) setStartTime(val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End Time</Label>
              <Select
                value={endTime}
                onValueChange={(val) => {
                  if (val) setEndTime(val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-1.5">
            <Label>Participants</Label>
            {/* Selected participants chips */}
            {selectedParticipants.length > 0 && (
              <div className="mb-1 flex flex-wrap gap-1.5">
                {selectedParticipants.map((id) => {
                  const user = users.find((u) => u.id === id);
                  if (!user) return null;
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1">
                      <Avatar size="sm" className="size-4">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-[8px]">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{user.name.split(" ")[0]}</span>
                      <button
                        type="button"
                        onClick={() => removeParticipant(id)}
                        className="hover:bg-muted-foreground/20 ml-0.5 rounded-full p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            {/* User list for selection */}
            <div className="border-input flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
              {users.map((user) => {
                const isSelected = selectedParticipants.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleParticipant(user.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted",
                    )}
                  >
                    <Avatar size="sm">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-muted-foreground text-xs">{user.email}</span>
                    </div>
                    {isSelected && <span className="text-primary ml-auto text-xs">Selected</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !date || createMeetingMutation.isPending}>
              {createMeetingMutation.isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
