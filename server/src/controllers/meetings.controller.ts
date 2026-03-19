import type { Request, Response } from "express";
import { validated } from "../types.js";
import { createMeetingSchema, meetingIdSchema } from "../schemas/meetings.schema.js";
import { listMeetings, createMeeting, getMeeting } from "../services/meeting.service.js";

export const list = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  res.json(await listMeetings(workspaceId));
};
export const create = async (req: Request, res: Response) => {
  const { body, workspaceId } = validated(req, createMeetingSchema);
  res.status(201).json(await createMeeting(body, workspaceId));
};
export const getOne = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, meetingIdSchema);
  const m = await getMeeting(id, workspaceId);
  if (!m) return res.status(404).json({ error: "Meeting not found" });
  res.json(m);
};
