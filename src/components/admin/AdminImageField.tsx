"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { deleteStoredUploadByUrl } from "@/lib/services/stored-upload-client";
import { resolveImageUrl } from "@/lib/images/resolve";
import { uploadAdminImage } from "@/lib/uploads/admin-image-upload";
import type { StoredUploadFolder } from "@/lib/constants";

interface AdminImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: StoredUploadFolder;
  /** Legacy UPLOAD_DIRS key (e.g. events, books) for older API compatibility. */
  legacyCategory?: string;
  className?: string;
}

type Toast = { type: "success" | "error"; message: string };

export function AdminImageField({
  label,
  value,
  onChange,
  folder,
  legacyCategory,
  className,
}: AdminImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "Please select an image file (PNG, JPG, WebP, or GIF)." });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setToast({ type: "error", message: "Image must be 8MB or smaller." });
      return;
    }

    setUploading(true);
    setToast(null);

    const previousUrl = value;

    try {
      const { url } = await uploadAdminImage(file, folder, legacyCategory);

      if (previousUrl) {
        await deleteStoredUploadByUrl(previousUrl);
      }

      onChange(url);
      setToast({ type: "success", message: "Image uploaded successfully." });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Upload failed. Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (value) {
      await deleteStoredUploadByUrl(value);
    }
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setToast({ type: "success", message: "Image removed." });
  }

  const previewSrc = value ? resolveImageUrl(value) : "";

  return (
    <div className={className ?? "space-y-2"}>
      <label className="block text-sm font-medium text-white/80">{label}</label>

      {toast && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            toast.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border border-red-500/30 bg-red-500/10 text-red-200"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      {value ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={previewSrc}
              alt="Preview"
              className="h-48 w-auto max-w-full rounded-lg border border-white/10 object-cover"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Replace"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 transition hover:border-white/30 hover:bg-white/10"
        >
          {uploading ? (
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 animate-pulse text-white/40" />
              <p className="mt-2 text-sm text-white/60">Uploading...</p>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-white/40" />
              <p className="mt-2 text-sm text-white/60">Click to upload image</p>
              <p className="mt-1 text-xs text-white/40">PNG, JPG, WebP, GIF up to 8MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
