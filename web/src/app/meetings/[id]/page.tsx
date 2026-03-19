"use client";

import { use } from "react";
import { MeetingRoomPage } from "@/features/meetings/meeting-room-page";

export default function MeetingRoomRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <MeetingRoomPage meetingId={id} />;
}
