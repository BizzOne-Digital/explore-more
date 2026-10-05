"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  GraduationCap,
  Home,
  Loader2,
  PenLine,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { ExploreSearchLogo } from "@/components/chat/ExploreSearchLogo";
import { GoogleStyleSearchResults } from "@/components/chat/GoogleStyleSearchResults";
import { useEducationalChat } from "@/components/chat/useEducationalChat";
import { COMPANY } from "@/lib/constants";
import { LEARNING_TOPICS, type LearningTopicId } from "@/lib/chat/constants";

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
    const prefix = topic === "all" ? "" : `[${activeTopic.label}] `;
    const ok = await sendMessage(`${prefix}${input}`);
    if (ok) setInput("");
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <Image
          src="/learning-assistant/hero-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/25 to-black/55"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <ExploreSearchLogo size="header" href="/" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-md transition hover:bg-black/40"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Back to site</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-6 pt-2 sm:px-6 sm:pb-8">
        <div className="text-center">
          <div className="mx-auto flex justify-center px-2">
            <ExploreSearchLogo size="hero" />
          </div>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
            {COMPANY.tagline} — educational answers only.
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white px-4 py-2.5 shadow-2xl shadow-black/30 sm:px-5 sm:py-3">
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

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:grid-cols-6 sm:gap-3">
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
                      ? "border-explore-lime/60 bg-black/35 shadow-lg shadow-explore-lime/15"
                      : "border-white/20 bg-black/25 hover:bg-black/35"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-explore-lime" : "text-white/85"}`} />
                  <span className="text-[10px] font-semibold leading-tight text-white/90 sm:text-xs">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {(hasUserMessages || loading) && (
          <div ref={listRef} aria-live="polite">
            <GoogleStyleSearchResults messages={messages} loading={loading} />
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}
      </main>

      <footer className="relative z-10 py-3 text-center text-[11px] text-white/50">
        Powered by {COMPANY.name}
      </footer>
    </div>
  );
}
