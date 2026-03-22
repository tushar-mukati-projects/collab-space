"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFetchMeetings } from "@/hooks/meetings";
import { useFetchUsers } from "@/hooks/users";
import { MeetingList } from "./meeting-list";
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog";

const MeetingSkeleton = () => (
  <div className="h-full overflow-y-auto">
    <div className="animate-fade-in mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer bg-muted h-8 w-28 rounded-lg" />
          <div className="skeleton-shimmer bg-muted h-6 w-8 rounded-md" />
        </div>
        <div className="skeleton-shimmer bg-muted h-8 w-36 rounded-lg" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-border bg-card rounded-xl border p-4">
            <div className="flex items-center gap-4">
              <div className="skeleton-shimmer bg-muted size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer bg-muted h-4 w-48 rounded" />
                <div className="skeleton-shimmer bg-muted h-3 w-36 rounded" />
              </div>
              <div className="skeleton-shimmer bg-muted h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const MeetingView = () => {
  const router = useRouter();
  const { data: meetings = [], isLoading } = useFetchMeetings();
  const { data: users = [] } = useFetchUsers();

  const [scheduleDialogOpen, setScheduleDialogOpen] = React.useState(false);

  const handleJoinMeeting = (meetingId: string) => {
    router.push(`/meetings/${meetingId}`);
  };

  if (isLoading && meetings.length === 0) {
    return <MeetingSkeleton />;
  }

  return (
    <>
      <MeetingList
        meetings={meetings}
        users={users}
        onJoinMeeting={handleJoinMeeting}
        onScheduleClick={() => setScheduleDialogOpen(true)}
      />
      <ScheduleMeetingDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        users={users}
      />
    </>
  );
};
