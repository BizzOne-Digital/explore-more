"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  FolderPlus,
  Loader2,
  Printer,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";

type FolderRow = { _id: string; name: string };
type DocumentRow = {
  _id: string;
  folderId: string;
  title: string;
  filePath: string;
  originalFileName: string;
  sizeBytes: number;
  updatedAt?: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileUrl(path: string, download = false) {
  const base = `/api/files/private/${path}`;
  return download ? `${base}?download=1` : base;
}

export function AdminDocumentsClient() {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admin-documents");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load");
      setFolders(json.data.folders ?? []);
      setDocuments(json.data.documents ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedFolderId && folders.length > 0) {
      setSelectedFolderId(folders[0]._id);
    }
  }, [folders, selectedFolderId]);

  const folderDocuments = useMemo(
    () => documents.filter((d) => d.folderId === selectedFolderId),
    [documents, selectedFolderId]
  );

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admin-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Create failed");
      setNewFolderName("");
      setMessage(`Folder “${name}” created.`);
      await refresh();
      setSelectedFolderId(json.data.folder._id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function deleteFolder(folderId: string, name: string) {
    if (
      !confirm(
        `Delete folder “${name}” and all PDFs inside? This cannot be undone.`
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/admin/admin-documents/folders/${folderId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Delete failed");
      return;
    }
    setMessage(`Folder “${name}” deleted.`);
    if (selectedFolderId === folderId) setSelectedFolderId("");
    await refresh();
  }

  async function uploadPdf(file: File) {
    if (!selectedFolderId) {
      setError("Create or select a folder before uploading.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", selectedFolderId);
      const res = await fetch("/api/admin/admin-documents/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Upload failed");
      setMessage(`Uploaded “${json.data.document.title}”.`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function saveDocument(doc: DocumentRow) {
    const title = (draftTitles[doc._id] ?? doc.title).trim();
    if (!title) {
      setError("Document title cannot be empty.");
      return;
    }
    setSavingId(doc._id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/admin-documents/${doc._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed");
      setMessage(`Saved “${title}”.`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteDocument(doc: DocumentRow) {
    if (!confirm(`Delete “${doc.title}”?`)) return;
    setError(null);
    const res = await fetch(`/api/admin/admin-documents/${doc._id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Delete failed");
      return;
    }
    setMessage(`Deleted “${doc.title}”.`);
    await refresh();
  }

  function printDocument(doc: DocumentRow) {
    const w = window.open(fileUrl(doc.filePath), "_blank", "noopener,noreferrer");
    if (!w) {
      setError("Pop-up blocked. Allow pop-ups to print.");
      return;
    }
    w.addEventListener("load", () => {
      w.focus();
      w.print();
    });
  }

  return (
    <div>
      <PageHeader
        title="Admin Documents"
        description="Internal PDF library for employee handbooks, policies, and reference files. Administrators only."
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold text-white/90">Folders</h2>
          <form onSubmit={createFolder} className="space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={creatingFolder || !newFolderName.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-explore-teal px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {creatingFolder ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderPlus className="h-4 w-4" />
              )}
              Create folder
            </button>
          </form>

          {loading ? (
            <p className="text-sm text-white/50">Loading…</p>
          ) : folders.length === 0 ? (
            <p className="text-sm text-white/50">No folders yet.</p>
          ) : (
            <ul className="space-y-1">
              {folders.map((folder) => (
                <li key={folder._id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder._id)}
                    className={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedFolderId === folder._id
                        ? "bg-explore-lime/20 font-medium text-explore-lime"
                        : "text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {folder.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFolder(folder._id, folder.name)}
                    className="rounded p-2 text-red-300 hover:bg-red-500/10"
                    aria-label={`Delete folder ${folder.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="rounded-lg border border-white/10 bg-white/5 p-4 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              {folders.find((f) => f._id === selectedFolderId)?.name ?? "Documents"}
            </h2>
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-explore-lime px-4 py-2 text-sm font-semibold text-explore-black ${
                uploading || !selectedFolderId ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={uploading || !selectedFolderId}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPdf(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {!selectedFolderId ? (
            <p className="text-sm text-white/55">Select or create a folder to add documents.</p>
          ) : folderDocuments.length === 0 ? (
            <p className="text-sm text-white/55">No PDFs in this folder yet.</p>
          ) : (
            <ul className="space-y-4">
              {folderDocuments.map((doc) => (
                <li
                  key={doc._id}
                  className="rounded-xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <FileText className="mt-1 h-8 w-8 shrink-0 text-explore-teal" />
                    <div className="min-w-0 flex-1">
                      <label className="text-xs text-white/45">Document title</label>
                      <input
                        type="text"
                        value={draftTitles[doc._id] ?? doc.title}
                        onChange={(e) =>
                          setDraftTitles((prev) => ({ ...prev, [doc._id]: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                      />
                      <p className="mt-1 text-xs text-white/40">
                        {doc.originalFileName} · {formatBytes(doc.sizeBytes)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={fileUrl(doc.filePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </a>
                    <a
                      href={fileUrl(doc.filePath, true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => printDocument(doc)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => saveDocument(doc)}
                      disabled={savingId === doc._id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-explore-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-explore-teal/90 disabled:opacity-50"
                    >
                      {savingId === doc._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDocument(doc)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
