"use client";

import { useRef, useState } from "react";
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

interface MessageAttachment {
  path: string;
  originalName: string;
  mimeType: string;
}

interface ThreadMessage {
  _id: string;
  body: string;
  senderId: { name: string };
  createdAt: string;
  attachments?: MessageAttachment[];
}

export function ParentMessagesClient({
  conversations: initial,
  staff,
}: {
  conversations: Conversation[];
  staff: StaffMember[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversations] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [body, setBody] = useState("");
  const [staffId, setStaffId] = useState(staff[0]?._id ?? "");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadThread(id: string) {
    setSelectedId(id);
    const res = await fetch(`/api/parent/messages/thread?conversationId=${id}`);
    const json = await res.json();
    if (json.success) setMessages(json.data.messages);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("body", body);
    if (selectedId) formData.set("conversationId", selectedId);
    else {
      formData.set("staffId", staffId);
      formData.set("subject", subject);
    }

    const files = fileInputRef.current?.files;
    if (files) {
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }
    }

    try {
      const res = await fetch("/api/parent/messages", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to send message");
        return;
      }

      setBody("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
      if (selectedId) await loadThread(selectedId);
    } catch {
      setError("Failed to send message");
    } finally {
      setLoading(false);
    }
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
          <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl bg-white p-4 shadow-sm">
            {messages.map((m) => (
              <div key={m._id} className="rounded-lg bg-explore-cream p-3 text-sm">
                <p className="text-xs font-semibold text-explore-teal">{m.senderId?.name}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.attachments.map((file) => (
                      <a
                        key={file.path}
                        href={`/api/files/private/${file.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs font-semibold text-explore-teal hover:underline"
                      >
                        📎 {file.originalName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendMessage} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          {!selectedId && (
            <>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} — {s.title}
                  </option>
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
          <input ref={fileInputRef} type="file" multiple className="text-sm" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
