"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFetchMeetings } from "@/hooks/meetings";
import { useFetchUsers } from "@/hooks/users";
import { MeetingList } from "./meeting-list";
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog";

export const MeetingView = () => {
  const router = useRouter();
  const { data: meetings = [], isLoading } = useFetchMeetings();
  const { data: users = [] } = useFetchUsers();

  const [scheduleDialogOpen, setScheduleDialogOpen] = React.useState(false);

  const handleJoinMeeting = (meetingId: string) => {
    router.push(`/meetings/${meetingId}`);
  };

  if (isLoading && meetings.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
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
