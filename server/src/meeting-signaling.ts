import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "./logger.js";

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  isMicOn: boolean;
  isCameraOn: boolean;
}

const rooms = new Map<string, Map<string, Participant>>();

export const startMeetingSignaling = (server: HttpServer, clientUrl: string) => {
  const io = new SocketIOServer(server, {
    cors: { origin: clientUrl, credentials: true },
    path: "/meeting-socket",
  });

  io.on("connection", (socket) => {
    let currentRoom: string | null = null;
    let currentUserId: string | null = null;

    socket.on(
      "join-room",
      ({ roomId, userId, userName }: { roomId: string; userId: string; userName: string }) => {
        currentRoom = roomId;
        currentUserId = userId;
        socket.join(roomId);

        if (!rooms.has(roomId)) rooms.set(roomId, new Map());
        const room = rooms.get(roomId)!;
        room.set(socket.id, {
          socketId: socket.id,
          userId,
          userName,
          isMicOn: true,
          isCameraOn: true,
        });

        const existing = Array.from(room.values()).filter((p) => p.socketId !== socket.id);
        socket.emit("existing-participants", existing);
        socket.to(roomId).emit("participant-joined", { socketId: socket.id, userId, userName });

        logger.info(`Meeting: ${userName} joined room ${roomId} (${room.size} in room)`);
      },
    );

    socket.on("offer", ({ to, offer }: { to: string; offer: unknown }) => {
      io.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }: { to: string; answer: unknown }) => {
      io.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }: { to: string; candidate: unknown }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("media-state", (data: { isMicOn: boolean; isCameraOn: boolean }) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (room?.has(socket.id)) Object.assign(room.get(socket.id)!, data);
      socket.to(currentRoom).emit("participant-media-state", { socketId: socket.id, ...data });
    });

    socket.on("chat-message", ({ text }: { text: string }) => {
      if (!currentRoom || !currentUserId) return;
      io.in(currentRoom).emit("chat-message", {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: currentUserId,
        text,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) rooms.delete(currentRoom);
      }
      socket.to(currentRoom).emit("participant-left", { socketId: socket.id });
      logger.info(`Meeting: ${currentUserId} left room ${currentRoom}`);
    });
  });

  logger.info("Meeting signaling server ready at /meeting-socket");
};
