"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, File, FileText, FileImage } from "lucide-react";
import { LEGACY_UPLOAD_FOLDER_MAP, UPLOAD_DIRS } from "@/lib/constants";
import type { StoredUploadFolder } from "@/lib/constants";
import { parentNotificationFileUrl } from "@/lib/notifications/display";

interface FileUploadProps {
  label: string;
  value: string;
  fileName?: string;
  onChange: (url: string, fileName: string) => void;
  onRemove?: () => void;
  /** @deprecated use uploadEndpoint */
  folder?: string;
  category?: string;
  uploadEndpoint?: string;
  accept?: string;
  /** MB limit on client; omit or null for no client cap */
  maxSize?: number | null;
  mode?: "image" | "file" | "any";
}

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";
const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.mp4,.mov,.mp3,.wav,image/*";

function resolveStoredFolder(category: string): StoredUploadFolder {
  if (category === "products" || category === "gallery" || category === "pages" || category === "misc") {
    return category;
  }
  if (category in LEGACY_UPLOAD_FOLDER_MAP) {
    return LEGACY_UPLOAD_FOLDER_MAP[category as keyof typeof UPLOAD_DIRS];
  }
  return "misc";
}

function isImageFile(name: string, url: string) {
  const source = (name || url).toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(source);
}

function resolvePreviewSrc(value: string): string {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/api/")) return value;
  if (value.startsWith("/uploads/")) return value;
  if (value.startsWith("notifications/") || value.startsWith("/notifications/")) {
    return parentNotificationFileUrl(value);
  }
  return value.startsWith("/") ? value : `/${value}`;
}

export function FileUpload({
  label,
  value,
  fileName,
  onChange,
  onRemove,
  folder,
  category = folder ?? "campaigns",
  uploadEndpoint = "/api/admin/email-campaigns/upload",
  accept,
  maxSize = null,
  mode = "any",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolvedAccept =
    accept ?? (mode === "image" ? IMAGE_ACCEPT : mode === "file" ? FILE_ACCEPT : `${IMAGE_ACCEPT},${FILE_ACCEPT}`);

  const uploadFile = useCallback(
    async (file: File) => {
      if (maxSize != null && file.size > maxSize * 1024 * 1024) {
        setError(`File must be less than ${maxSize}MB`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const useCampaignApi = uploadEndpoint === "/api/admin/email-campaigns/upload";
        if (!useCampaignApi) {
          formData.append("folder", resolveStoredFolder(category));
        }

        const res = await fetch(useCampaignApi ? uploadEndpoint : "/api/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? json.message ?? "Upload failed");
          return;
        }

        const url = json.data?.url ?? json.url;
        const name = json.data?.originalName ?? json.data?.filename ?? json.filename ?? file.name;

        if (!url) {
          setError("Upload failed");
          return;
        }

        onChange(url, name);
      } catch {
        setError("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [category, maxSize, onChange, uploadEndpoint]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleRemove() {
    if (onRemove) onRemove();
    else onChange("", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) {
      return <FileImage className="h-8 w-8 text-blue-400" />;
    }
    if (["pdf"].includes(ext || "")) {
      return <FileText className="h-8 w-8 text-red-400" />;
    }
    return <File className="h-8 w-8 text-white/40" />;
  }

  const showPreview = value && isImageFile(fileName || "", value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/80">{label}</label>

      {value ? (
        <div
          className="space-y-3"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="text-xs text-white/40">Drag a new file here to replace.</p>
          {showPreview && (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolvePreviewSrc(value)} alt={fileName || "Uploaded image"} className="max-h-48 w-full object-contain bg-black/20" />
            </div>
          )}
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
            {!showPreview && getFileIcon(fileName || value)}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">{fileName || "Attached file"}</p>
              <p className="text-xs text-white/60">Uploaded successfully</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="shrink-0 rounded-full bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex min-h-[8rem] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
            dragging
              ? "border-explore-teal bg-explore-teal/10"
              : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
          } ${uploading ? "pointer-events-none opacity-70" : ""}`}
        >
          {uploading ? (
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 animate-pulse text-explore-teal" />
              <p className="mt-2 text-sm text-white/60">Uploading...</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className={`mx-auto h-8 w-8 ${dragging ? "text-explore-teal" : "text-white/40"}`} />
              <p className="mt-2 text-sm font-medium text-white/80">
                {dragging ? "Drop file here" : "Drag & drop or click to upload"}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {mode === "image"
                  ? "Images (JPEG, PNG, WebP, GIF, SVG)"
                  : mode === "file"
                    ? "Documents, videos, and archives"
                    : "Images and files"}
                {maxSize != null ? ` · up to ${maxSize}MB` : ""}
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={resolvedAccept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
