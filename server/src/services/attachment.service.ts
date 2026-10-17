import crypto from "crypto";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../db.js";
import { config } from "../config.js";
import { logger } from "../logger.js";

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".zip": "application/zip",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
  };
  return types[ext] ?? "application/octet-stream";
}

function supabaseClient() {
  if (!config.SUPABASE_URL || !config.SUPABASE_SECRET_KEY) return null;
  return createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY);
}

export const uploadAttachment = async (
  file: { buffer: Buffer; originalname: string; size: number; mimetype: string },
  ticketId: string,
  userId: string,
  workspaceId: string,
) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { workspace_id: true },
  });

  if (!ticket || ticket.workspace_id !== workspaceId) {
    return null;
  }

  const supabase = supabaseClient();
  if (!supabase) {
    throw new Error("Supabase storage is not configured");
  }

  const id = crypto.randomUUID().slice(0, 8);
  const ext = path.extname(file.originalname);
  const safeName = `${workspaceId}/${ticketId}/${id}${ext}`;
  const contentType = getContentType(file.originalname);

  const { error } = await supabase.storage
    .from(config.SUPABASE_BUCKET)
    .upload(safeName, file.buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    logger.error("Supabase upload failed", { error: error.message, safeName });
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(config.SUPABASE_BUCKET).getPublicUrl(safeName);

  let attachment;
  try {
    attachment = await prisma.attachment.create({
      data: {
        filename: safeName,
        original_name: file.originalname,
        url: urlData.publicUrl,
        size: file.size,
        mime_type: contentType,
        uploaded_by: userId,
        ticket_id: ticketId,
        workspace_id: workspaceId,
      },
    });
  } catch (err) {
    await supabase.storage
      .from(config.SUPABASE_BUCKET)
      .remove([safeName])
      .catch(() => {});
    throw err;
  }

  await prisma.activity.create({
    data: {
      type: "ticket_updated",
      message: `attached ${file.originalname}`,
      user_id: userId,
      ticket_id: ticketId,
    },
  });

  logger.info("Attachment uploaded", { id: attachment.id, ticketId, filename: file.originalname });

  return {
    id: attachment.id,
    filename: attachment.original_name,
    url: attachment.url,
    size: attachment.size,
    mime_type: attachment.mime_type,
    uploaded_by: attachment.uploaded_by,
    created_at: attachment.created_at,
  };
};

export const listAttachments = async (ticketId: string, workspaceId: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { workspace_id: true },
  });

  if (!ticket || ticket.workspace_id !== workspaceId) {
    return null;
  }

  const attachments = await prisma.attachment.findMany({
    where: { ticket_id: ticketId },
    orderBy: { created_at: "desc" },
  });

  return attachments.map((a) => ({
    id: a.id,
    filename: a.original_name,
    url: a.url,
    size: a.size,
    mime_type: a.mime_type,
    uploaded_by: a.uploaded_by,
    created_at: a.created_at,
  }));
};

export const deleteAttachment = async (
  attachmentId: string,
  ticketId: string,
  userId: string,
  workspaceId: string,
) => {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment || attachment.ticket_id !== ticketId || attachment.workspace_id !== workspaceId) {
    return false;
  }

  const supabase = supabaseClient();
  if (supabase) {
    const { error } = await supabase.storage
      .from(config.SUPABASE_BUCKET)
      .remove([attachment.filename]);

    if (error) {
      logger.error("Supabase delete failed; keeping attachment record", {
        error: error.message,
        filename: attachment.filename,
      });
      throw new Error(`Failed to delete attachment file: ${error.message}`);
    }
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });

  await prisma.activity.create({
    data: {
      type: "ticket_updated",
      message: `removed attachment ${attachment.original_name}`,
      user_id: userId,
      ticket_id: ticketId,
    },
  });

  logger.info("Attachment deleted", { id: attachmentId, ticketId });
  return true;
};

export const uploadEditorFile = async (
  file: { buffer: Buffer; originalname: string; mimetype: string },
  workspaceId: string,
) => {
  const supabase = supabaseClient();
  if (!supabase) {
    throw new Error("Supabase storage is not configured");
  }

  const id = crypto.randomUUID().slice(0, 8);
  const ext = path.extname(file.originalname);
  const safeName = `${workspaceId}/editor/${id}${ext}`;

  const { error } = await supabase.storage
    .from(config.SUPABASE_BUCKET)
    .upload(safeName, file.buffer, {
      contentType: getContentType(file.originalname),
      upsert: false,
    });

  if (error) {
    logger.error("Editor file upload failed", { error: error.message });
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(config.SUPABASE_BUCKET).getPublicUrl(safeName);

  return urlData.publicUrl;
};
