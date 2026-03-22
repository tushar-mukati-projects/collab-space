import { http, HttpResponse, delay } from "msw";
import { mockMeetings } from "../data";
import type { Meeting, CreateMeetingInput } from "@/types";

const _meetings: Meeting[] = structuredClone(mockMeetings);

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
};

export const meetingHandlers = [
  http.get("/api/meetings", async () => {
    await delay(300);
    return HttpResponse.json(_meetings);
  }),

  http.get("/api/meetings/:id", async ({ params }) => {
    await delay(200);
    const meeting = _meetings.find((m) => m.id === params.id);
    if (!meeting) {
      return HttpResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    return HttpResponse.json(meeting);
  }),

  http.post("/api/meetings", async ({ request }) => {
    await delay(300);
    const input = (await request.json()) as CreateMeetingInput;
    const meeting: Meeting = {
      id: generateId("mtg"),
      title: input.title,
      description: input.description ?? "",
      start_time: input.start_time,
      end_time: input.end_time,
      participants: input.participants,
      status: "scheduled",
      room_id: `room_${Date.now().toString(36)}`,
      recording_url: null,
      workspace_id: input.workspace_id,
    };
    _meetings.push(meeting);
    return HttpResponse.json(meeting, { status: 201 });
  }),

  http.patch("/api/meetings/:id", async ({ params, request }) => {
    await delay(200);
    const meeting = _meetings.find((m) => m.id === params.id);
    if (!meeting) {
      return HttpResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    const updates = (await request.json()) as Partial<Meeting>;
    if (updates.title !== undefined) meeting.title = updates.title;
    if (updates.description !== undefined) meeting.description = updates.description;
    if (updates.start_time !== undefined) meeting.start_time = updates.start_time;
    if (updates.end_time !== undefined) meeting.end_time = updates.end_time;
    if (updates.participants !== undefined) meeting.participants = updates.participants;
    if (updates.status !== undefined) meeting.status = updates.status;
    return HttpResponse.json(meeting);
  }),

  http.delete("/api/meetings/:id", async ({ params }) => {
    await delay(200);
    const idx = _meetings.findIndex((m) => m.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    _meetings.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),
];
