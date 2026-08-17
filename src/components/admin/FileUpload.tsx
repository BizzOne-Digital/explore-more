"use client";

import { useState, useRef } from "react";
import { Upload, X, File, FileText, FileImage } from "lucide-react";

interface FileUploadProps {
  label: string;
  value: string;
  fileName?: string;
  onChange: (url: string, fileName: string) => void;
  onRemove?: () => void;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  label,
  value,
  fileName,
  onChange,
  onRemove,
  folder = "attachments",
  accept,
  maxSize = 10,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload/public", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Upload failed");
        setUploading(false);
        return;
      }

      onChange(json.data.url, file.name);
      setUploading(false);
    } catch (err) {
      setError("Upload failed");
      setUploading(false);
    }
  }

  function handleRemove() {
    if (onRemove) {
      onRemove();
    } else {
      onChange("", "");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/80">{label}</label>

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          {getFileIcon(fileName || value)}
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{fileName || "Attached file"}</p>
            <p className="text-xs text-white/60">File uploaded</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-full bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 transition hover:border-white/30 hover:bg-white/10"
        >
          {uploading ? (
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 animate-pulse text-white/40" />
              <p className="mt-2 text-sm text-white/60">Uploading...</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-white/40" />
              <p className="mt-2 text-sm text-white/60">Click to upload file</p>
              <p className="mt-1 text-xs text-white/40">
                {accept ? `${accept.toUpperCase()} ` : ""}up to {maxSize}MB
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
