import { z } from "zod";
import connectDB from "@/lib/db";
import { AdminDocumentFolder } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import {
  MAX_PDF_UPLOAD_MB,
  MAX_PDF_UPLOAD_SIZE,
  VERCEL_SAFE_UPLOAD_SIZE,
} from "@/lib/constants";
import { validatePrivateUploadFile } from "@/lib/services/private-stored-upload";
import { createR2PresignedPutUrl, isR2Configured } from "@/lib/services/r2-storage";

export const runtime = "nodejs";

const presignSchema = z.object({
  folderId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_PDF_UPLOAD_SIZE),
  mimeType: z.string().max(120).optional().default("application/pdf"),
});

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const body = presignSchema.parse(await request.json());
    if (!isValidObjectId(body.folderId)) {
      return apiError(new Error("Select a folder first"), 400);
    }

    const pseudoFile = {
      name: body.fileName,
      type: body.mimeType,
      size: body.fileSize,
    } as File;

    const { filename, mimeType } = validatePrivateUploadFile(
      pseudoFile,
      "admin-documents",
      MAX_PDF_UPLOAD_SIZE
    );

    await connectDB();
    const folder = await AdminDocumentFolder.findById(body.folderId).select("_id").lean();
    if (!folder) return apiError(new Error("Folder not found"), 404);

    if (body.fileSize <= VERCEL_SAFE_UPLOAD_SIZE) {
      return apiSuccess({ direct: true });
    }

    if (!isR2Configured()) {
      return apiError(
        new Error(
          `This PDF is over 4 MB. Configure Cloudflare R2 on the server to upload up to ${MAX_PDF_UPLOAD_MB} MB, or use a smaller file.`
        ),
        400
      );
    }

    const r2Key = `private/admin-documents/${filename}`;
    const uploadUrl = await createR2PresignedPutUrl(r2Key, mimeType);

    return apiSuccess({
      direct: false,
      uploadUrl,
      path: `admin-documents/${filename}`,
      filename,
      r2Key,
      contentType: mimeType,
    });
  } catch (error) {
    return apiError(error);
  }
}
