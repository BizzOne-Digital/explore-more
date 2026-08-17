"use client";

import { useState } from "react";
import { Send, Loader } from "lucide-react";

export function SendNotificationForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all_parents");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          audience,
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      setSuccess(true);
      setTitle("");
      setMessage("");
      setAudience("all_parents");
      setPriority("normal");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white/10 border border-white/20 p-6 space-y-4">
      <h3 className="font-semibold text-white mb-4">Create New Notification</h3>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-white/70 mb-2">
          Notification Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Important Update About..."
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-2">
          Message *
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="Enter your message here..."
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />
      </div>

      {/* Audience & Priority */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-white/70 mb-2">
            Send To *
          </label>
          <select
            id="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white focus:border-white/40 focus:outline-none"
          >
            <option value="all_parents">All Parents</option>
            <option value="portfolio_parents">Portfolio Parents Only</option>
            <option value="tutoring_parents">Tutoring Parents Only</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-white/70 mb-2">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white focus:border-white/40 focus:outline-none"
          >
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Error/Success */}
      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/30 p-3">
          <p className="text-sm text-green-300">✓ Notification sent successfully!</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-explore-teal px-4 py-3 text-sm font-semibold text-white hover:bg-explore-teal/90 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Notification
          </>
        )}
      </button>
    </form>
  );
}
