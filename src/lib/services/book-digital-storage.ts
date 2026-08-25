import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import connectDB from "@/lib/db";
import { StoredUpload } from "@/models";
import { uploadToR2 } from "@/lib/services/r2-storage";
import { readPrivateStoredFile } from "@/lib/services/private-stored-upload";

const LOCAL_BOOKS_DIR = path.join(process.cwd(), "storage", "private", "books");
const MAX_FILE_SIZE = 50 * 1024 * 1024;
/** MongoDB documents are capped at 16 MB — keep a safe margin for metadata. */
const MAX_MONGO_BOOK_SIZE = 15 * 1024 * 1024;

export type BookDigitalStorage = "r2" | "local" | "mongo";

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      !process.env.R2_ACCESS_KEY_ID.includes("your_") &&
      !process.env.R2_ACCOUNT_ID?.includes("your_")
  );
}

function isServerlessEnvironment(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function canUseLocalFilesystem(): boolean {
  return !isServerlessEnvironment() && process.env.NODE_ENV !== "production";
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

function bookMimeType(file: File, fileType: string): string {
  if (file.type) return file.type;
  if (fileType === "epub") return "application/epub+zip";
  if (fileType === "mobi") return "application/x-mobipocket-ebook";
  if (fileType === "zip") return "application/zip";
  return "application/pdf";
}

async function uploadBookToMongo(
  file: File,
  bookId: string,
  sanitizedName: string,
  fileType: string
): Promise<{
  storage: "mongo";
  localPath: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
}> {
  if (file.size > MAX_MONGO_BOOK_SIZE) {
    throw new Error(
      "This file is too large for serverless storage (max 15 MB). Configure Cloudflare R2 in Vercel env vars for larger PDFs, or compress the file."
    );
  }

  const storedName = `${bookId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizedName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = bookMimeType(file, fileType);

  await connectDB();
  await StoredUpload.create({
    folder: "books",
    filename: storedName,
    mimeType,
    size: file.size,
    data: buffer,
  });

  return {
    storage: "mongo",
    localPath: `books/${storedName}`,
    fileName: file.name,
    fileSizeBytes: buffer.length,
    fileType,
  };
}

export async function uploadBookDigitalFile(
  file: File,
  bookId: string
): Promise<{
  storage: BookDigitalStorage;
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

  if (isServerlessEnvironment() || !canUseLocalFilesystem()) {
    return uploadBookToMongo(file, bookId, sanitizedName, fileType);
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

export async function readBookDigitalFile(digitalFile: {
  storage?: BookDigitalStorage;
  localPath?: string;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  if (digitalFile.storage === "mongo" && digitalFile.localPath) {
    const stored = await readPrivateStoredFile(digitalFile.localPath);
    if (!stored) {
      throw new Error("Digital file not found in database");
    }
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }

  if (digitalFile.storage === "local" && digitalFile.localPath) {
    const buffer = await readLocalBookFile(digitalFile.localPath);
    return { buffer, mimeType: "application/pdf" };
  }

  throw new Error("Digital file path missing");
}
