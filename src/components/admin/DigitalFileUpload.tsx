"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle, XCircle, Loader } from "lucide-react";
import { cn } from "@/lib/cn";

interface DigitalFileUploadProps {
  bookId?: string;
  currentFile?: {
    fileName: string;
    fileSizeBytes: number;
    enabled: boolean;
  };
  onUploadSuccess?: () => void;
  /** Select PDF when book does not exist yet (new book form). Upload after save. */
  pendingFile?: File | null;
  onPendingFileChange?: (file: File | null) => void;
}

const MAX_BYTES = 50 * 1024 * 1024;
const FILE_ACCEPT = "application/pdf,.pdf,.epub,.mobi,.zip";

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

function validateFile(file: File): string | null {
  if (!isAllowedUpload(file)) {
    return "Invalid file type. Allowed: PDF, EPUB, MOBI, ZIP";
  }
  if (file.size > MAX_BYTES) {
    return "Maximum file size is 50 MB.";
  }
  return null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function DigitalFileUpload({
  bookId,
  currentFile,
  onUploadSuccess,
  pendingFile,
  onPendingFileChange,
}: DigitalFileUploadProps) {
  const isPendingMode = !bookId && onPendingFileChange;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadToServer(file: File) {
    if (!bookId) return;

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
    }
  }

  function processFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess(false);

    if (isPendingMode) {
      onPendingFileChange?.(file);
      return;
    }

    uploadToServer(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleDelete() {
    if (!bookId) return;
    if (!confirm("Are you sure you want to delete this digital file?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/books/upload-digital?bookId=${encodeURIComponent(bookId)}`,
        { method: "DELETE" }
      );
      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(String(data.error ?? "Delete failed"));
      }

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const selectedFile = isPendingMode
    ? pendingFile
    : currentFile
      ? { name: currentFile.fileName, size: currentFile.fileSizeBytes }
      : null;

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg border-2 border-dashed p-6 transition-colors",
          dragOver
            ? "border-explore-teal bg-explore-teal/10"
            : "border-white/20 bg-white/[0.02]"
        )}
      >
        <h3 className="mb-2 text-lg font-semibold text-white">Digital Download File (PDF)</h3>

        {isPendingMode && pendingFile ? (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">PDF selected</span>
            </div>
            <p className="text-sm text-white/80">📄 {pendingFile.name}</p>
            <p className="text-sm text-white/60">Size: {formatFileSize(pendingFile.size)}</p>
            <p className="mt-2 text-xs text-white/50">
              The PDF will upload automatically when you save or publish this book.
            </p>
            <button
              type="button"
              onClick={() => onPendingFileChange?.(null)}
              className="mt-3 text-sm text-red-300 hover:underline"
            >
              Remove selected PDF
            </button>
          </div>
        ) : !isPendingMode && currentFile ? (
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
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={cn(
              "mb-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 p-6 text-center transition hover:border-white/20 hover:bg-white/10",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <>
                <Loader className="h-8 w-8 animate-spin text-explore-teal" />
                <p className="mt-3 text-sm text-white/70">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-white/40" />
                <p className="mt-3 text-sm font-medium text-white/80">
                  Drag & drop your PDF here
                </p>
                <p className="mt-1 text-xs text-white/50">or click to browse (max 50 MB)</p>
                <p className="mt-1 text-xs text-white/40">PDF, EPUB, MOBI, ZIP</p>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_ACCEPT}
          onChange={handleFileInput}
          disabled={uploading}
          className="hidden"
        />

        {(selectedFile || isPendingMode) && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white hover:bg-explore-teal/90 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {selectedFile ? "Replace PDF" : "Select PDF"}
              </>
            )}
          </button>
        )}

        {uploading && !isPendingMode && (
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-explore-teal transition-all"
                style={{ width: `${progress}%` }}
              />
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
