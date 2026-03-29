import { http, HttpResponse, delay } from "msw";
import { mockMeetings } from "../data";
import { mockUrl } from "../config";
import type { Meeting, CreateMeetingInput } from "@/types";

const _meetings: Meeting[] = structuredClone(mockMeetings);

export const meetingHandlers = [
  http.get(mockUrl("/meetings"), async () => {
    await delay(300);
    return HttpResponse.json(_meetings);
  }),

  http.get(mockUrl("/meetings/:id"), async ({ params }) => {
    await delay(200);
    const meeting = _meetings.find((m) => m.id === params.id);
    if (!meeting) {
      return HttpResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    return HttpResponse.json(meeting);
  }),

  http.post(mockUrl("/meetings"), async ({ request }) => {
    await delay(300);
    const input = (await request.json()) as CreateMeetingInput;
    const meeting: Meeting = {
      id: crypto.randomUUID(),
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

  http.patch(mockUrl("/meetings/:id"), async ({ params, request }) => {
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

  http.delete(mockUrl("/meetings/:id"), async ({ params }) => {
    await delay(200);
    const idx = _meetings.findIndex((m) => m.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    _meetings.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),
];
