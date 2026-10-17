import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/backend";
import { prisma } from "./db.js";
import { logger } from "./logger.js";

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  isMicOn: boolean;
  isCameraOn: boolean;
}

const rooms = new Map<string, Map<string, Participant>>();

const leaveRoom = (
  io: SocketIOServer,
  socketId: string,
  roomId: string | null,
  userId: string | null,
) => {
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (room) {
    room.delete(socketId);
    if (room.size === 0) rooms.delete(roomId);
  }
  io.to(roomId).emit("participant-left", { socketId });
  logger.info(`Meeting: ${userId ?? socketId} left room ${roomId}`);
};

export const startMeetingSignaling = (server: HttpServer, clientUrl: string) => {
  const io = new SocketIOServer(server, {
    cors: { origin: clientUrl, credentials: true },
    path: "/meeting-socket",
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
      if (!claims.sub) return next(new Error("Invalid token"));
      socket.data.userId = claims.sub;
      next();
    } catch (err: any) {
      logger.warn("Meeting auth failed", { error: err?.message });
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    let currentRoom: string | null = null;
    const currentUserId: string = socket.data.userId;

    socket.on("join-room", async ({ roomId, userName }: { roomId: string; userName: string }) => {
      const meeting = await prisma.meeting.findUnique({
        where: { room_id: roomId },
        select: { workspace_id: true },
      });
      if (!meeting) {
        socket.emit("join-error", { error: "Meeting not found" });
        return;
      }
      const member = await prisma.workspaceMember.findUnique({
        where: {
          user_id_workspace_id: { user_id: currentUserId, workspace_id: meeting.workspace_id },
        },
        select: { user_id: true },
      });
      if (!member) {
        logger.warn("Meeting join denied: not a workspace member", { currentUserId, roomId });
        socket.emit("join-error", { error: "Forbidden" });
        return;
      }

      if (currentRoom && currentRoom !== roomId) {
        socket.leave(currentRoom);
        leaveRoom(io, socket.id, currentRoom, currentUserId);
      }

      currentRoom = roomId;
      socket.join(roomId);

      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      const room = rooms.get(roomId)!;
      room.set(socket.id, {
        socketId: socket.id,
        userId: currentUserId,
        userName,
        isMicOn: true,
        isCameraOn: true,
      });

      const existing = Array.from(room.values()).filter((p) => p.socketId !== socket.id);
      socket.emit("existing-participants", existing);
      socket
        .to(roomId)
        .emit("participant-joined", { socketId: socket.id, userId: currentUserId, userName });

      logger.info(`Meeting: ${userName} joined room ${roomId} (${room.size} in room)`);
    });

    const relayIfSameRoom = (to: string, event: string, payload: unknown) => {
      if (!currentRoom) return;
      if (!rooms.get(currentRoom)?.has(to)) return;
      io.to(to).emit(event, payload);
    };

    socket.on("offer", ({ to, offer }: { to: string; offer: unknown }) => {
      relayIfSameRoom(to, "offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }: { to: string; answer: unknown }) => {
      relayIfSameRoom(to, "answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }: { to: string; candidate: unknown }) => {
      relayIfSameRoom(to, "ice-candidate", { from: socket.id, candidate });
    });

    socket.on("media-state", (data: { isMicOn: boolean; isCameraOn: boolean }) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (room?.has(socket.id)) Object.assign(room.get(socket.id)!, data);
      socket.to(currentRoom).emit("participant-media-state", { socketId: socket.id, ...data });
    });

    socket.on("chat-message", ({ text }: { text: string }) => {
      if (!currentRoom) return;
      io.in(currentRoom).emit("chat-message", {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: currentUserId,
        text,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      leaveRoom(io, socket.id, currentRoom, currentUserId);
      currentRoom = null;
    });
  });

  logger.info("Meeting signaling server ready at /meeting-socket");
};
