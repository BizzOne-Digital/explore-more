"use client";

import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { MessageAttachmentField } from "@/components/messaging/MessageAttachmentField";

type Colleague = { id: string; name: string; email: string; staffId?: string };

type Conversation = {
  _id: string;
  subject: string;
  lastMessageAt: string;
};

export function TeacherColleagueMessagesClient() {
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [directory, setDirectory] = useState<Colleague[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/teacher/colleague-messages")
      .then((r) => r.json())
      .then((json) => {
        setSchoolName(json.school?.name ?? null);
        setNotice(json.message ?? null);
        setDirectory(json.colleagues ?? []);
        setConversations(json.conversations ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("recipientId", recipientId);
      formData.set("subject", subject);
      formData.set("body", body);
      for (const file of attachedFiles) {
        formData.append("files", file);
      }

      const res = await fetch("/api/teacher/colleague-messages", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send");
      setBody("");
      setSubject("");
      setAttachedFiles([]);
      const refresh = await fetch("/api/teacher/colleague-messages");
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
        <Loader className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <h3 className="font-semibold text-explore-charcoal">Your school</h3>
          <p className="mt-1 text-sm text-gray-500">
            {schoolName
              ? `${schoolName} — messages stay within your school only.`
              : "No school on file yet."}
          </p>
          {notice && <p className="mt-2 text-sm text-amber-700">{notice}</p>}
        </div>

        <form onSubmit={sendMessage} className="space-y-3">
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            required
          >
            <option value="">Select colleague</option>
            {directory.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={4}
            placeholder="Message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <MessageAttachmentField
            files={attachedFiles}
            onChange={setAttachedFiles}
            disabled={sending}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending || !schoolName}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send to colleague"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-explore-charcoal">Recent threads</h3>
        {conversations.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No conversations yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {conversations.map((c) => (
              <li key={c._id} className="rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <p className="font-medium">{c.subject}</p>
                <p className="text-xs text-gray-400">
                  {new Date(c.lastMessageAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
