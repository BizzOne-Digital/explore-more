"use client";

import { AssistantAnswerMarkdown } from "@/components/chat/AssistantAnswerMarkdown";
import type { ChatMessage } from "@/components/chat/useEducationalChat";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { COMPANY } from "@/lib/constants";

type ResultsTab = "all" | "study-guide" | "key-facts";

const RESULT_TABS: { id: ResultsTab; label: string; targetId: string }[] = [
  { id: "all", label: "All", targetId: "explore-search-results" },
  { id: "study-guide", label: "Study guide", targetId: "explore-study-guide" },
  { id: "key-facts", label: "Key facts", targetId: "explore-key-facts" },
];

function extractTitle(content: string): string {
  const match = content.match(/^##\s+(.+)$/m);
  if (match) return match[1].replace(/\*\*/g, "").trim();
  const first = content.split("\n").find((l) => l.trim().length > 0);
  return first?.slice(0, 80) ?? "Learning result";
}

function extractQuickFacts(content: string): Array<{ label: string; value: string }> {
  const facts: Array<{ label: string; value: string }> = [];
  const tableMatch = content.match(/\|([^|\n]+)\|([^|\n]+)\|/g);
  if (tableMatch) {
    for (const row of tableMatch.slice(0, 6)) {
      const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2 && !/^-+$/.test(cells[0])) {
        facts.push({ label: cells[0], value: cells[1] });
      }
    }
  }
  if (facts.length > 0) return facts.slice(0, 5);

  const bullets = content.match(/^[-*]\s+\*\*([^*]+)\*\*[:\s—-]+(.+)$/gm);
  if (bullets) {
    for (const b of bullets.slice(0, 5)) {
      const m = b.match(/^[-*]\s+\*\*([^*]+)\*\*[:\s—-]+(.+)$/);
      if (m) facts.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }
  return facts;
}

export function GoogleStyleSearchResults({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading: boolean;
}) {
  const userMessages = messages.filter((m) => m.role === "user");
  const lastUser = userMessages[userMessages.length - 1];
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "welcome");

  if (!lastUser) return null;

  const overviewTitle = lastAssistant ? extractTitle(lastAssistant.content) : "Searching…";
  const quickFacts = lastAssistant ? extractQuickFacts(lastAssistant.content) : [];
  const [activeTab, setActiveTab] = useState<ResultsTab>("all");

  useEffect(() => {
    setActiveTab("all");
  }, [lastUser?.id, lastAssistant?.id]);

  function goToTab(tab: ResultsTab, targetId: string) {
    setActiveTab(tab);
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="explore-search-results" className="mt-6 scroll-mt-6 space-y-4 sm:mt-8">
      <div
        className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 text-sm"
        role="tablist"
        aria-label="Result sections"
      >
        {RESULT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={tab.targetId}
            onClick={() => goToTab(tab.id, tab.targetId)}
            className={cn(
              "rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-explore-lime",
              activeTab === tab.id
                ? "bg-white/15 font-semibold text-white"
                : "text-white/50 hover:text-white/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/45">
        About {Math.max(1, userMessages.length)} result{userMessages.length === 1 ? "" : "s"} · Explore Search
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6">
        <article className="space-y-4 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-explore-lime/90">
            Educational overview
          </p>
          <h2 className="font-display text-lg font-bold text-sky-200 sm:text-xl">{overviewTitle}</h2>
          <p className="text-xs text-white/50">
            You asked: <span className="text-white/80">&ldquo;{lastUser.content}&rdquo;</span>
          </p>

          {lastAssistant ? (
            <div id="explore-study-guide" className="scroll-mt-24" role="tabpanel" aria-label="Study guide">
              <AssistantAnswerMarkdown content={lastAssistant.content} />
            </div>
          ) : loading ? (
            <p className="text-sm text-white/60">Gathering a clear, student-friendly answer…</p>
          ) : null}

          <p className="flex items-center gap-1.5 border-t border-white/10 pt-3 text-[11px] text-white/40">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Explore Search · {COMPANY.name}
          </p>
        </article>

        <aside
          id="explore-key-facts"
          className="h-fit scroll-mt-24 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md lg:sticky lg:top-4"
          role="tabpanel"
          aria-label="Key facts"
        >
          <h3 className="text-sm font-semibold text-white">Quick look</h3>
          {quickFacts.length > 0 ? (
            <dl className="mt-3 space-y-2.5 text-sm">
              {quickFacts.map((fact) => (
                <div key={fact.label} className="border-b border-white/10 pb-2 last:border-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 text-white/90">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-white/55">
              Key facts from the answer will appear here when the assistant uses headings, bullets, or a
              quick-facts table.
            </p>
          )}
        </aside>
      </div>

      {userMessages.length > 1 && (
        <details className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
          <summary className="cursor-pointer font-medium text-white/85">Earlier questions</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {userMessages.slice(0, -1).map((m) => (
              <li key={m.id}>{m.content}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
