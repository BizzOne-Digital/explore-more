"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

interface ConversationItem {
  _id: string;
  subject: string;
  parentId?: { name?: string; email?: string } | null;
  studentId?: { name?: string } | null;
  staffUnread: number;
  lastMessageAt?: string;
}

interface ParentOption {
  _id: string;
  name: string;
  email: string;
}

export function StaffMessagesClient({
  conversations: initial,
}: {
  conversations: ConversationItem[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [parentId, setParentId] = useState("");
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<
    Array<{ _id: string; body: string; senderId: { name: string }; createdAt: string }>
  >([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!composeOpen || parents.length > 0) return;
    void fetch("/api/staff/parents")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setParents(json.data ?? []);
      })
      .catch(() => setError("Could not load parent list."));
  }, [composeOpen, parents.length]);

  async function loadThread(id: string) {
    setComposeOpen(false);
    setSelectedId(id);
    const res = await fetch(`/api/staff/messages/thread?conversationId=${id}`);
    const json = await res.json();
    if (json.success) setMessages(json.data.messages);
    router.refresh();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = selectedId
        ? { conversationId: selectedId, body }
        : { parentId, subject, body };

      const res = await fetch("/api/staff/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to send message");
        return;
      }

      setBody("");
      setSubject("");
      setParentId("");
      setComposeOpen(false);

      const conversationId = json.data?.conversation?._id ?? selectedId;
      if (conversationId) {
        await loadThread(conversationId);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const selected = initial.find((c) => c._id === selectedId);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-explore-charcoal">Inbox</h3>
          <button
            type="button"
            onClick={() => {
              setComposeOpen(true);
              setSelectedId(null);
              setMessages([]);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-explore-teal px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Message Parent
          </button>
        </div>
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
        {selected && !composeOpen && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{selected.subject}</p>
            <p className="text-xs text-explore-charcoal/50">
              Parent: {selected.parentId?.name} ({selected.parentId?.email})
            </p>
          </div>
        )}

        {selectedId && !composeOpen && (
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

        {(selectedId || composeOpen) ? (
          <form onSubmit={sendMessage} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
            {composeOpen && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-explore-charcoal">
                    Parent
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    required
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">Select a parent…</option>
                    {parents.map((parent) => (
                      <option key={parent._id} value={parent._id}>
                        {parent.name} ({parent.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-explore-charcoal">
                    Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What is this about?"
                    required
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={composeOpen ? "Write your message to the parent…" : "Type your reply to the parent…"}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Sending…" : composeOpen ? "Send Message" : "Send Reply"}
              </button>
              {composeOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setComposeOpen(false);
                    setError("");
                  }}
                  className="rounded-lg border border-explore-charcoal/20 px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-explore-charcoal/60">
            Select a conversation to reply, or click <strong>Message Parent</strong> to start a new one.
          </p>
        )}
      </div>
    </div>
  );
}
