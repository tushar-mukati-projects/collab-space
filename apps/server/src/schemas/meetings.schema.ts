import { z } from "zod";
export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1, "title is required"),
    start_time: z.string().min(1, "start_time is required"),
    end_time: z.string().min(1, "end_time is required"),
    description: z.string().optional(),
    participants: z.array(z.string()).optional(),
    workspace_id: z.string().optional(),
  }),
});
export const meetingIdSchema = z.object({ params: z.object({ id: z.string() }) });
