"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  GraduationCap,
  Grid3X3,
  Home,
  Loader2,
  PenLine,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useEducationalChat } from "@/components/chat/useEducationalChat";
import { COMPANY } from "@/lib/constants";
import {
  LEARNING_TOPICS,
  type LearningTopicId,
} from "@/lib/chat/constants";

const TOPIC_ICONS: Record<LearningTopicId, typeof Search> = {
  all: Sparkles,
  math: Calculator,
  science: FlaskConical,
  reading: BookOpen,
  study: GraduationCap,
  homework: PenLine,
};

export function LearningAssistantPage() {
  const [topic, setTopic] = useState<LearningTopicId>("all");
  const [input, setInput] = useState("");
  const { messages, loading, error, listRef, sendMessage, hasUserMessages, scrollToBottom } =
    useEducationalChat();

  const activeTopic = LEARNING_TOPICS.find((t) => t.id === topic) ?? LEARNING_TOPICS[0];

  useEffect(() => {
    if (hasUserMessages) scrollToBottom();
  }, [hasUserMessages, messages, loading, scrollToBottom]);

  async function handleSend() {
    const prefix =
      topic === "all"
        ? ""
        : `[${activeTopic.label}] `;
    const ok = await sendMessage(`${prefix}${input}`);
    if (ok) setInput("");
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0a1628] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-teal-900/90 via-[#1a4d5c]/80 to-[#2d1f4e]/90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-amber-200/30 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-explore-teal/40 to-transparent"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Logo href="/" plate className="!bg-white/90" />
        <nav className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md transition hover:bg-white/20"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to site</span>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-8 pt-4 sm:px-6 sm:pt-8">
        <div className="text-center">
          <div className="relative mx-auto mb-4 inline-flex">
            <div
              className="absolute -inset-6 rounded-full border border-white/20 opacity-60"
              style={{ transform: "rotate(-12deg)" }}
              aria-hidden
            />
            <GraduationCap className="relative h-14 w-14 text-explore-lime sm:h-16 sm:w-16" strokeWidth={1.25} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            <span className="text-white">Explore </span>
            <span className="bg-gradient-to-r from-explore-lime to-teal-200 bg-clip-text text-transparent">
              More
            </span>
          </h1>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/50 sm:text-xs">
            Learn · Discover · Grow
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/70 sm:text-base">
            {COMPANY.tagline} — educational answers only, powered by {COMPANY.name}.
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/95 px-4 py-2 shadow-xl shadow-black/20 backdrop-blur-xl sm:px-5 sm:py-3">
            <Search className="h-5 w-5 shrink-0 text-explore-teal" aria-hidden />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={activeTopic.hint}
              maxLength={2000}
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent text-base text-explore-charcoal outline-none placeholder:text-explore-charcoal/45"
              aria-label="Ask a learning question"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-explore-teal text-white transition hover:bg-teal-700 disabled:opacity-40"
              aria-label="Send"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {LEARNING_TOPICS.map((item) => {
              const Icon = TOPIC_ICONS[item.id];
              const active = topic === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTopic(item.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center backdrop-blur-md transition sm:py-4 ${
                    active
                      ? "border-explore-lime/50 bg-white/25 shadow-lg shadow-explore-lime/10"
                      : "border-white/15 bg-white/10 hover:bg-white/15"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-explore-lime" : "text-white/80"}`} />
                  <span className="text-[10px] font-semibold leading-tight text-white/90 sm:text-xs">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {(hasUserMessages || error) && (
          <section
            className="mt-8 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Grid3X3 className="h-4 w-4 text-white/50" />
              <h2 className="text-sm font-semibold text-white/90">Your conversation</h2>
            </div>
            <div
              ref={listRef}
              className="max-h-[min(24rem,50dvh)] space-y-3 overflow-y-auto px-4 py-4"
              data-lenis-prevent
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-explore-teal text-white"
                        : "bg-white/90 text-explore-charcoal"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 text-sm text-explore-charcoal/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}
            </div>
            {error && (
              <p className="border-t border-white/10 px-4 py-2 text-xs text-red-300" role="alert">
                {error}
              </p>
            )}
          </section>
        )}
      </main>

      <footer className="relative z-10 py-4 text-center text-[11px] text-white/40">
        Powered by {COMPANY.name}
      </footer>
    </div>
  );
}
