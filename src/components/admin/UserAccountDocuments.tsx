"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader, Trash2, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DragDropZone } from "@/components/admin/DragDropZone";

interface UserDocumentRow {
  _id: string;
  path: string;
  originalName: string;
  label?: string;
  mimeType: string;
  size: number;
  uploadedByName: string;
  createdAt: string;
}

export function UserAccountDocuments({ userId }: { userId: string }) {
  const [documents, setDocuments] = useState<UserDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${userId}/documents`);
      const json = await res.json();
      if (res.ok) setDocuments(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (label.trim()) formData.append("label", label.trim());

      const res = await fetch(`/api/admin/users/${userId}/documents`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Upload failed");
        return;
      }
      setLabel("");
      await load();
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(docId: string, name: string) {
    if (!confirm(`Remove "${name}" from this account?`)) return;
    const res = await fetch(`/api/admin/users/${userId}/documents/${docId}`, {
      method: "DELETE",
    });
    if (res.ok) await load();
    else alert("Failed to delete document");
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Account Documents</h3>
        <p className="mt-1 text-sm text-white/50">
          Upload forms, agreements, IDs, or other files tied to this user account. Files are private
          and only visible to staff in admin.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase text-white/50">
          Document label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Enrollment form, IEP, signed agreement"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
        />
      </div>

      <DragDropZone
        disabled={uploading}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp"
        onFiles={(files) => {
          if (files[0]) uploadFile(files[0]);
        }}
        className="rounded-lg border border-dashed border-white/20 bg-black/20 p-6 text-center"
      >
        {({ dragOver, openFilePicker }) => (
          <div
            className={dragOver ? "text-explore-teal" : "text-white/60"}
            onClick={openFilePicker}
          >
            {uploading ? (
              <Loader className="mx-auto h-8 w-8 animate-spin opacity-60" />
            ) : (
              <Upload className="mx-auto h-8 w-8 opacity-60" />
            )}
            <p className="mt-2 text-sm">
              {uploading
                ? "Uploading..."
                : "Drag & drop a document here or click to browse"}
            </p>
            <p className="mt-1 text-xs text-white/40">PDF, Word, Excel, images, zip — up to 50MB</p>
          </div>
        )}
      </DragDropZone>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {loading ? (
        <p className="text-sm text-white/50">Loading documents…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-white/40">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const displayName = doc.label || doc.originalName;
            return (
              <div
                key={doc._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-explore-teal" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{displayName}</p>
                    {doc.label && (
                      <p className="truncate text-xs text-white/45">{doc.originalName}</p>
                    )}
                    <p className="mt-1 text-xs text-white/40">
                      {formatSize(doc.size)} · {doc.uploadedByName} ·{" "}
                      {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/api/files/private/${doc.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteDocument(doc._id, displayName)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
