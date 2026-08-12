import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE, UPLOAD_DIRS } from "@/lib/constants";

const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const PRIVATE_STORAGE_ROOT = path.join(process.cwd(), "storage", "private");

export type UploadCategory = keyof typeof UPLOAD_DIRS;

export async function ensureUploadDirs(): Promise<void> {
  const dirs = [
    PUBLIC_UPLOAD_ROOT,
    PRIVATE_STORAGE_ROOT,
    ...Object.values(UPLOAD_DIRS).map((d) => path.join(PUBLIC_UPLOAD_ROOT, d)),
    path.join(PRIVATE_STORAGE_ROOT, "results"),
    path.join(PRIVATE_STORAGE_ROOT, "certificates"),
    path.join(PRIVATE_STORAGE_ROOT, "documents"),
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

function safeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];
  if (!allowed.includes(ext)) {
    throw new Error("Invalid file extension");
  }
  return `${crypto.randomUUID()}${ext}`;
}

export async function uploadPublicImage(
  file: File,
  category: UploadCategory
): Promise<{ url: string; filename: string }> {
  validateImage({ type: file.type, size: file.size });

  const filename = safeFilename(file.name);
  const dir = path.join(PUBLIC_UPLOAD_ROOT, UPLOAD_DIRS[category]);
  await fs.mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = path.join(dir, filename);

  // Prevent path traversal
  if (!filepath.startsWith(dir)) {
    throw new Error("Invalid upload path");
  }

  await fs.writeFile(filepath, buffer);
  return {
    url: `/uploads/${UPLOAD_DIRS[category]}/${filename}`,
    filename,
  };
}

export async function uploadPrivateFile(
  file: File,
  subfolder: "results" | "certificates" | "documents"
): Promise<{ path: string; filename: string }> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 10MB");
  }

  const filename = safeFilename(file.name);
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
  };
}

export async function deletePublicImage(url: string): Promise<void> {
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
