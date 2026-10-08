import crypto from "crypto";
import connectDB from "@/lib/db";
import { StoredUpload } from "@/models";
import {
  MAX_STORED_IMAGE_SIZE,
  STORED_IMAGE_MIME_TYPES,
  STORED_UPLOAD_FOLDERS,
  type StoredUploadFolder,
} from "@/lib/constants";
import { deleteFromR2, readFromR2 } from "@/lib/services/r2-storage";
import {
  buildStoredUploadUrl,
  isStoredUploadFolder,
  parseStoredUploadUrl,
} from "@/lib/uploads/stored-url";

export { buildStoredUploadUrl, isStoredUploadFolder, parseStoredUploadUrl } from "@/lib/uploads/stored-url";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function extensionFromFile(file: File): string | null {
  const fromMime = MIME_TO_EXT[file.type];
  if (fromMime) return fromMime;

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png" || ext === "webp" || ext === "gif") return ext;
  return null;
}

export function validateStoredImage(
  file: File,
  maxSize: number = MAX_STORED_IMAGE_SIZE
): { mimeType: string; ext: string } {
  const ext = extensionFromFile(file);
  if (!ext) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
  }

  let mimeType = file.type?.trim() ?? "";
  if (!mimeType || mimeType === "application/octet-stream") {
    mimeType = EXT_TO_MIME[ext] ?? "";
  }
  if (!(STORED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
  }
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }
  return { mimeType, ext };
}

export function generateStoredFilename(ext: string): string {
  const randomHex = crypto.randomBytes(8).toString("hex");
  return `${Date.now()}-${randomHex}.${ext}`;
}

export async function storeUploadedImage(
  file: File,
  folder: StoredUploadFolder,
  maxSize: number = MAX_STORED_IMAGE_SIZE
): Promise<{ url: string; filename: string; size: number; folder: StoredUploadFolder }> {
  if (!isStoredUploadFolder(folder)) {
    throw new Error(`Invalid folder. Allowed: ${STORED_UPLOAD_FOLDERS.join(", ")}`);
  }

  const { mimeType, ext } = validateStoredImage(file, maxSize);
  const filename = generateStoredFilename(ext);
  const buffer = Buffer.from(await file.arrayBuffer());

  await connectDB();

  await StoredUpload.create({
    folder,
    filename,
    mimeType,
    size: file.size,
    data: buffer,
  });

  return {
    url: buildStoredUploadUrl(folder, filename),
    filename,
    size: file.size,
    folder,
  };
}

export async function getStoredUpload(folder: string, filename: string) {
  if (!isStoredUploadFolder(folder)) return null;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) return null;

  await connectDB();
  return StoredUpload.findOne({ folder, filename }).lean();
}

export async function readStoredUploadBody(doc: {
  mimeType: string;
  size: number;
  data?: Buffer | { buffer: ArrayBuffer } | Uint8Array;
  storage?: "mongo" | "r2";
  r2Key?: string;
}): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (doc.storage === "r2" && doc.r2Key) {
    const r2File = await readFromR2(doc.r2Key);
    return { buffer: r2File.buffer, mimeType: r2File.mimeType || doc.mimeType };
  }
  if (!doc.data) return null;
  const raw = doc.data;
  const buffer = Buffer.isBuffer(raw)
    ? raw
    : raw instanceof Uint8Array
      ? Buffer.from(raw)
      : Buffer.from(new Uint8Array(raw.buffer));
  return { buffer, mimeType: doc.mimeType };
}

export async function registerStoredUploadFromR2(params: {
  folder: StoredUploadFolder;
  filename: string;
  mimeType: string;
  size: number;
  r2Key: string;
}): Promise<{ url: string; filename: string; size: number; folder: StoredUploadFolder }> {
  await connectDB();
  await StoredUpload.create({
    folder: params.folder,
    filename: params.filename,
    mimeType: params.mimeType,
    size: params.size,
    storage: "r2",
    r2Key: params.r2Key,
  });

  return {
    url: buildStoredUploadUrl(params.folder, params.filename),
    filename: params.filename,
    size: params.size,
    folder: params.folder,
  };
}

export async function deleteStoredUploadByUrl(url: string): Promise<boolean> {
  const parsed = parseStoredUploadUrl(url);
  if (!parsed) return false;

  await connectDB();
  const doc = await StoredUpload.findOne({
    folder: parsed.folder,
    filename: parsed.filename,
  }).lean();
  if (doc?.storage === "r2" && doc.r2Key) {
    await deleteFromR2(doc.r2Key);
  }
  const result = await StoredUpload.deleteOne({
    folder: parsed.folder,
    filename: parsed.filename,
  });
  return result.deletedCount > 0;
}

export async function deleteStoredUpload(folder: StoredUploadFolder, filename: string): Promise<boolean> {
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) return false;

  await connectDB();
  const result = await StoredUpload.deleteOne({ folder, filename });
  return result.deletedCount > 0;
}
