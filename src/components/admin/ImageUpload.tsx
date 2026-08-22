"use client";

import { AdminImageField } from "@/components/admin/AdminImageField";
import {
  LEGACY_UPLOAD_FOLDER_MAP,
  type StoredUploadFolder,
} from "@/lib/constants";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Legacy category name (books, courses, …) or stored folder (products, gallery, pages, misc). */
  folder?: string;
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

/** Backward-compatible wrapper around {@link AdminImageField}. */
export function ImageUpload({ label, value, onChange, folder = "misc" }: ImageUploadProps) {
  return (
    <AdminImageField
      label={label}
      value={value}
      onChange={onChange}
      folder={resolveFolder(folder)}
      legacyCategory={folder}
    />
  );
}

export { AdminImageField };
