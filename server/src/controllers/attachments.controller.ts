import type { Request, Response } from "express";
import {
  uploadAttachment,
  listAttachments,
  deleteAttachment,
  uploadEditorFile,
} from "../services/attachment.service.js";

export const upload = async (req: Request, res: Response) => {
  const ticketId = req.params.id as string;
  const userId = (req as any).userId as string;
  const workspaceId = (req as any).workspaceId as string;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    const attachment = await uploadAttachment(file, ticketId, userId, workspaceId);
    if (!attachment) return res.status(404).json({ error: "Ticket not found" });
    res.status(201).json(attachment);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Upload failed" });
  }
};

export const list = async (req: Request, res: Response) => {
  const ticketId = req.params.id as string;
  const workspaceId = (req as any).workspaceId as string;

  const attachments = await listAttachments(ticketId, workspaceId);
  if (!attachments) return res.status(404).json({ error: "Ticket not found" });
  res.json(attachments);
};

export const remove = async (req: Request, res: Response) => {
  const ticketId = req.params.id as string;
  const attachmentId = req.params.attachmentId as string;
  const userId = (req as any).userId as string;
  const workspaceId = (req as any).workspaceId as string;

  const deleted = await deleteAttachment(attachmentId, ticketId, userId, workspaceId);
  if (!deleted) return res.status(404).json({ error: "Attachment not found" });
  res.json({ success: true });
};

export const editorUpload = async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId as string;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    const url = await uploadEditorFile(file, workspaceId);
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Upload failed" });
  }
};
