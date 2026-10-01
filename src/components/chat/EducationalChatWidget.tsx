"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap, Loader2, Send, X } from "lucide-react";
import { COMPANY } from "@/lib/constants";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your Learning Assistant. Ask me about homework, study skills, reading, math, science, or how to explore a topic—you'll get educational help only. How can I help you learn today?",
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function EducationalChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages, loading]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: newId(), role: "user", content: text };
    const nextMessages = [...messages.filter((m) => m.id !== "welcome"), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const history = nextMessages.map((m) => ({ role: m.role, content: m.content }));
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          className="pointer-events-auto flex h-[min(32rem,calc(100dvh-6rem))] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-explore-charcoal/10 bg-white shadow-2xl shadow-explore-charcoal/20"
          role="dialog"
          aria-label="Learning Assistant chat"
        >
          <header className="flex items-start justify-between gap-2 bg-gradient-to-r from-explore-teal to-teal-700 px-4 py-3 text-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 shrink-0" aria-hidden />
                <h2 className="font-display text-base font-bold">Learning Assistant</h2>
              </div>
              <p className="mt-0.5 text-[11px] text-teal-50/90">Educational help only</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/90 hover:bg-white/15"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4"
            data-lenis-prevent
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-explore-teal text-white"
                      : "bg-explore-sand/80 text-explore-charcoal"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-explore-sand/80 px-3 py-2 text-sm text-explore-charcoal/70">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="px-3 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="border-t border-explore-charcoal/10 bg-white p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Ask a learning question…"
                className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-explore-charcoal/15 px-3 py-2 text-sm outline-none focus:border-explore-teal focus:ring-1 focus:ring-explore-teal/30"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-explore-lime text-explore-black transition hover:bg-explore-lime/90 disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-explore-charcoal/45">
              Powered by: {COMPANY.name}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-explore-teal px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-explore-teal/30 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-explore-lime focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-controls="learning-assistant-panel"
      >
        <GraduationCap className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">Ask a learning question</span>
        <span className="sm:hidden">Learn</span>
      </button>
    </div>
  );
}
