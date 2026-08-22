import { STORED_UPLOAD_FOLDERS, type StoredUploadFolder } from "@/lib/constants";

export function isStoredUploadFolder(value: string): value is StoredUploadFolder {
  return (STORED_UPLOAD_FOLDERS as readonly string[]).includes(value);
}

export function parseStoredUploadUrl(url: string): { folder: StoredUploadFolder; filename: string } | null {
  const trimmed = url.trim();
  const match = trimmed.match(/^\/api\/uploads\/([^/]+)\/([^/?#]+)$/);
  if (!match) return null;

  const folder = match[1];
  const filename = match[2];

  if (!isStoredUploadFolder(folder)) return null;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) return null;

  return { folder, filename };
}

export function buildStoredUploadUrl(folder: StoredUploadFolder, filename: string): string {
  return `/api/uploads/${folder}/${filename}`;
}
