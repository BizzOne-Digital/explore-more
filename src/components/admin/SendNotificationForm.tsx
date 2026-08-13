"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SendNotificationForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "all_parents",
    priority: "normal",
    requiresAcknowledgment: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sendNow: true }),
    });
    const json = await res.json();
    setMessage(json.success ? "Notification sent!" : json.error);
    if (json.success) {
      setForm({ title: "", message: "", audience: "all_parents", priority: "normal", requiresAcknowledgment: false });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 max-w-2xl">
      <h3 className="font-display text-lg font-semibold text-white">Send Parent Notification</h3>
      {message && <p className="text-sm text-explore-lime">{message}</p>}
      <input
        placeholder="Notification Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        required
      />
      <textarea
        placeholder="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        rows={5}
        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={form.audience}
          onChange={(e) => setForm({ ...form, audience: e.target.value })}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <option value="all_parents">All Parents</option>
          <option value="homeschool_families">Homeschool / Portfolio Families</option>
          <option value="tutoring_families">Tutoring Families</option>
        </select>
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <option value="normal">Normal</option>
          <option value="important">Important</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          checked={form.requiresAcknowledgment}
          onChange={(e) => setForm({ ...form, requiresAcknowledgment: e.target.checked })}
        />
        Require parents to acknowledge
      </label>
      <button type="submit" disabled={loading} className="rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? "Sending…" : "Send Now"}
      </button>
    </form>
  );
}
