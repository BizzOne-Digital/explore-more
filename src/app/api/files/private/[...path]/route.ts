import connectDB from "@/lib/db";
import { readPrivateFile } from "@/lib/services/upload";
import { Result, Certificate } from "@/models";
import { requireSession } from "@/lib/api/auth-helpers";
import { canAccessStudentData } from "@/lib/auth/access";
import { jsonError } from "@/lib/api/response";

type RouteContext = { params: Promise<{ path: string[] }> };

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function getMimeType(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return MIME_MAP[ext] ?? "application/octet-stream";
}

import type { SessionUser } from "@/types";

async function authorizeFileAccess(
  user: SessionUser,
  relativePath: string
): Promise<boolean> {
  await connectDB();

  const [folder, filename] = relativePath.split("/");
  if (!folder || !filename) return false;

  if (user.role === "administrator" || user.role === "instructor") return true;

  if (folder === "results") {
    const result = await Result.findOne({ privateAttachment: relativePath });
    if (!result) return false;
    return canAccessStudentData(user, result.studentId.toString());
  }

  if (folder === "certificates") {
    const cert = await Certificate.findOne({ filePath: relativePath });
    if (!cert) return false;
    return canAccessStudentData(user, cert.studentId.toString());
  }

  if (folder === "documents") {
    return user.role === "student" || user.role === "parent";
  }

  return false;
}

export async function GET(_request: Request, context: RouteContext) {
  const sessionResult = await requireSession();
  if ("error" in sessionResult) return sessionResult.error;

  const { path: pathSegments } = await context.params;
  const relativePath = pathSegments.join("/");

  if (!relativePath || relativePath.includes("..")) {
    return jsonError("Invalid file path", 400);
  }

  const allowed = await authorizeFileAccess(sessionResult.user, relativePath);

  if (!allowed) {
    return jsonError("Forbidden", 403);
  }

  try {
    const buffer = await readPrivateFile(relativePath);
    const filename = relativePath.split("/").pop() ?? "file";

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": getMimeType(filename),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return jsonError("File not found", 404);
  }
}
