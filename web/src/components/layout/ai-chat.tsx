"use client";

import * as React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/ai";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Minus,
  Maximize2,
  Minimize2,
  Trash2,
  Wrench,
} from "lucide-react";

const SUGGESTIONS = [
  "What tickets are overdue?",
  "Who has the most tickets assigned?",
  "Summarize what's in progress",
  "Any upcoming meetings this week?",
];

const MarkdownMessage = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ href, children }) => {
        if (href?.startsWith("/")) {
          return (
            <Link
              href={href}
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </Link>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        );
      },
      p: ({ children }) => <p className="my-1">{children}</p>,
      ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
      ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
      li: ({ children }) => <li className="my-0.5">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      code: ({ children }) => (
        <code className="bg-muted rounded px-1 py-0.5 text-xs">{children}</code>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

const TOOL_LABELS: Record<string, string> = {
  get_tickets: "Searching tickets",
  get_overdue_tickets: "Checking overdue tickets",
  get_team_workload: "Analyzing workload",
  get_workspace_summary: "Getting workspace summary",
  get_meetings: "Fetching meetings",
};

export const AiChat = () => {
  const { messages, isLoading, activeTools, sendMessage, clearMessages } = useChat();
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    sendMessage(text);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95"
      >
        <Sparkles className="size-4" />
        Ask CollabSpace
      </button>
    );
  }

  return (
    <div
      className={cn(
        "bg-background border-border/60 fixed right-5 bottom-5 z-50 flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all",
        expanded ? "h-[85vh] w-[700px]" : "h-[560px] w-[420px]",
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ask CollabSpace</p>
            <p className="text-muted-foreground text-[10px]">AI workspace assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              clearMessages();
            }}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
              <Sparkles className="size-6 text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">How can I help?</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Ask about tickets, team workload, deadlines, or meetings.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className="border-border/60 hover:border-primary/30 hover:bg-accent/50 rounded-full border px-3 py-1.5 text-xs transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <>
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {msg.toolCalls.map((tool, j) => (
                            <span
                              key={j}
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-500"
                            >
                              <Wrench className="size-2.5" />
                              {TOOL_LABELS[tool] ?? tool}
                            </span>
                          ))}
                        </div>
                      )}
                      <MarkdownMessage content={msg.content} />
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col gap-2">
                {activeTools.map((tool, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs">
                    <Wrench className="size-3 text-indigo-500" />
                    <span className="text-muted-foreground">{TOOL_LABELS[tool] ?? tool}...</span>
                  </div>
                ))}
                <div className="flex justify-start">
                  <div className="bg-muted flex items-center gap-2 rounded-2xl rounded-bl-md px-3.5 py-2.5">
                    <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
                    <span className="text-muted-foreground text-xs">
                      {activeTools.length > 0 ? "Generating response..." : "Thinking..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t p-3">
        <div className="bg-muted/50 flex items-center gap-2 rounded-xl px-3 py-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your workspace..."
            disabled={isLoading}
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground opacity-40",
            )}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
