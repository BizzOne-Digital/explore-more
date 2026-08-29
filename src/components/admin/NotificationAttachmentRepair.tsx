"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/admin/FileUpload";
import { notificationHasMissingUpload } from "@/lib/notifications/display";

export function NotificationAttachmentRepair({
  notificationId,
  title,
  attachmentPath,
  attachmentName,
  message,
}: {
  notificationId: string;
  title: string;
  attachmentPath?: string;
  attachmentName?: string;
  message: string;
}) {
  const router = useRouter();
  const [path, setPath] = useState(attachmentPath ?? "");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const needsRepair = notificationHasMissingUpload(attachmentPath, message);

  async function saveAttachment() {
    if (!path.trim()) {
      setError("Upload a PDF or document first.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachmentPath: path,
          attachmentName: name || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save attachment");

      setSuccess("Attachment saved. Parents can now open this file in their portal.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save attachment");
    } finally {
      setSaving(false);
    }
  }

  if (!needsRepair && attachmentPath) {
    return (
      <p className="mt-3 text-xs text-green-300">
        Attachment on file: {attachmentName || attachmentPath.split("/").pop()}
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-sm font-medium text-amber-100">
        {needsRepair
          ? "Parents cannot open the file — it was not uploaded to the portal."
          : "No attachment on this notification yet."}
      </p>
      <p className="mt-1 text-xs text-amber-100/80">
        Upload the PDF for &ldquo;{title}&rdquo; below. Parents will see a View PDF button
        immediately.
      </p>
      <div className="mt-3">
        <FileUpload
          label="Upload PDF for parents"
          value={path}
          fileName={name}
          onChange={(url, fileName) => {
            setPath(url);
            setName(fileName);
            setError("");
          }}
          onRemove={() => {
            setPath("");
            setName("");
          }}
          mode="file"
          maxSize={50}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-300">{success}</p>}
      <button
        type="button"
        onClick={() => void saveAttachment()}
        disabled={saving || !path}
        className="mt-3 rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save attachment for parents"}
      </button>
    </div>
  );
}
