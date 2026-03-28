"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

export interface RemotePeer {
  socketId: string;
  userId: string;
  userName: string;
  stream: MediaStream | null;
  isMicOn: boolean;
  isCameraOn: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  userName: string;
}

export const useWebRTC = ({ roomId, userId, userName }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = React.useState<MediaStream | null>(null);
  const [peers, setPeers] = React.useState<RemotePeer[]>([]);
  const [isMicOn, setIsMicOn] = React.useState(false);
  const [isCameraOn, setIsCameraOn] = React.useState(false);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [mediaError, setMediaError] = React.useState<string | null>(null);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);

  const socketRef = React.useRef<Socket | null>(null);
  const pcsRef = React.useRef(new Map<string, RTCPeerConnection>());
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const screenStreamRef = React.useRef<MediaStream | null>(null);
  const peerInfoRef = React.useRef(new Map<string, { userId: string; userName: string }>());
  const micRef = React.useRef(false);
  const camRef = React.useRef(false);

  const createPC = (remoteSocketId: string, remoteUserId: string, remoteUserName: string) => {
    const existing = pcsRef.current.get(remoteSocketId);
    if (existing) existing.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcsRef.current.set(remoteSocketId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("ice-candidate", {
          to: remoteSocketId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      setPeers((prev) => {
        const idx = prev.findIndex((p) => p.socketId === remoteSocketId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], stream };
          return next;
        }
        return [
          ...prev,
          {
            socketId: remoteSocketId,
            userId: remoteUserId,
            userName: remoteUserName,
            stream,
            isMicOn: true,
            isCameraOn: true,
          },
        ];
      });
    };

    return pc;
  };

  React.useEffect(() => {
    let disposed = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true,
        });
        if (disposed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOn(true);
        setIsMicOn(true);
        micRef.current = true;
        camRef.current = true;
      } catch {
        if (disposed) return;
        setMediaError("Could not access camera/mic. Check permissions.");
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:4000";
      const socket = io(baseUrl, { path: "/meeting-socket", transports: ["websocket", "polling"] });
      if (disposed) {
        socket.disconnect();
        return;
      }
      socketRef.current = socket;

      socket.on("connect", () => {
        if (disposed) return;
        setIsConnected(true);
        socket.emit("join-room", { roomId, userId, userName });
      });

      socket.on("disconnect", () => {
        if (!disposed) setIsConnected(false);
      });

      socket.on("existing-participants", (participants: RemotePeer[]) => {
        if (disposed) return;

        pcsRef.current.forEach((pc) => pc.close());
        pcsRef.current.clear();
        peerInfoRef.current.clear();

        participants.forEach((p) => {
          peerInfoRef.current.set(p.socketId, { userId: p.userId, userName: p.userName });
        });

        setPeers(
          participants.map((p) => ({
            socketId: p.socketId,
            userId: p.userId,
            userName: p.userName,
            stream: null,
            isMicOn: p.isMicOn ?? true,
            isCameraOn: p.isCameraOn ?? true,
          })),
        );

        for (const p of participants) {
          const pc = createPC(p.socketId, p.userId, p.userName);
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer).then(() => offer))
            .then((offer) => socket.emit("offer", { to: p.socketId, offer }))
            .catch((err) => console.error("Failed to create offer:", err));
        }
      });

      socket.on(
        "participant-joined",
        ({
          socketId: sid,
          userId: uid,
          userName: uname,
        }: {
          socketId: string;
          userId: string;
          userName: string;
        }) => {
          if (disposed) return;
          peerInfoRef.current.set(sid, { userId: uid, userName: uname });
          setPeers((prev) => {
            if (prev.some((p) => p.socketId === sid)) return prev;
            return [
              ...prev,
              {
                socketId: sid,
                userId: uid,
                userName: uname,
                stream: null,
                isMicOn: true,
                isCameraOn: true,
              },
            ];
          });
        },
      );

      socket.on(
        "offer",
        async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
          if (disposed) return;
          const info = peerInfoRef.current.get(from) ?? { userId: "unknown", userName: "Unknown" };
          let pc = pcsRef.current.get(from);
          if (!pc) pc = createPC(from, info.userId, info.userName);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { to: from, answer });
          } catch (err) {
            console.error("Failed to handle offer:", err);
          }
        },
      );

      socket.on(
        "answer",
        async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
          if (disposed) return;
          const pc = pcsRef.current.get(from);
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
              console.error("Failed to set remote description:", err);
            }
          }
        },
      );

      socket.on(
        "ice-candidate",
        async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
          if (disposed) return;
          const pc = pcsRef.current.get(from);
          if (pc && candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Failed to add ICE candidate:", err);
            }
          }
        },
      );

      socket.on("participant-left", ({ socketId: sid }: { socketId: string }) => {
        if (disposed) return;
        const pc = pcsRef.current.get(sid);
        if (pc) {
          pc.close();
          pcsRef.current.delete(sid);
        }
        peerInfoRef.current.delete(sid);
        setPeers((prev) => prev.filter((p) => p.socketId !== sid));
      });

      socket.on(
        "participant-media-state",
        ({
          socketId: sid,
          isMicOn: mic,
          isCameraOn: cam,
        }: {
          socketId: string;
          isMicOn: boolean;
          isCameraOn: boolean;
        }) => {
          if (disposed) return;
          setPeers((prev) =>
            prev.map((p) => (p.socketId === sid ? { ...p, isMicOn: mic, isCameraOn: cam } : p)),
          );
        },
      );

      socket.on("chat-message", (msg: ChatMessage) => {
        if (disposed) return;
        setChatMessages((prev) => [...prev, msg]);
      });
    };

    init();

    const pcs = pcsRef.current;
    const peerInfo = peerInfoRef.current;

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      pcs.forEach((pc) => pc.close());
      pcs.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      peerInfo.clear();
    };
  }, [roomId, userId, userName]);

  const replaceVideoTrackInPeers = React.useCallback((newTrack: MediaStreamTrack | null) => {
    pcsRef.current.forEach((pc) => {
      const videoSender = pc.getSenders().find((s) => s.track?.kind === "video" || !s.track);
      if (videoSender) videoSender.replaceTrack(newTrack);
    });
  }, []);

  const toggleMic = React.useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micRef.current;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    micRef.current = next;
    setIsMicOn(next);
    socketRef.current?.emit("media-state", { isMicOn: next, isCameraOn: camRef.current });
  }, []);

  const toggleCamera = React.useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (camRef.current) {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = false;
      });
      camRef.current = false;
      setIsCameraOn(false);
      socketRef.current?.emit("media-state", { isMicOn: micRef.current, isCameraOn: false });
    } else {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((t) => {
          t.enabled = true;
        });
      } else {
        try {
          const vs = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          });
          vs.getVideoTracks().forEach((t) => {
            stream.addTrack(t);
            pcsRef.current.forEach((pc) => pc.addTrack(t, stream));
          });
        } catch {
          setMediaError("Could not access camera.");
          return;
        }
      }
      camRef.current = true;
      setIsCameraOn(true);
      setMediaError(null);
      socketRef.current?.emit("media-state", { isMicOn: micRef.current, isCameraOn: true });
    }
  }, []);

  const toggleScreenShare = React.useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      replaceVideoTrackInPeers(localStreamRef.current?.getVideoTracks()[0] ?? null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" } as MediaTrackConstraints,
          audio: false,
        });
        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];
        replaceVideoTrackInPeers(screenTrack);

        screenTrack.onended = () => {
          screenStreamRef.current = null;
          setScreenStream(null);
          setIsScreenSharing(false);
          replaceVideoTrackInPeers(localStreamRef.current?.getVideoTracks()[0] ?? null);
        };
      } catch {
        /* user cancelled */
      }
    }
  }, [replaceVideoTrackInPeers]);

  const sendChatMessage = React.useCallback((text: string) => {
    socketRef.current?.emit("chat-message", { text });
  }, []);

  const disconnect = React.useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
  }, []);

  return {
    localStream,
    screenStream,
    peers,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    mediaError,
    chatMessages,
    isConnected,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
    disconnect,
  };
};
