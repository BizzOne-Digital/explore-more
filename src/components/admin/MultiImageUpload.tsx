"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { deleteStoredUploadByUrl } from "@/lib/services/stored-upload-client";
import { resolveImageUrl } from "@/lib/images/resolve";
import { uploadAdminImage } from "@/lib/uploads/admin-image-upload";
import {
  LEGACY_UPLOAD_FOLDER_MAP,
  type StoredUploadFolder,
} from "@/lib/constants";

const MAX_FILES = 8;

interface MultiImageUploadProps {
  label: string;
  hint?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxFiles?: number;
}

function resolveFolder(folder: string): StoredUploadFolder {
  if (folder === "products" || folder === "gallery" || folder === "pages" || folder === "misc") {
    return folder;
  }
  if (folder in LEGACY_UPLOAD_FOLDER_MAP) {
    return LEGACY_UPLOAD_FOLDER_MAP[folder as keyof typeof LEGACY_UPLOAD_FOLDER_MAP];
  }
  return "misc";
}

export function MultiImageUpload({
  label,
  hint,
  value,
  onChange,
  folder = "books",
  maxFiles = MAX_FILES,
}: MultiImageUploadProps) {
  const storedFolder = resolveFolder(folder);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setToast("Please select image files (PNG, JPG, WebP, or GIF).");
      return;
    }

    const slotsLeft = maxFiles - value.length;
    if (slotsLeft <= 0) {
      setToast(`You can upload up to ${maxFiles} sample pages.`);
      return;
    }

    const toUpload = list.slice(0, slotsLeft);
    if (list.length > slotsLeft) {
      setToast(`Only ${slotsLeft} more page(s) allowed (max ${maxFiles}).`);
    }

    setUploading(true);
    const added: string[] = [];

    try {
      for (const file of toUpload) {
        if (file.size > 8 * 1024 * 1024) {
          setToast(`${file.name} is over 8MB and was skipped.`);
          continue;
        }
        const { url } = await uploadAdminImage(file, storedFolder, folder);
        added.push(url);
      }
      if (added.length > 0) {
        onChange([...value, ...added]);
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove(index: number) {
    const url = value[index];
    if (url) await deleteStoredUploadByUrl(url);
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= value.length) return;
    const copy = [...value];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {hint && <p className="mt-1 text-xs text-white/45">{hint}</p>}
      </div>

      {toast && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100" role="status">
          {toast}
        </p>
      )}

      {value.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5"
            >
              <img
                src={resolveImageUrl(url)}
                alt={`Sample page ${index + 1}`}
                className="h-40 w-full object-cover object-top"
              />
              <div className="flex items-center justify-between gap-1 border-t border-white/10 px-2 py-1.5">
                <span className="text-xs text-white/50">Page {index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded px-1.5 py-0.5 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                    className="rounded px-1.5 py-0.5 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="rounded p-1 text-red-300 hover:bg-red-500/20"
                    aria-label={`Remove sample page ${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.length < maxFiles && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!uploading && e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`flex min-h-[8rem] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white/5 transition hover:bg-white/10 ${
            dragOver ? "border-explore-teal bg-explore-teal/10" : "border-white/20"
          }`}
        >
          {uploading ? (
            <Upload className="h-7 w-7 animate-pulse text-white/40" />
          ) : (
            <>
              <ImageIcon className="h-7 w-7 text-white/40" />
              <p className="mt-2 text-sm text-white/60">Add sample page images</p>
              <p className="mt-1 text-xs text-white/40">
                Drag & drop or browse — up to {maxFiles} pages, 8MB each
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
        }}
        className="hidden"
      />
    </div>
  );
}
