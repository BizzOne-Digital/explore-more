"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConversationItem {
  _id: string;
  subject: string;
  parentId?: { name?: string; email?: string } | null;
  studentId?: { name?: string } | null;
  staffUnread: number;
  lastMessageAt?: string;
}

export function StaffMessagesClient({
  conversations: initial,
}: {
  conversations: ConversationItem[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{ _id: string; body: string; senderId: { name: string }; createdAt: string }>
  >([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadThread(id: string) {
    setSelectedId(id);
    const res = await fetch(`/api/staff/messages/thread?conversationId=${id}`);
    const json = await res.json();
    if (json.success) setMessages(json.data.messages);
    router.refresh();
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    try {
      await fetch("/api/staff/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, body }),
      });
      setBody("");
      await loadThread(selectedId);
    } finally {
      setLoading(false);
    }
  }

  const selected = initial.find((c) => c._id === selectedId);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        <h3 className="font-semibold text-explore-charcoal">Inbox</h3>
        {initial.length === 0 && (
          <p className="text-sm text-explore-charcoal/60">No parent messages yet.</p>
        )}
        {initial.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => void loadThread(c._id)}
            className={`w-full rounded-xl border p-4 text-left transition ${
              selectedId === c._id
                ? "border-explore-teal bg-explore-teal/5"
                : "border-explore-charcoal/10 bg-white hover:bg-explore-sand"
            }`}
          >
            <p className="font-medium text-sm">{c.subject}</p>
            <p className="text-xs text-explore-charcoal/50">
              {c.parentId?.name ?? "Parent"} · {c.parentId?.email}
            </p>
            {c.staffUnread > 0 && (
              <span className="mt-1 inline-block rounded-full bg-explore-orange px-2 py-0.5 text-xs text-white">
                {c.staffUnread} new
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="lg:col-span-2 space-y-4">
        {selected && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{selected.subject}</p>
            <p className="text-xs text-explore-charcoal/50">
              Parent: {selected.parentId?.name} ({selected.parentId?.email})
            </p>
          </div>
        )}

        {selectedId && (
          <div className="rounded-xl bg-white p-4 shadow-sm max-h-80 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div key={m._id} className="rounded-lg bg-explore-cream p-3 text-sm">
                <p className="text-xs font-semibold text-explore-teal">{m.senderId?.name}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[10px] text-explore-charcoal/40">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {selectedId ? (
          <form onSubmit={sendReply} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Type your reply to the parent…"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send Reply"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-explore-charcoal/60">
            Select a conversation to view and reply.
          </p>
        )}
      </div>
    </div>
  );
}
