"use client";

import { useState } from "react";
import { Upload, CheckCircle, XCircle, Loader } from "lucide-react";

interface DigitalFileUploadProps {
  bookId: string;
  currentFile?: {
    fileName: string;
    fileSizeBytes: number;
    enabled: boolean;
  };
  onUploadSuccess?: () => void;
}

async function readJsonResponse(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text) {
    throw new Error(response.ok ? "Empty server response" : `Upload failed (${response.status})`);
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error("The server returned an invalid response. Please try again.");
    }
  }

  throw new Error(
    response.ok
      ? "Unexpected server response"
      : `Upload failed (${response.status}). Check storage configuration or try a smaller PDF.`
  );
}

function isAllowedUpload(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    type === "application/pdf" ||
    name.endsWith(".pdf") ||
    type.includes("epub") ||
    name.endsWith(".epub") ||
    type.includes("mobi") ||
    name.endsWith(".mobi") ||
    type === "application/zip" ||
    name.endsWith(".zip")
  );
}

export function DigitalFileUpload({ bookId, currentFile, onUploadSuccess }: DigitalFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedUpload(file)) {
      setError("Invalid file type. Allowed: PDF, EPUB, MOBI, ZIP");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("PDF upload failed. Maximum file size is 50 MB.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess(false);
    setProgress(25);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookId", bookId);

      const response = await fetch("/api/admin/books/upload-digital", {
        method: "POST",
        body: formData,
      });

      setProgress(75);
      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(String(data.error ?? "Upload failed"));
      }

      setSuccess(true);
      setProgress(100);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this digital file?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/books/upload-digital?bookId=${encodeURIComponent(bookId)}`, {
        method: "DELETE",
      });
      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(String(data.error ?? "Delete failed"));
      }

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-dashed border-white/20 p-6">
        <h3 className="mb-2 text-lg font-semibold text-white">Digital Download File (PDF)</h3>

        {currentFile ? (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">File Uploaded</span>
            </div>
            <p className="text-sm text-white/80">📄 {currentFile.fileName}</p>
            <p className="text-sm text-white/60">Size: {formatFileSize(currentFile.fileSizeBytes)}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href={`/api/admin/books/${bookId}/digital-file`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-explore-teal hover:underline"
              >
                View PDF
              </a>
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm text-red-300 hover:underline"
              >
                Remove PDF
              </button>
            </div>
          </div>
        ) : (
          <p className="mb-4 text-sm text-white/60">
            No digital file uploaded. Upload a PDF (max 50 MB). Filenames with spaces, parentheses, and capitals are supported.
          </p>
        )}

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white hover:bg-explore-teal/90">
          <input
            type="file"
            accept="application/pdf,.pdf,.epub,.mobi,.zip"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {currentFile ? "Replace PDF" : "Upload PDF"}
            </>
          )}
        </label>

        {uploading && (
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-explore-teal transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-300">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 text-green-300">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Upload successful! Refreshing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
