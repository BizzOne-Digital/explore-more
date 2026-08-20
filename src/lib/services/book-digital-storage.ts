import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { uploadToR2 } from "@/lib/services/r2-storage";

const LOCAL_BOOKS_DIR = path.join(process.cwd(), "storage", "private", "books");
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      !process.env.R2_ACCESS_KEY_ID.includes("your_") &&
      !process.env.R2_ACCOUNT_ID?.includes("your_")
  );
}

/** Sanitize original filename while preserving extension. */
export function sanitizeBookFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".pdf";
  const base = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const safeBase = base || "book";
  return `${safeBase}${ext}`;
}

export function isAllowedBookFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) return true;
  if (type.includes("epub") || name.endsWith(".epub")) return true;
  if (type.includes("mobi") || name.endsWith(".mobi")) return true;
  if (type === "application/zip" || name.endsWith(".zip")) return true;
  return false;
}

export function detectBookFileType(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".epub") || file.type.includes("epub")) return "epub";
  if (name.endsWith(".mobi") || file.type.includes("mobi")) return "mobi";
  if (name.endsWith(".zip") || file.type.includes("zip")) return "zip";
  return "pdf";
}

export async function uploadBookDigitalFile(
  file: File,
  bookId: string
): Promise<{
  storage: "r2" | "local";
  r2Key?: string;
  localPath?: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
}> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDF upload failed. Maximum file size is 50 MB.");
  }

  if (!isAllowedBookFile(file)) {
    throw new Error("Invalid file type. Allowed: PDF, EPUB, MOBI, ZIP");
  }

  const sanitizedName = sanitizeBookFilename(file.name);
  const fileType = detectBookFileType(file);

  if (isR2Configured()) {
    const r2Key = `books/${bookId}-${Date.now()}-${sanitizedName}`;
    const result = await uploadToR2(file, r2Key);
    return {
      storage: "r2",
      r2Key: result.key,
      fileName: file.name,
      fileSizeBytes: result.size,
      fileType,
    };
  }

  await fs.mkdir(LOCAL_BOOKS_DIR, { recursive: true });
  const storedName = `${bookId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizedName}`;
  const absolutePath = path.join(LOCAL_BOOKS_DIR, storedName);

  if (!absolutePath.startsWith(LOCAL_BOOKS_DIR)) {
    throw new Error("Invalid upload path");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return {
    storage: "local",
    localPath: `books/${storedName}`,
    fileName: file.name,
    fileSizeBytes: buffer.length,
    fileType,
  };
}

export function getLocalBookAbsolutePath(relativePath: string): string {
  const resolved = path.resolve(process.cwd(), "storage", "private", relativePath);
  const root = path.resolve(LOCAL_BOOKS_DIR);
  if (!resolved.startsWith(root)) {
    throw new Error("Invalid file path");
  }
  return resolved;
}

export async function readLocalBookFile(relativePath: string): Promise<Buffer> {
  return fs.readFile(getLocalBookAbsolutePath(relativePath));
}
