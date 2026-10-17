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
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useWebRTC } from "@/hooks/meetings";
import type { Meeting, User } from "@/types";

interface MeetingRoomProps {
  meeting: Meeting;
  users: User[];
  currentUserId: string;
  currentUserName: string;
  getToken: () => Promise<string | null>;
  onLeave: () => void;
}

type SidePanel = "chat" | "participants" | null;

const RemoteVideo = ({ stream }: { stream: MediaStream }) => {
  const ref = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="size-full object-cover" />;
};

export const MeetingRoom = ({
  meeting,
  users,
  currentUserId,
  currentUserName,
  getToken,
  onLeave,
}: MeetingRoomProps) => {
  const {
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
  } = useWebRTC({
    roomId: meeting.room_id,
    userId: currentUserId,
    userName: currentUserName,
    getToken,
  });

  const [sidePanel, setSidePanel] = React.useState<SidePanel>(null);
  const [chatInput, setChatInput] = React.useState("");
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const localVideoRef = React.useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && localStream) node.srcObject = localStream;
    },
    [localStream],
  );

  const screenVideoRef = React.useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && screenStream) node.srcObject = screenStream;
    },
    [screenStream],
  );

  React.useEffect(() => {
    const iv = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name ?? userId;
  const getUserAvatar = (userId: string) => users.find((u) => u.id === userId)?.avatar ?? "";
  const getUserInitials = (userId: string) =>
    getUserName(userId)
      .split(" ")
      .map((n) => n[0])
      .join("");

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0)
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatMessageTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleLeave = () => {
    disconnect();
    onLeave();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const togglePanel = (panel: SidePanel) => {
    setSidePanel((prev) => (prev === panel ? null : panel));
  };

  const totalInRoom = 1 + peers.length;
  const gridCols = isScreenSharing
    ? "grid-cols-1"
    : totalInRoom <= 1
      ? "grid-cols-1"
      : totalInRoom <= 4
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <div className="flex h-full flex-col" style={{ background: "#111" }}>
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
              {totalInRoom} participant{totalInRoom !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-1">
            {isConnected ? (
              <Wifi className="size-3 text-emerald-400" />
            ) : (
              <WifiOff className="size-3 text-red-400" />
            )}
            <span className={cn("text-xs", isConnected ? "text-emerald-400" : "text-red-400")}>
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>

          {mediaError && (
            <div className="max-w-xs rounded-full bg-amber-500/20 px-3 py-1">
              <span className="truncate text-xs text-amber-400">{mediaError}</span>
            </div>
          )}

          <div className="rounded-full bg-zinc-800 px-3 py-1">
            <span className="font-mono text-xs text-zinc-300">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className={cn("flex-1 p-3 transition-all", sidePanel ? "pr-0" : "")}>
          {isScreenSharing ? (
            <div className="flex h-full flex-col gap-2">
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

              <div className="flex h-28 shrink-0 gap-2 overflow-x-auto">
                <div className="relative flex w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 ring-2 ring-indigo-500/60">
                  {localStream && (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="size-full -scale-x-100 object-cover"
                    />
                  )}
                  {(!isCameraOn || !localStream) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
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

                {peers.map((peer) => (
                  <div
                    key={peer.socketId}
                    className="relative flex w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800"
                  >
                    {peer.stream && <RemoteVideo stream={peer.stream} />}
                    {(!peer.isCameraOn || !peer.stream) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                        <Avatar size="sm">
                          <AvatarImage src={getUserAvatar(peer.userId)} alt={peer.userName} />
                          <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                            {getUserInitials(peer.userId)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-zinc-400">
                          {peer.userName.split(" ")[0]}
                        </span>
                      </div>
                    )}
                    {!peer.isMicOn && (
                      <div className="absolute top-1 right-1 rounded-full bg-red-500/80 p-0.5">
                        <MicOff className="size-2.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "grid h-full gap-2",
                gridCols,
                totalInRoom <= 2 ? "grid-rows-1" : "auto-rows-fr",
              )}
            >
              <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-zinc-900 ring-2 ring-indigo-500/60">
                {localStream && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="size-full -scale-x-100 object-cover"
                  />
                )}
                {(!isCameraOn || !localStream) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                    <Avatar size="lg" className="size-16 ring-0 after:ring-0">
                      <AvatarImage src={getUserAvatar(currentUserId)} />
                      <AvatarFallback className="bg-zinc-700 text-lg text-zinc-300">
                        {getUserInitials(currentUserId)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-zinc-200">You</span>
                    {!isCameraOn && <span className="text-xs text-zinc-500">Camera off</span>}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
                  <span className="text-xs text-zinc-200">You</span>
                  {!isMicOn && <MicOff className="size-3 text-red-400" />}
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-indigo-500/20 px-1.5 py-0 text-[10px] text-indigo-300">
                    You
                  </Badge>
                </div>
              </div>

              {peers.map((peer) => (
                <div
                  key={peer.socketId}
                  className="relative flex items-center justify-center overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800"
                >
                  {peer.stream && <RemoteVideo stream={peer.stream} />}
                  {(!peer.isCameraOn || !peer.stream) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                      <Avatar size="lg" className="size-16 ring-0 after:ring-0">
                        <AvatarImage src={getUserAvatar(peer.userId)} alt={peer.userName} />
                        <AvatarFallback className="bg-zinc-700 text-lg text-zinc-300">
                          {getUserInitials(peer.userId)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-zinc-200">{peer.userName}</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
                    <span className="text-xs text-zinc-200">{peer.userName.split(" ")[0]}</span>
                    {!peer.isMicOn && <MicOff className="size-3 text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {sidePanel && (
          <div className="flex w-80 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900/80">
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
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-800/50">
                    <Avatar size="sm">
                      <AvatarImage src={getUserAvatar(currentUserId)} />
                      <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                        {getUserInitials(currentUserId)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm text-zinc-200">
                        {currentUserName}
                        <span className="ml-1 text-xs text-zinc-500">(You)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "rounded-full p-1",
                          !isMicOn ? "bg-red-500/20" : "bg-zinc-800",
                        )}
                      >
                        {!isMicOn ? (
                          <MicOff className="size-3 text-red-400" />
                        ) : (
                          <Mic className="size-3 text-zinc-400" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "rounded-full p-1",
                          !isCameraOn ? "bg-red-500/20" : "bg-zinc-800",
                        )}
                      >
                        {!isCameraOn ? (
                          <CameraOff className="size-3 text-red-400" />
                        ) : (
                          <Camera className="size-3 text-zinc-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {peers.map((peer) => (
                    <div
                      key={peer.socketId}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-800/50"
                    >
                      <Avatar size="sm">
                        <AvatarImage src={getUserAvatar(peer.userId)} alt={peer.userName} />
                        <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                          {getUserInitials(peer.userId)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm text-zinc-200">{peer.userName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "rounded-full p-1",
                            !peer.isMicOn ? "bg-red-500/20" : "bg-zinc-800",
                          )}
                        >
                          {!peer.isMicOn ? (
                            <MicOff className="size-3 text-red-400" />
                          ) : (
                            <Mic className="size-3 text-zinc-400" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "rounded-full p-1",
                            !peer.isCameraOn ? "bg-red-500/20" : "bg-zinc-800",
                          )}
                        >
                          {!peer.isCameraOn ? (
                            <CameraOff className="size-3 text-red-400" />
                          ) : (
                            <Camera className="size-3 text-zinc-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-zinc-800 bg-zinc-900/80 px-4 py-3">
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
