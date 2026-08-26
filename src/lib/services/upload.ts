import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_PORTFOLIO_EXTENSIONS,
  ALLOWED_CAMPAIGN_EXTENSIONS,
  LEGACY_UPLOAD_FOLDER_MAP,
  MAX_PORTFOLIO_UPLOAD_SIZE,
  MAX_UPLOAD_SIZE,
  MAX_CAMPAIGN_UPLOAD_SIZE,
  UPLOAD_DIRS,
} from "@/lib/constants";
import { deleteStoredUploadByUrl, storeUploadedImage } from "@/lib/services/stored-upload";
import { storePrivateUpload } from "@/lib/services/private-stored-upload";

const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const PRIVATE_STORAGE_ROOT = path.join(process.cwd(), "storage", "private");

export type UploadCategory = keyof typeof UPLOAD_DIRS;
export type PrivateUploadFolder = "results" | "certificates" | "documents" | "portfolio" | "messages";

export async function ensureUploadDirs(): Promise<void> {
  const dirs = [
    PUBLIC_UPLOAD_ROOT,
    PRIVATE_STORAGE_ROOT,
    ...Object.values(UPLOAD_DIRS).map((d) => path.join(PUBLIC_UPLOAD_ROOT, d)),
    path.join(PRIVATE_STORAGE_ROOT, "results"),
    path.join(PRIVATE_STORAGE_ROOT, "certificates"),
    path.join(PRIVATE_STORAGE_ROOT, "documents"),
    path.join(PRIVATE_STORAGE_ROOT, "portfolio"),
    path.join(PRIVATE_STORAGE_ROOT, "messages"),
  ];
  await Promise.all(dirs.map((d) => fs.mkdir(d, { recursive: true })));
}

function validateImage(file: { type: string; size: number }): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
  }
}

function safeFilename(original: string, allowedExts?: string[]): string {
  const ext = path.extname(original).toLowerCase();
  const allowed = allowedExts ?? [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];
  if (!allowed.includes(ext)) {
    throw new Error("Invalid file extension");
  }
  return `${crypto.randomUUID()}${ext}`;
}

export async function uploadPublicImage(
  file: File,
  category: UploadCategory
): Promise<{ url: string; filename: string }> {
  const folder = LEGACY_UPLOAD_FOLDER_MAP[category];
  const result = await storeUploadedImage(file, folder);
  return { url: result.url, filename: result.filename };
}

export async function uploadCampaignFile(
  file: File
): Promise<{ url: string; filename: string; originalName: string }> {
  const maxSize = Math.min(MAX_CAMPAIGN_UPLOAD_SIZE, 50 * 1024 * 1024);
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_CAMPAIGN_EXTENSIONS.includes(ext)) {
    throw new Error("Invalid file type for attachment upload");
  }

  const uploaded = await storePrivateUpload(file, "notifications", maxSize);
  return {
    url: uploaded.path,
    filename: uploaded.filename,
    originalName: uploaded.originalName,
  };
}

export async function uploadPrivateFile(
  file: File,
  subfolder: PrivateUploadFolder,
  maxSize = 10 * 1024 * 1024
): Promise<{ path: string; filename: string; originalName: string; mimeType: string; size: number }> {
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  const allowedExts =
    subfolder === "portfolio" || subfolder === "messages"
      ? ALLOWED_PORTFOLIO_EXTENSIONS
      : [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];

  const filename = safeFilename(file.name, allowedExts);
  const dir = path.join(PRIVATE_STORAGE_ROOT, subfolder);
  await fs.mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = path.join(dir, filename);

  if (!filepath.startsWith(dir)) {
    throw new Error("Invalid upload path");
  }

  await fs.writeFile(filepath, buffer);
  return {
    path: `${subfolder}/${filename}`,
    filename,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

export async function uploadPortfolioFiles(
  files: File[]
): Promise<Array<{ path: string; filename: string; originalName: string; mimeType: string; size: number }>> {
  const uploads = [];
  for (const file of files) {
    uploads.push(await uploadPrivateFile(file, "portfolio", MAX_PORTFOLIO_UPLOAD_SIZE));
  }
  return uploads;
}

export async function deletePublicImage(url: string): Promise<void> {
  if (url.startsWith("/api/uploads/")) {
    await deleteStoredUploadByUrl(url);
    return;
  }
  if (!url.startsWith("/uploads/")) return;
  const filepath = path.join(process.cwd(), "public", url);
  const resolved = path.resolve(filepath);
  if (!resolved.startsWith(path.resolve(PUBLIC_UPLOAD_ROOT))) return;
  try {
    await fs.unlink(resolved);
  } catch {
    // File may not exist
  }
}

export function getPrivateFilePath(relativePath: string): string {
  const resolved = path.resolve(PRIVATE_STORAGE_ROOT, relativePath);
  if (!resolved.startsWith(path.resolve(PRIVATE_STORAGE_ROOT))) {
    throw new Error("Invalid file path");
  }
  return resolved;
}

export async function readPrivateFile(relativePath: string): Promise<Buffer> {
  const filepath = getPrivateFilePath(relativePath);
  return fs.readFile(filepath);
}
