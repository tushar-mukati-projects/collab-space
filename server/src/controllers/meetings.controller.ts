import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { validated } from "../types.js";
import { createMeetingSchema, meetingIdSchema } from "../schemas/meetings.schema.js";
import { listMeetings, createMeeting, getMeeting } from "../services/meeting.service.js";

const listCtrl = async (req: Request, res: Response) => {
  res.json(await listMeetings(req.workspaceId));
};
const createCtrl = async (req: Request, res: Response) => {
  const { body } = validated(req, createMeetingSchema);
  res.status(201).json(await createMeeting(body, req.workspaceId));
};
const getOneCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, meetingIdSchema);
  const m = await getMeeting(id, req.workspaceId);
  if (!m) return res.status(404).json({ error: "Meeting not found" });
  res.json(m);
};

export const list = wrapController(listCtrl);
export const create = wrapController(createCtrl);
export const getOne = wrapController(getOneCtrl);
