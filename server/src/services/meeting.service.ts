import { prisma } from "../db.js";
import { randomUUID } from "crypto";

const toMeetingDTO = (m: {
  id: string;
  title: string;
  description: string | null;
  start_time: Date;
  end_time: Date;
  status: string;
  room_id: string;
  recording_url: string | null;
  workspace_id: string;
  participants: { id: string }[];
}) => {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    start_time: m.start_time,
    end_time: m.end_time,
    participants: m.participants.map((p) => p.id),
    status: m.status,
    room_id: m.room_id,
    recording_url: m.recording_url,
    workspace_id: m.workspace_id,
  };
};

export const listMeetings = async (workspaceId: string) => {
  const meetings = await prisma.meeting.findMany({
    where: { workspace_id: workspaceId },
    include: { participants: { select: { id: true } } },
    orderBy: { start_time: "asc" },
  });
  return meetings.map(toMeetingDTO);
};

export const getMeeting = async (id: string, workspaceId: string) => {
  const meeting = await prisma.meeting.findFirst({
    where: { id, workspace_id: workspaceId },
    include: { participants: { select: { id: true } } },
  });
  return meeting ? toMeetingDTO(meeting) : null;
};

export const createMeeting = async (
  data: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    participants?: string[];
  },
  workspaceId: string,
) => {
  const roomId = "room_" + randomUUID().replace(/-/g, "").slice(0, 25);
  const participantIds: string[] = Array.isArray(data.participants) ? data.participants : [];

  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      description: data.description ?? "",
      start_time: new Date(data.start_time),
      end_time: new Date(data.end_time),
      room_id: roomId,
      workspace_id: workspaceId,
      participants: {
        connect: participantIds.map((id: string) => ({ id })),
      },
    },
    include: { participants: { select: { id: true } } },
  });

  return toMeetingDTO(meeting);
};
