import crypto from "crypto";
import connectDB from "@/lib/db";
import { StoredUpload } from "@/models";
import {
  MAX_STORED_IMAGE_SIZE,
  STORED_IMAGE_MIME_TYPES,
  STORED_UPLOAD_FOLDERS,
  type StoredUploadFolder,
} from "@/lib/constants";
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

function extensionFromFile(file: File): string | null {
  const fromMime = MIME_TO_EXT[file.type];
  if (fromMime) return fromMime;

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png" || ext === "webp" || ext === "gif") return ext;
  return null;
}

function validateStoredImage(file: File): { mimeType: string; ext: string } {
  const ext = extensionFromFile(file);
  if (!ext || !(STORED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
  }
  if (file.size > MAX_STORED_IMAGE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_STORED_IMAGE_SIZE / 1024 / 1024}MB`);
  }
  return { mimeType: file.type, ext };
}

function generateStoredFilename(ext: string): string {
  const randomHex = crypto.randomBytes(8).toString("hex");
  return `${Date.now()}-${randomHex}.${ext}`;
}

export async function storeUploadedImage(
  file: File,
  folder: StoredUploadFolder
): Promise<{ url: string; filename: string; size: number; folder: StoredUploadFolder }> {
  if (!isStoredUploadFolder(folder)) {
    throw new Error(`Invalid folder. Allowed: ${STORED_UPLOAD_FOLDERS.join(", ")}`);
  }

  const { mimeType, ext } = validateStoredImage(file);
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

export async function deleteStoredUploadByUrl(url: string): Promise<boolean> {
  const parsed = parseStoredUploadUrl(url);
  if (!parsed) return false;

  await connectDB();
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
