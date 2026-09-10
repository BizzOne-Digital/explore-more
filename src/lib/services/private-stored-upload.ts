import crypto from "crypto";
import connectDB from "@/lib/db";
import { StoredUpload } from "@/models";
import {
  MAX_MONGO_PRIVATE_UPLOAD_SIZE,
  PRIVATE_STORED_FOLDERS,
  type PrivateStoredFolder,
} from "@/lib/constants";
import { isR2Configured, readFromR2, uploadToR2 } from "@/lib/services/r2-storage";

const MAX_CERTIFICATE_SIZE = 50 * 1024 * 1024;

const PRIVATE_MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

const SPONSOR_FILE_EXTENSIONS = ["pdf", "doc", "docx"] as const;

const NOTIFICATION_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "zip",
  "mp4",
  "mov",
  "mp3",
  "wav",
  "jpg",
  "png",
  "webp",
  "gif",
  "svg",
] as const;

const PORTFOLIO_FILE_EXTENSIONS = [
  ...NOTIFICATION_FILE_EXTENSIONS,
  "heic",
] as const;

const GENERAL_ATTACHMENT_EXTENSIONS = PORTFOLIO_FILE_EXTENSIONS;

function extensionFromPrivateFile(file: File, folder?: PrivateStoredFolder): string | null {
  const fromMime = PRIVATE_MIME_TO_EXT[file.type];
  if (fromMime) return fromMime;

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === "jpeg") return "jpg";

  if (folder === "sponsors") {
    if ((SPONSOR_FILE_EXTENSIONS as readonly string[]).includes(ext)) return ext;
    return null;
  }

  if (folder === "notifications") {
    if ((NOTIFICATION_FILE_EXTENSIONS as readonly string[]).includes(ext)) return ext;
    return null;
  }

  if (folder === "user-documents") {
    if ((NOTIFICATION_FILE_EXTENSIONS as readonly string[]).includes(ext)) return ext;
    return null;
  }

  if (
    folder === "resources" ||
    folder === "portfolio" ||
    folder === "messages"
  ) {
    if ((GENERAL_ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext)) return ext;
    return null;
  }

  if (["pdf", "jpg", "png", "webp", "gif"].includes(ext)) return ext;
  return null;
}

function generatePrivateFilename(ext: string): string {
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
}

function bufferFromStoredData(data: Buffer | { buffer: ArrayBuffer } | Uint8Array): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  return Buffer.from(new Uint8Array(data.buffer));
}

export function isPrivateStoredFolder(value: string): value is PrivateStoredFolder {
  return (PRIVATE_STORED_FOLDERS as readonly string[]).includes(value);
}

export function validatePrivateUploadFile(
  file: File,
  folder: PrivateStoredFolder,
  maxSize = MAX_CERTIFICATE_SIZE
): { filename: string; mimeType: string } {
  if (!isPrivateStoredFolder(folder)) {
    throw new Error(`Invalid private upload folder: ${folder}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  const ext = extensionFromPrivateFile(file, folder);
  if (!ext) {
    const allowed =
      folder === "sponsors"
        ? "PDF, Word (.doc, .docx)"
        : folder === "notifications" || folder === "user-documents"
          ? "PDF, images, Office documents, zip, audio, and video"
          : folder === "resources" || folder === "portfolio" || folder === "messages"
            ? "PDF, images, Office documents, zip, audio, and video"
            : "PDF, JPEG, PNG, WebP, GIF";
    throw new Error(`Invalid file type. Allowed: ${allowed}`);
  }

  const filename = generatePrivateFilename(ext);
  const mimeType = file.type || (ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`);
  return { filename, mimeType };
}

export async function storePrivateUpload(
  file: File,
  folder: PrivateStoredFolder,
  maxSize = MAX_CERTIFICATE_SIZE
): Promise<{
  path: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}> {
  const { filename, mimeType } = validatePrivateUploadFile(file, folder, maxSize);

  await connectDB();

  if (file.size > MAX_MONGO_PRIVATE_UPLOAD_SIZE) {
    if (!isR2Configured()) {
      throw new Error(
        "This file is too large for database storage (max 15 MB). Configure Cloudflare R2 for files up to 50 MB, or compress the file."
      );
    }

    const r2Key = `private/${folder}/${filename}`;
    await uploadToR2(file, r2Key);
    await StoredUpload.create({
      folder,
      filename,
      mimeType,
      size: file.size,
      storage: "r2",
      r2Key,
    });

    return {
      path: `${folder}/${filename}`,
      filename,
      originalName: file.name,
      mimeType,
      size: file.size,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await StoredUpload.create({
    folder,
    filename,
    mimeType,
    size: file.size,
    data: buffer,
    storage: "mongo",
  });

  return {
    path: `${folder}/${filename}`,
    filename,
    originalName: file.name,
    mimeType,
    size: file.size,
  };
}

export async function registerPrivateR2Upload(input: {
  folder: PrivateStoredFolder;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  r2Key: string;
}): Promise<{
  path: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}> {
  if (!isPrivateStoredFolder(input.folder)) {
    throw new Error(`Invalid private upload folder: ${input.folder}`);
  }

  await connectDB();
  await StoredUpload.create({
    folder: input.folder,
    filename: input.filename,
    mimeType: input.mimeType,
    size: input.size,
    storage: "r2",
    r2Key: input.r2Key,
  });

  return {
    path: `${input.folder}/${input.filename}`,
    filename: input.filename,
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size,
  };
}

export async function readPrivateStoredFile(relativePath: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  size: number;
} | null> {
  const [folder, ...rest] = relativePath.split("/");
  const filename = rest.join("/");

  if (!folder || !filename || !isPrivateStoredFolder(folder)) {
    return null;
  }

  if (filename.includes("..") || filename.includes("\\")) {
    return null;
  }

  await connectDB();
  const doc = await StoredUpload.findOne({ folder, filename }).lean();
  if (!doc) return null;

  if (doc.storage === "r2" && doc.r2Key) {
    const r2File = await readFromR2(doc.r2Key);
    return {
      buffer: r2File.buffer,
      mimeType: r2File.mimeType || doc.mimeType,
      size: doc.size,
    };
  }

  if (!doc.data) return null;

  return {
    buffer: bufferFromStoredData(doc.data as Buffer | { buffer: ArrayBuffer } | Uint8Array),
    mimeType: doc.mimeType,
    size: doc.size,
  };
}

export async function deletePrivateStoredFile(relativePath: string): Promise<boolean> {
  const [folder, ...rest] = relativePath.split("/");
  const filename = rest.join("/");

  if (!folder || !filename || !isPrivateStoredFolder(folder)) {
    return false;
  }

  if (filename.includes("..") || filename.includes("\\")) {
    return false;
  }

  await connectDB();
  const result = await StoredUpload.deleteOne({ folder, filename });
  return result.deletedCount > 0;
}
