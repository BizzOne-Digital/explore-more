"use client";

import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import {
  STAFF_MESSAGE_CATEGORIES,
  STAFF_MESSAGE_CATEGORY_LABELS,
} from "@/lib/tutor/constants";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  tutorId?: string;
  title?: string;
  categories: string[];
};

type Conversation = {
  _id: string;
  subject: string;
  category: string;
  lastMessageAt: string;
  initiatorId: { name?: string };
  recipientId: { name?: string };
};

export function TutorStaffMessagesClient() {
  const [directory, setDirectory] = useState<StaffMember[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("administration");
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tutor/staff-conversations")
      .then((r) => r.json())
      .then((json) => {
        setDirectory(json.directory ?? []);
        setConversations(json.conversations ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/tutor/staff-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, subject, body, category }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send");
      setBody("");
      setSubject("");
      const refresh = await fetch("/api/tutor/staff-conversations");
      const data = await refresh.json();
      setConversations(data.conversations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Staff Directory</h3>
        <p className="mt-1 text-sm text-gray-500">
          Message administration, academic support, tutor support, or technical support.
        </p>
        <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {directory.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => setRecipientId(member.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  recipientId === member.id ? "border-violet-400 bg-violet-50" : "border-gray-100"
                }`}
              >
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-gray-500">{member.title ?? member.role}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <form onSubmit={sendMessage} className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
          <h3 className="font-semibold">New Staff Message</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {STAFF_MESSAGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {STAFF_MESSAGE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Message"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !recipientId}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send message"}
          </button>
        </form>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Recent Conversations</h3>
          {conversations.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No staff messages yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {conversations.map((c) => (
                <li key={c._id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium">{c.subject}</p>
                  <p className="text-xs text-gray-400">
                    {STAFF_MESSAGE_CATEGORY_LABELS[c.category as keyof typeof STAFF_MESSAGE_CATEGORY_LABELS] ?? c.category}
                    {" · "}
                    {new Date(c.lastMessageAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
