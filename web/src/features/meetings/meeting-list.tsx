"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Plus, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import type { Meeting, User } from "@/types";

interface MeetingListProps {
  meetings: Meeting[];
  users: User[];
  onJoinMeeting: (meetingId: string) => void;
  onScheduleClick: () => void;
}

const formatMeetingTime = (start_time: string, end_time: string): string => {
  const start = parseISO(start_time);
  const end = parseISO(end_time);
  const datePart = format(start, "EEE, MMM d");
  const startTimePart = format(start, "h:mm a");
  const endTimePart = format(end, "h:mm a");
  return `${datePart} \u00b7 ${startTimePart} - ${endTimePart}`;
};

const StatusBadge = ({ status }: { status: Meeting["status"] }) => {
  if (status === "live") {
    return (
      <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Live
      </Badge>
    );
  }
  if (status === "scheduled") {
    return (
      <Badge className="bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
        Scheduled
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Ended
    </Badge>
  );
};

interface MeetingCardProps {
  meeting: Meeting;
  users: User[];
  onJoin: () => void;
  index: number;
}

const MeetingCard = ({ meeting, users, onJoin, index }: MeetingCardProps) => {
  const participants = meeting.participants
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as User[];

  const visibleParticipants = participants.slice(0, 3);
  const overflowCount = participants.length - 3;

  return (
    <div
      className="group border-border bg-card hover:bg-accent/30 animate-fade-in flex items-center justify-between rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-1 items-center gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            meeting.status === "live"
              ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              : meeting.status === "scheduled"
                ? "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                : "bg-muted text-muted-foreground",
          )}
        >
          <Video className="size-5" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{meeting.title}</span>
            <StatusBadge status={meeting.status} />
          </div>
          <span className="text-muted-foreground text-xs">
            {formatMeetingTime(meeting.start_time, meeting.end_time)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <AvatarGroup>
          {visibleParticipants.map((user) => (
            <Avatar key={user.id} size="sm">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflowCount > 0 && <AvatarGroupCount>+{overflowCount}</AvatarGroupCount>}
        </AvatarGroup>
        {meeting.status !== "ended" && (
          <Button size="sm" onClick={onJoin} className="transition-all hover:scale-105">
            Join
          </Button>
        )}
      </div>
    </div>
  );
};

export const MeetingList = ({
  meetings,
  users,
  onJoinMeeting,
  onScheduleClick,
}: MeetingListProps) => {
  const upcomingMeetings = meetings
    .filter((m) => m.status === "live" || m.status === "scheduled")
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

  const pastMeetings = meetings
    .filter((m) => m.status === "ended")
    .sort((a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime());

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="animate-fade-in mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
            <span className="bg-muted text-muted-foreground rounded-lg px-2 py-0.5 text-xs font-medium">
              {meetings.length}
            </span>
          </div>
          <Button size="sm" onClick={onScheduleClick}>
            <Plus className="size-4" />
            Schedule Meeting
          </Button>
        </div>

        {upcomingMeetings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Upcoming Meetings
            </h3>
            <div className="flex flex-col gap-2">
              {upcomingMeetings.map((meeting, i) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  users={users}
                  onJoin={() => onJoinMeeting(meeting.id)}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {pastMeetings.length > 0 && (
          <div>
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Past Meetings
            </h3>
            <div className="flex flex-col gap-2">
              {pastMeetings.map((meeting, i) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  users={users}
                  onJoin={() => onJoinMeeting(meeting.id)}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {meetings.length === 0 && (
          <div className="animate-fade-in flex h-64 flex-col items-center justify-center gap-3 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Video className="text-muted-foreground size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">No meetings yet</p>
              <p className="text-muted-foreground text-xs">
                Schedule your first meeting to get started.
              </p>
            </div>
            <Button size="sm" onClick={onScheduleClick}>
              <Plus className="size-4" />
              Schedule Meeting
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
