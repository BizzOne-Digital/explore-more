import connectDB from "@/lib/db";
import { readPrivateFile } from "@/lib/services/upload";
import { readPrivateStoredFile } from "@/lib/services/private-stored-upload";
import { Result, Certificate, Assessment, AssessmentSubmission, UserDocument } from "@/models";
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

  if (folder === "assessments") {
    const assessment = await Assessment.findOne({ filePath: relativePath });
    if (assessment) {
      if (user.role === "parent") {
        const { getParentChildrenGrades } = await import("@/lib/grades/queries");
        const grades = await getParentChildrenGrades(user.id);
        return grades.includes(assessment.grade as never);
      }
      return false;
    }

    const submission = await AssessmentSubmission.findOne({ filePath: relativePath });
    if (!submission) return false;
    if (user.role === "parent") return submission.parentId.toString() === user.id;
    return canAccessStudentData(user, submission.studentId.toString());
  }

  if (folder === "books") {
    return false;
  }

  if (folder === "documents") {
    return user.role === "student" || user.role === "parent";
  }

  if (folder === "portfolio" || folder === "messages" || folder === "notifications") {
    return ["administrator", "instructor", "parent", "student"].includes(user.role);
  }

  if (folder === "user-documents") {
    const doc = await UserDocument.findOne({ path: relativePath }).lean();
    if (!doc) return false;
    if (["administrator", "instructor", "staff"].includes(user.role)) return true;
    return doc.userId.toString() === user.id;
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
    const stored = await readPrivateStoredFile(relativePath);
    if (stored) {
      const filename = relativePath.split("/").pop() ?? "file";
      return new Response(new Uint8Array(stored.buffer), {
        headers: {
          "Content-Type": stored.mimeType,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

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
