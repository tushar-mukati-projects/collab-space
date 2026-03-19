"use client";

import * as React from "react";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Users,
  PhoneOff,
  Send,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Meeting, User } from "@/types";

interface MeetingRoomProps {
  meeting: Meeting;
  users: User[];
  currentUserId: string;
  onLeave: () => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
}

type SidePanel = "chat" | "participants" | null;

export const MeetingRoom = ({ meeting, users, currentUserId, onLeave }: MeetingRoomProps) => {
  const [isMicOn, setIsMicOn] = React.useState(false);
  const [isCameraOn, setIsCameraOn] = React.useState(false);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [isRecording] = React.useState(false);
  const [sidePanel, setSidePanel] = React.useState<SidePanel>(null);
  const [chatInput, setChatInput] = React.useState("");
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [mediaError, setMediaError] = React.useState<string | null>(null);

  // Media refs
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const screenStreamRef = React.useRef<MediaStream | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const localVideoRef = (node: HTMLVideoElement | null) => {
    if (node && localStreamRef.current) node.srcObject = localStreamRef.current;
  };

  const screenVideoRef = (node: HTMLVideoElement | null) => {
    if (node && screenStreamRef.current) node.srcObject = screenStreamRef.current;
  };

  // Duration timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-start camera/mic on mount
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setIsCameraOn(true);
        setIsMicOn(true);
      } catch {
        setMediaError("Could not access camera/mic. Check permissions.");
      }
    })();
    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // -- Media controls --

  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = localStreamRef.current;
      if (stream) {
        stream.getVideoTracks().forEach((t) => t.stop());
      }
      setIsCameraOn(false);
    } else {
      try {
        setMediaError(null);
        const stream = localStreamRef.current;
        if (stream && stream.getAudioTracks().length > 0) {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          });
          videoStream.getVideoTracks().forEach((t) => stream.addTrack(t));
        } else {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            audio: true,
          });
          localStreamRef.current = newStream;
          setIsMicOn(true);
        }
        setIsCameraOn(true);
      } catch {
        setMediaError("Could not access camera.");
      }
    }
  };

  const toggleMic = async () => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((t) => {
          t.enabled = !t.enabled;
        });
        setIsMicOn(!isMicOn);
        return;
      }
    }
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (localStreamRef.current) {
        audioStream.getAudioTracks().forEach((t) => localStreamRef.current!.addTrack(t));
      } else {
        localStreamRef.current = audioStream;
      }
      setIsMicOn(true);
    } catch {
      setMediaError("Could not access microphone.");
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" },
          audio: false,
        });
        screenStreamRef.current = stream;
        stream.getVideoTracks()[0].onended = () => {
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
      } catch {
        // User cancelled
      }
    }
  };

  const handleLeave = () => {
    // Stop all media tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    onLeave();
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const participants = meeting.participants
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as User[];

  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name ?? "Unknown";

  const getUserAvatar = (userId: string) => users.find((u) => u.id === userId)?.avatar ?? "";

  const getUserInitials = (userId: string) => {
    const name = getUserName(userId);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        userId: currentUserId,
        text: chatInput.trim(),
        timestamp: new Date(),
      },
    ]);
    setChatInput("");
  };

  const togglePanel = (panel: SidePanel) => {
    setSidePanel((prev) => (prev === panel ? null : panel));
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Determine grid layout — screen share gets priority display
  const showScreenShareMain = isScreenSharing;
  const participantCount = participants.length;
  const gridCols = showScreenShareMain
    ? "grid-cols-1"
    : participantCount <= 1
      ? "grid-cols-1"
      : participantCount <= 4
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <div className="flex h-full flex-col" style={{ background: "#111" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLeave}
            className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{meeting.title}</span>
            <span className="text-xs text-zinc-500">
              {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              <span className="text-xs font-medium text-red-400">REC</span>
            </div>
          )}

          {/* Media error indicator */}
          {mediaError && (
            <div className="max-w-xs rounded-full bg-amber-500/20 px-3 py-1">
              <span className="truncate text-xs text-amber-400">{mediaError}</span>
            </div>
          )}

          {/* Duration */}
          <div className="rounded-full bg-zinc-800 px-3 py-1">
            <span className="font-mono text-xs text-zinc-300">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Video grid */}
        <div className={cn("flex-1 p-3 transition-all", sidePanel ? "pr-0" : "")}>
          {showScreenShareMain ? (
            // Screen share layout: screen share takes main area, participants in strip
            <div className="flex h-full flex-col gap-2">
              {/* Screen share — main */}
              <div className="relative flex-1 overflow-hidden rounded-xl bg-zinc-900 ring-2 ring-indigo-500/60">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="size-full object-contain"
                />
                <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
                  <span className="text-xs text-zinc-200">Your screen</span>
                </div>
              </div>
              {/* Participant strip */}
              <div className="flex h-28 shrink-0 gap-2 overflow-x-auto">
                {/* Self view */}
                <div className="relative flex w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 ring-2 ring-indigo-500/60">
                  {isCameraOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="size-full -scale-x-100 object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Avatar size="sm">
                        <AvatarImage src={getUserAvatar(currentUserId)} />
                        <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                          {getUserInitials(currentUserId)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-zinc-400">You</span>
                    </div>
                  )}
                  {!isMicOn && (
                    <div className="absolute top-1 right-1 rounded-full bg-red-500/80 p-0.5">
                      <MicOff className="size-2.5 text-white" />
                    </div>
                  )}
                </div>
                {/* Other participants */}
                {participants
                  .filter((u) => u.id !== currentUserId)
                  .map((user) => (
                    <div
                      key={user.id}
                      className="relative flex w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Avatar size="sm">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-zinc-400">{user.name.split(" ")[0]}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            // Normal grid layout
            <div
              className={cn(
                "grid h-full gap-2",
                gridCols,
                participantCount <= 2 ? "grid-rows-1" : "auto-rows-fr",
              )}
            >
              {participants.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "relative flex items-center justify-center overflow-hidden rounded-xl",
                      isCurrentUser ? "ring-2 ring-indigo-500/60" : "ring-1 ring-zinc-800",
                      "bg-zinc-900",
                    )}
                  >
                    {/* Real video for current user when camera is on */}
                    {isCurrentUser && isCameraOn ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="size-full -scale-x-100 object-cover"
                      />
                    ) : (
                      /* Avatar placeholder when camera is off */
                      <div className="flex flex-col items-center gap-3">
                        <Avatar size="lg" className="size-16 ring-0 after:ring-0">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-zinc-700 text-lg text-zinc-300">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-zinc-200">
                          {isCurrentUser ? "You" : user.name}
                        </span>
                        {isCurrentUser && !isCameraOn && (
                          <span className="text-xs text-zinc-500">Camera off</span>
                        )}
                      </div>
                    )}

                    {/* Name label overlay */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
                      <span className="text-xs text-zinc-200">
                        {isCurrentUser ? "You" : user.name.split(" ")[0]}
                      </span>
                      {isCurrentUser && !isMicOn && <MicOff className="size-3 text-red-400" />}
                    </div>

                    {/* Pin indicator for current user */}
                    {isCurrentUser && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-indigo-500/20 px-1.5 py-0 text-[10px] text-indigo-300">
                          You
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        {sidePanel && (
          <div className="flex w-80 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900/80">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <span className="text-sm font-medium text-white">
                {sidePanel === "chat" ? "In-call Messages" : "Participants"}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSidePanel(null)}
                className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>

            {sidePanel === "chat" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="flex flex-col gap-3">
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MessageSquare className="mb-2 size-8 text-zinc-700" />
                        <p className="text-xs text-zinc-500">No messages yet</p>
                        <p className="text-[10px] text-zinc-600">
                          Send a message to start the conversation
                        </p>
                      </div>
                    )}
                    {chatMessages.map((msg) => {
                      const isOwn = msg.userId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "")}
                        >
                          {!isOwn && (
                            <Avatar size="sm" className="mt-0.5 shrink-0">
                              <AvatarImage
                                src={getUserAvatar(msg.userId)}
                                alt={getUserName(msg.userId)}
                              />
                              <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                                {getUserInitials(msg.userId)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "flex max-w-[75%] flex-col gap-0.5",
                              isOwn ? "items-end" : "",
                            )}
                          >
                            {!isOwn && (
                              <span className="text-[11px] font-medium text-zinc-400">
                                {getUserName(msg.userId).split(" ")[0]}
                              </span>
                            )}
                            <div
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-sm",
                                isOwn ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-200",
                              )}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[10px] text-zinc-600">
                              {formatMessageTime(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Chat input */}
                <form onSubmit={handleSendMessage} className="border-t border-zinc-800 p-3">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send a message..."
                      className="flex-1 border-zinc-700 bg-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!chatInput.trim()}
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {sidePanel === "participants" && (
              <ScrollArea className="flex-1 p-3">
                <div className="flex flex-col gap-1">
                  {participants.map((user) => {
                    const isCurrentUser = user.id === currentUserId;
                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-800/50"
                      >
                        <Avatar size="sm">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-1 flex-col">
                          <span className="text-sm text-zinc-200">
                            {user.name}
                            {isCurrentUser && (
                              <span className="ml-1 text-xs text-zinc-500">(You)</span>
                            )}
                          </span>
                          <span className="text-xs text-zinc-500">{user.role}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              "rounded-full p-1",
                              isCurrentUser && !isMicOn ? "bg-red-500/20" : "bg-zinc-800",
                            )}
                          >
                            {isCurrentUser && !isMicOn ? (
                              <MicOff className="size-3 text-red-400" />
                            ) : (
                              <Mic className="size-3 text-zinc-400" />
                            )}
                          </div>
                          <div
                            className={cn(
                              "rounded-full p-1",
                              isCurrentUser && !isCameraOn ? "bg-red-500/20" : "bg-zinc-800",
                            )}
                          >
                            {isCurrentUser && !isCameraOn ? (
                              <CameraOff className="size-3 text-red-400" />
                            ) : (
                              <Camera className="size-3 text-zinc-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Bottom control bar */}
      <div className="flex items-center justify-center gap-2 border-t border-zinc-800 bg-zinc-900/80 px-4 py-3">
        {/* Mic toggle */}
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={toggleMic}
          className={cn(
            "rounded-full",
            isMicOn
              ? "bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-400",
          )}
        >
          {isMicOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </Button>

        {/* Camera toggle */}
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={toggleCamera}
          className={cn(
            "rounded-full",
            isCameraOn
              ? "bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-400",
          )}
        >
          {isCameraOn ? <Camera className="size-5" /> : <CameraOff className="size-5" />}
        </Button>

        {/* Screen share */}
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={toggleScreenShare}
          className={cn(
            "rounded-full",
            isScreenSharing
              ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-400"
              : "bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white",
          )}
        >
          {isScreenSharing ? <MonitorOff className="size-5" /> : <MonitorUp className="size-5" />}
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-700" />

        {/* Chat toggle */}
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => togglePanel("chat")}
          className={cn(
            "relative rounded-full",
            sidePanel === "chat"
              ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-400"
              : "bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white",
          )}
        >
          <MessageSquare className="size-5" />
          {chatMessages.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
              {chatMessages.length > 9 ? "9+" : chatMessages.length}
            </span>
          )}
        </Button>

        {/* Participants toggle */}
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => togglePanel("participants")}
          className={cn(
            "rounded-full",
            sidePanel === "participants"
              ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-400"
              : "bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white",
          )}
        >
          <Users className="size-5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-700" />

        {/* Leave call */}
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={handleLeave}
          className="rounded-full bg-red-600 text-white hover:bg-red-700 hover:text-white"
        >
          <PhoneOff className="size-5" />
        </Button>
      </div>
    </div>
  );
};
