import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const { getToken } = useAuth();

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = { role: "user", content };
      const history = [...messages, userMessage];
      setMessages(history);
      setIsLoading(true);
      setActiveTools([]);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Stream failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        const toolsCalled: string[] = [];
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (event.type === "tool_call") {
                toolsCalled.push(event.name);
                setActiveTools([...toolsCalled]);
              } else if (event.type === "text") {
                assistantContent += event.content;
                setMessages([
                  ...history,
                  { role: "assistant", content: assistantContent, toolCalls: toolsCalled },
                ]);
              }
            } catch {}
          }
        }

        if (!assistantContent) {
          setMessages([
            ...history,
            { role: "assistant", content: "Sorry, I couldn't generate a response." },
          ]);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages([
            ...history,
            { role: "assistant", content: "Sorry, something went wrong. Please try again." },
          ]);
        }
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
          setActiveTools([]);
          abortRef.current = null;
        }
      }
    },
    [messages, getToken],
  );

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setActiveTools([]);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, isLoading, activeTools, sendMessage, clearMessages };
};
