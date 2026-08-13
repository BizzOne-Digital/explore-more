"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StaffMember {
  _id: string;
  name: string;
  title: string;
  categories: Array<{ id: string; label: string }>;
}

interface Conversation {
  _id: string;
  subject: string;
  staffId: { name: string };
  parentUnread: number;
  lastMessageAt: string;
}

export function ParentMessagesClient({
  conversations: initial,
  staff,
}: {
  conversations: Conversation[];
  staff: StaffMember[];
}) {
  const router = useRouter();
  const [conversations] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ _id: string; body: string; senderId: { name: string }; createdAt: string }>>([]);
  const [body, setBody] = useState("");
  const [staffId, setStaffId] = useState(staff[0]?._id ?? "");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadThread(id: string) {
    setSelectedId(id);
    const res = await fetch(`/api/parent/messages/thread?conversationId=${id}`);
    const json = await res.json();
    if (json.success) setMessages(json.data.messages);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.set("body", body);
    if (selectedId) formData.set("conversationId", selectedId);
    else {
      formData.set("staffId", staffId);
      formData.set("subject", subject);
    }

    await fetch("/api/parent/messages", { method: "POST", body: formData });
    setBody("");
    setLoading(false);
    router.refresh();
    if (selectedId) loadThread(selectedId);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        <h3 className="font-semibold text-explore-charcoal">Conversations</h3>
        {conversations.length === 0 && (
          <p className="text-sm text-explore-charcoal/60">No conversations yet. Start one below.</p>
        )}
        {conversations.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => loadThread(c._id)}
            className="w-full rounded-xl border border-explore-charcoal/10 bg-white p-4 text-left hover:bg-explore-sand"
          >
            <p className="font-medium text-sm">{c.subject}</p>
            <p className="text-xs text-explore-charcoal/50">{c.staffId?.name}</p>
            {c.parentUnread > 0 && (
              <span className="mt-1 inline-block rounded-full bg-explore-orange px-2 py-0.5 text-xs text-white">
                {c.parentUnread} new
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="lg:col-span-2 space-y-4">
        {selectedId && (
          <div className="rounded-xl bg-white p-4 shadow-sm max-h-80 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div key={m._id} className="rounded-lg bg-explore-cream p-3 text-sm">
                <p className="text-xs font-semibold text-explore-teal">{m.senderId?.name}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendMessage} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
          {!selectedId && (
            <>
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} — {s.title}</option>
                ))}
              </select>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Write your message…"
            required
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input type="file" name="files" multiple className="text-sm" />
          <button type="submit" disabled={loading} className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
