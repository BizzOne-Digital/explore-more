import fs from "fs/promises";
import path from "path";
import { requireRole } from "@/lib/api/auth-helpers";
import { jsonError } from "@/lib/api/response";
import { readPrivateStoredFile } from "@/lib/services/private-stored-upload";
import { parentCanAccessNotificationFile } from "@/lib/notifications/access";

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_MAP[ext] ?? "application/octet-stream";
}

function normalizePath(filePath: string): string {
  return filePath.startsWith("/") ? filePath.slice(1) : filePath;
}

async function readPublicUpload(relativePath: string): Promise<Buffer | null> {
  const publicRoot = path.join(process.cwd(), "public", "uploads");
  const absolutePath = path.resolve(process.cwd(), "public", relativePath);

  if (!absolutePath.startsWith(publicRoot)) {
    return null;
  }

  try {
    return await fs.readFile(absolutePath);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const sessionResult = await requireRole(["parent", "administrator"]);
  if ("error" in sessionResult) return sessionResult.error;

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");
  const download = searchParams.get("download") === "1";

  if (!filePath || filePath.includes("..")) {
    return jsonError("Invalid file path", 400);
  }

  const normalized = normalizePath(filePath);

  if (sessionResult.user.role === "parent") {
    const allowed = await parentCanAccessNotificationFile(sessionResult.user.id, normalized);
    if (!allowed) {
      return jsonError("You do not have access to this file", 403);
    }
  }

  if (normalized.startsWith("notifications/")) {
    const stored = await readPrivateStoredFile(normalized);
    if (!stored) return jsonError("File not found", 404);

    const filename = path.basename(normalized);
    return new Response(new Uint8Array(stored.buffer), {
      status: 200,
      headers: {
        "Content-Type": stored.mimeType || getMimeType(filename),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  if (normalized.startsWith("uploads/")) {
    const buffer = await readPublicUpload(normalized);
    if (!buffer) return jsonError("File not found", 404);

    const filename = path.basename(normalized);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": getMimeType(filename),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  return jsonError("Invalid file path", 400);
}
