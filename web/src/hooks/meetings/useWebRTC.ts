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

interface PeerInfo {
  userId: string;
  userName: string;
  isMicOn: boolean;
  isCameraOn: boolean;
}

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  userName: string;
  getToken: () => Promise<string | null>;
}

export const useWebRTC = ({ roomId, userId, userName, getToken }: UseWebRTCProps) => {
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
  const videoSendersRef = React.useRef(new Map<string, RTCRtpSender>());
  const pendingCandidatesRef = React.useRef(new Map<string, RTCIceCandidateInit[]>());
  const makingOfferRef = React.useRef(new Map<string, boolean>());
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const screenStreamRef = React.useRef<MediaStream | null>(null);
  const peerInfoRef = React.useRef(new Map<string, PeerInfo>());
  const micRef = React.useRef(false);
  const camRef = React.useRef(false);
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const isPolite = (remoteSocketId: string) => (socketRef.current?.id ?? "") > remoteSocketId;

  const cleanupPeer = (socketId: string) => {
    pcsRef.current.get(socketId)?.close();
    pcsRef.current.delete(socketId);
    videoSendersRef.current.delete(socketId);
    pendingCandidatesRef.current.delete(socketId);
    makingOfferRef.current.delete(socketId);
  };

  const drainCandidates = async (pc: RTCPeerConnection, socketId: string) => {
    const pending = pendingCandidatesRef.current.get(socketId);
    if (!pending) return;
    pendingCandidatesRef.current.delete(socketId);
    for (const c of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.error("Failed to add buffered ICE candidate:", err);
      }
    }
  };

  const createPC = (remoteSocketId: string, remoteUserId: string, remoteUserName: string) => {
    const existing = pcsRef.current.get(remoteSocketId);
    if (existing) existing.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcsRef.current.set(remoteSocketId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, localStreamRef.current!);
        if (track.kind === "video") videoSendersRef.current.set(remoteSocketId, sender);
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
        const info = peerInfoRef.current.get(remoteSocketId);
        return [
          ...prev,
          {
            socketId: remoteSocketId,
            userId: remoteUserId,
            userName: remoteUserName,
            stream,
            isMicOn: info?.isMicOn ?? true,
            isCameraOn: info?.isCameraOn ?? true,
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
      const socket = io(baseUrl, {
        path: "/meeting-socket",
        transports: ["websocket", "polling"],
        auth: async (cb) => cb({ token: (await getTokenRef.current()) ?? "" }),
      });
      if (disposed) {
        socket.disconnect();
        return;
      }
      socketRef.current = socket;

      socket.on("connect", () => {
        if (disposed) return;
        setIsConnected(true);
        socket.emit("join-room", { roomId, userName });
      });

      socket.on("connect_error", (err: Error) => {
        if (!disposed) setMediaError(err.message || "Failed to connect to meeting.");
      });

      socket.on("join-error", ({ error }: { error: string }) => {
        if (!disposed) setMediaError(error);
      });

      socket.on("disconnect", () => {
        if (!disposed) setIsConnected(false);
      });

      socket.on("existing-participants", (participants: RemotePeer[]) => {
        if (disposed) return;

        pcsRef.current.forEach((pc) => pc.close());
        pcsRef.current.clear();
        videoSendersRef.current.clear();
        pendingCandidatesRef.current.clear();
        makingOfferRef.current.clear();
        peerInfoRef.current.clear();

        participants.forEach((p) => {
          peerInfoRef.current.set(p.socketId, {
            userId: p.userId,
            userName: p.userName,
            isMicOn: p.isMicOn ?? true,
            isCameraOn: p.isCameraOn ?? true,
          });
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
          makingOfferRef.current.set(p.socketId, true);
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer).then(() => offer))
            .then((offer) => socket.emit("offer", { to: p.socketId, offer }))
            .catch((err) => console.error("Failed to create offer:", err))
            .finally(() => makingOfferRef.current.set(p.socketId, false));
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
          peerInfoRef.current.set(sid, {
            userId: uid,
            userName: uname,
            isMicOn: true,
            isCameraOn: true,
          });
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

          const offerCollision =
            makingOfferRef.current.get(from) === true || pc.signalingState !== "stable";
          if (!isPolite(from) && offerCollision) return;

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await drainCandidates(pc, from);
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
              await drainCandidates(pc, from);
            } catch (err) {
              console.error("Failed to set remote description:", err);
            }
          }
        },
      );

      socket.on(
        "ice-candidate",
        async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
          if (disposed || !candidate) return;
          const pc = pcsRef.current.get(from);
          if (!pc || !pc.remoteDescription) {
            const list = pendingCandidatesRef.current.get(from) ?? [];
            list.push(candidate);
            pendingCandidatesRef.current.set(from, list);
            return;
          }
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Failed to add ICE candidate:", err);
          }
        },
      );

      socket.on("participant-left", ({ socketId: sid }: { socketId: string }) => {
        if (disposed) return;
        cleanupPeer(sid);
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
          const info = peerInfoRef.current.get(sid);
          if (info) {
            info.isMicOn = mic;
            info.isCameraOn = cam;
          }
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
    const videoSenders = videoSendersRef.current;
    const pendingCandidates = pendingCandidatesRef.current;
    const makingOffer = makingOfferRef.current;
    const peerInfo = peerInfoRef.current;

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      pcs.forEach((pc) => pc.close());
      pcs.clear();
      videoSenders.clear();
      pendingCandidates.clear();
      makingOffer.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      peerInfo.clear();
    };
  }, [roomId, userId, userName]);

  const replaceVideoTrackInPeers = React.useCallback((newTrack: MediaStreamTrack | null) => {
    videoSendersRef.current.forEach((sender) => {
      sender.replaceTrack(newTrack).catch((err) => console.error("replaceTrack failed:", err));
    });
  }, []);

  const renegotiate = React.useCallback(async (pc: RTCPeerConnection, sid: string) => {
    try {
      makingOfferRef.current.set(sid, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("offer", { to: sid, offer });
    } catch (err) {
      console.error("Renegotiation failed:", err);
    } finally {
      makingOfferRef.current.set(sid, false);
    }
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
        t.stop();
        stream.removeTrack(t);
      });
      if (!screenStreamRef.current) replaceVideoTrackInPeers(null);
      camRef.current = false;
      setIsCameraOn(false);
      setLocalStream(new MediaStream(stream.getTracks()));
      socketRef.current?.emit("media-state", { isMicOn: micRef.current, isCameraOn: false });
    } else {
      try {
        const vs = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        const newTrack = vs.getVideoTracks()[0];
        stream.addTrack(newTrack);
        if (!screenStreamRef.current) {
          for (const [sid, pc] of pcsRef.current) {
            const sender = videoSendersRef.current.get(sid);
            if (sender) {
              sender.replaceTrack(newTrack).catch((err) => console.error("replaceTrack:", err));
            } else {
              const added = pc.addTrack(newTrack, stream);
              videoSendersRef.current.set(sid, added);
              await renegotiate(pc, sid);
            }
          }
        }
        camRef.current = true;
        setIsCameraOn(true);
        setMediaError(null);
        setLocalStream(new MediaStream(stream.getTracks()));
        socketRef.current?.emit("media-state", { isMicOn: micRef.current, isCameraOn: true });
      } catch {
        setMediaError("Could not access camera.");
      }
    }
  }, [replaceVideoTrackInPeers, renegotiate]);

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
    videoSendersRef.current.clear();
    pendingCandidatesRef.current.clear();
    makingOfferRef.current.clear();
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
