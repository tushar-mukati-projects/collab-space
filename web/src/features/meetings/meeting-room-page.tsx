"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFetchMeeting } from "@/hooks/meetings";
import { useFetchUsers } from "@/hooks/users";
import { useUser, useAuth } from "@clerk/nextjs";
import { MeetingRoom } from "./meeting-room";

interface MeetingRoomPageProps {
  meetingId: string;
}

export const MeetingRoomPage = ({ meetingId }: MeetingRoomPageProps) => {
  const router = useRouter();
  const { data: meeting, isLoading: meetingLoading } = useFetchMeeting(meetingId);
  const { data: users = [] } = useFetchUsers();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();

  const handleLeave = () => {
    router.push("/meetings");
  };

  if (meetingLoading || !meeting || !userLoaded || !clerkUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111]">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <MeetingRoom
      meeting={meeting}
      users={users}
      currentUserId={clerkUser.id}
      currentUserName={clerkUser.fullName ?? clerkUser.firstName ?? "You"}
      getToken={getToken}
      onLeave={handleLeave}
    />
  );
};
