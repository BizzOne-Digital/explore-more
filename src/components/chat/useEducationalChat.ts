"use client";

import { useCallback, useRef, useState } from "react";
import { LEARNING_ASSISTANT_WELCOME } from "@/lib/chat/constants";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useEducationalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: LEARNING_ASSISTANT_WELCOME },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return false;

      const userMsg: ChatMessage = { id: newId(), role: "user", content: trimmed };
      const history = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg]);
      setError("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat/educational", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const json = await res.json();
        if (!res.ok || !json.reply) {
          throw new Error(json.error || "Could not get a reply");
        }
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "assistant", content: String(json.reply) },
        ]);
        requestAnimationFrame(scrollToBottom);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, scrollToBottom]
  );

  const hasUserMessages = messages.some((m) => m.role === "user");

  return {
    messages,
    loading,
    error,
    listRef,
    sendMessage,
    hasUserMessages,
    scrollToBottom,
  };
}
