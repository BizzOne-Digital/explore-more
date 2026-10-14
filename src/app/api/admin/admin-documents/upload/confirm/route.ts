import { z } from "zod";
import connectDB from "@/lib/db";
import { AdminDocument, AdminDocumentFolder } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { MAX_PDF_UPLOAD_SIZE } from "@/lib/constants";
import { registerPrivateR2Upload } from "@/lib/services/private-stored-upload";

export const runtime = "nodejs";

const confirmSchema = z.object({
  folderId: z.string().min(1),
  path: z.string().min(1),
  filename: z.string().min(1),
  r2Key: z.string().min(1),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().max(120),
  size: z.number().int().positive().max(MAX_PDF_UPLOAD_SIZE),
  title: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const parsed = confirmSchema.parse(await request.json());
    if (!isValidObjectId(parsed.folderId)) {
      return apiError(new Error("Select a folder first"), 400);
    }

    await connectDB();
    const folder = await AdminDocumentFolder.findById(parsed.folderId);
    if (!folder) return apiError(new Error("Folder not found"), 404);

    const uploaded = await registerPrivateR2Upload({
      folder: "admin-documents",
      filename: parsed.filename,
      originalName: parsed.originalName,
      mimeType: parsed.mimeType,
      size: parsed.size,
      r2Key: parsed.r2Key,
    });

    const title =
      parsed.title?.trim() ||
      parsed.originalName.replace(/\.pdf$/i, "") ||
      "Document";

    const uploadedBy = isValidObjectId(sessionResult.user.id)
      ? sessionResult.user.id
      : undefined;

    const document = await AdminDocument.create({
      folderId: parsed.folderId,
      title,
      filePath: uploaded.path,
      originalFileName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.size,
      uploadedBy,
    });

    return apiSuccess({ document }, 201);
  } catch (error) {
    return apiError(error);
  }
}
