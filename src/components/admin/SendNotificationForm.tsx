"use client";

import { useEffect, useState } from "react";
import { Send, Loader } from "lucide-react";
import { containsLocalFilesystemPath } from "@/lib/notifications/display";

export function SendNotificationForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all_parents");
  const [priority, setPriority] = useState("normal");
  const [attachmentPath, setAttachmentPath] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientHint, setRecipientHint] = useState("");
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRecipientCount() {
      setLoadingRecipients(true);
      try {
        const response = await fetch(
          `/api/admin/email-campaigns/recipients?audience=${encodeURIComponent(audience)}`
        );
        const data = await response.json();
        if (cancelled) return;

        setRecipientCount(data.data?.count ?? 0);
        setRecipientHint(data.data?.hint ?? "");
      } catch {
        if (!cancelled) {
          setRecipientCount(null);
          setRecipientHint("");
        }
      } finally {
        if (!cancelled) setLoadingRecipients(false);
      }
    }

    loadRecipientCount();
    return () => {
      cancelled = true;
    };
  }, [audience]);

  async function handleAttachment(file: File | null) {
    if (!file) {
      setAttachmentPath("");
      setAttachmentName("");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/email-campaigns/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      setAttachmentPath(data.data.url);
      setAttachmentName(data.data.originalName || file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (containsLocalFilesystemPath(message) && !attachmentPath) {
      setError(
        "You pasted a file path from your computer. Use the Attachment field below to upload the PDF — parents cannot open local paths."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          audience,
          priority,
          attachmentPath: attachmentPath || undefined,
          attachmentName: attachmentName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      setSuccess(data.message || "Notification sent successfully!");
      setTitle("");
      setMessage("");
      setAudience("all_parents");
      setPriority("normal");
      setAttachmentPath("");
      setAttachmentName("");

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

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Attachment (optional — PDF, images, documents)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
          disabled={uploading}
          onChange={(e) => void handleAttachment(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white file:mr-3 file:rounded file:border-0 file:bg-explore-teal file:px-3 file:py-1 file:text-white"
        />
        {uploading && <p className="mt-1 text-xs text-white/50">Uploading…</p>}
        {attachmentName && (
          <p className="mt-1 text-xs text-green-300">Attached: {attachmentName}</p>
        )}
        {containsLocalFilesystemPath(message) && !attachmentPath && (
          <p className="mt-2 text-xs text-amber-200">
            Your message looks like a local file path. Upload the file using the field above so
            parents can open it.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        {loadingRecipients ? (
          <span>Checking recipients...</span>
        ) : recipientCount === null ? (
          <span>Unable to load recipient count.</span>
        ) : recipientCount > 0 ? (
          <span>
            This will reach <strong className="text-white">{recipientCount}</strong> parent
            {recipientCount === 1 ? "" : "s"} by email and in the parent portal.
          </span>
        ) : audience === "all_parents" ? (
          <span>
            No parent accounts yet. The notification will still be saved and shown in the parent
            portal when parents sign up.
          </span>
        ) : (
          <span>{recipientHint || "No recipients found for this audience."}</span>
        )}
      </div>

      {/* Error/Success */}
      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/30 p-3">
          <p className="text-sm text-green-300">✓ {success}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          loading ||
          loadingRecipients ||
          (recipientCount === 0 && audience !== "all_parents")
        }
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
