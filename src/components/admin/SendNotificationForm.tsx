"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, Loader } from "lucide-react";
import { FileUpload } from "@/components/admin/FileUpload";
import {
  AdminSearchableSelect,
  type SearchableOption,
} from "@/components/admin/AdminSearchableSelect";
import { containsLocalFilesystemPath } from "@/lib/notifications/paths";

interface ParentOption {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  guardianId?: string;
}

export function SendNotificationForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all_parents");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [priority, setPriority] = useState("normal");
  const [attachmentPath, setAttachmentPath] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientHint, setRecipientHint] = useState("");
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const parentOptions = useMemo<SearchableOption[]>(
    () =>
      parents.map((parent) => ({
        value: parent._id,
        label: parent.name,
        sublabel: [parent.email, parent.guardianId, parent.phone].filter(Boolean).join(" · "),
        searchText: [parent.name, parent.email, parent.guardianId, parent.phone, parent._id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      })),
    [parents]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadParents() {
      try {
        const response = await fetch("/api/admin/users");
        const data = await response.json();
        if (cancelled || !data.success) return;
        const users = (data.data ?? []) as Array<ParentOption & { role: string }>;
        setParents(users.filter((user) => user.role === "parent"));
      } catch {
        if (!cancelled) setParents([]);
      }
    }

    loadParents();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (audience === "custom") {
      setRecipientCount(selectedParentId ? 1 : 0);
      setRecipientHint(selectedParentId ? "" : "Select a parent account below.");
      setLoadingRecipients(false);
      return;
    }

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
  }, [audience, selectedParentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (audience === "custom" && !selectedParentId) {
      setError("Select a parent account to send this notification.");
      setLoading(false);
      return;
    }

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
          recipientIds: audience === "custom" ? [selectedParentId] : undefined,
        }),
      });

      const rawText = await response.text();
      let data: Record<string, unknown> | null = null;
      if (rawText) {
        try {
          data = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        const apiError =
          data && typeof data.error === "string"
            ? data.error
            : rawText.trim()
              ? rawText.trim().slice(0, 300)
              : null;
        throw new Error(apiError || `Failed to send notification (${response.status})`);
      }

      if (!data) {
        throw new Error("Server returned an unexpected response. Please try again.");
      }

      setSuccess(
        typeof data.message === "string" ? data.message : "Notification sent successfully!"
      );
      setTitle("");
      setMessage("");
      setAudience("all_parents");
      setSelectedParentId("");
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

  const canSubmit =
    !loading &&
    !loadingRecipients &&
    (audience === "all_parents" || (recipientCount ?? 0) > 0);

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white/10 border border-white/20 p-6 space-y-4">
      <h3 className="font-semibold text-white mb-4">Create New Notification</h3>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-white/70 mb-2">
            Send To *
          </label>
          <select
            id="audience"
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value);
              if (e.target.value !== "custom") setSelectedParentId("");
            }}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white focus:border-white/40 focus:outline-none"
          >
            <option value="all_parents">All Parents</option>
            <option value="portfolio_parents">Portfolio Parents Only</option>
            <option value="tutoring_parents">Tutoring Parents Only</option>
            <option value="custom">Specific Parent Account</option>
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

      {audience === "custom" && (
        <AdminSearchableSelect
          label="Parent Account *"
          placeholder="Search by name, email, or Guardian ID"
          searchHint="Type to search parent accounts"
          value={selectedParentId}
          onChange={setSelectedParentId}
          options={parentOptions}
        />
      )}

      <FileUpload
        label="Attachment (optional — PDF, images, documents up to 15MB)"
        value={attachmentPath}
        fileName={attachmentName}
        onChange={(url, name) => {
          setAttachmentPath(url);
          setAttachmentName(name);
        }}
        onRemove={() => {
          setAttachmentPath("");
          setAttachmentName("");
        }}
        mode="file"
        maxSize={15}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
      />
      {containsLocalFilesystemPath(message) && !attachmentPath && (
        <p className="text-xs text-amber-200">
          Your message looks like a local file path. Upload the file using the field above so
          parents can open it.
        </p>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        {loadingRecipients ? (
          <span>Checking recipients...</span>
        ) : audience === "custom" ? (
          <span>
            {selectedParentId
              ? "This notification will be saved to the selected parent account and sent by email."
              : recipientHint}
          </span>
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

      <button
        type="submit"
        disabled={!canSubmit}
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
