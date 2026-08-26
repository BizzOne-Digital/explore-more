import path from "path";
import { requireRole } from "@/lib/api/auth-helpers";
import { jsonError } from "@/lib/api/response";
import { readPrivateStoredFile } from "@/lib/services/private-stored-upload";
import { readPrivateFile } from "@/lib/services/upload";

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

export async function GET(request: Request) {
  const sessionResult = await requireRole(["parent", "administrator"]);
  if ("error" in sessionResult) return sessionResult.error;

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath || filePath.includes("..")) {
    return jsonError("Invalid file path", 400);
  }

  const normalized = filePath.startsWith("/") ? filePath.slice(1) : filePath;

  if (normalized.startsWith("notifications/")) {
    const stored = await readPrivateStoredFile(normalized);
    if (!stored) return jsonError("File not found", 404);

    const filename = path.basename(normalized);
    return new Response(new Uint8Array(stored.buffer), {
      status: 200,
      headers: {
        "Content-Type": stored.mimeType || getMimeType(filename),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  if (!filePath.startsWith("/uploads/")) {
    return jsonError("Invalid file path", 400);
  }

  const absolutePath = path.join(process.cwd(), "public", filePath);
  const publicRoot = path.join(process.cwd(), "public", "uploads");

  if (!absolutePath.startsWith(publicRoot)) {
    return jsonError("Invalid file path", 400);
  }

  try {
    const buffer = await readPrivateFile(filePath.replace(/^\//, ""));
    const filename = path.basename(filePath);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": getMimeType(filename),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return jsonError("File not found", 404);
  }
}
