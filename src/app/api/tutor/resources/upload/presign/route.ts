import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { MAX_TUTOR_RESOURCE_UPLOAD_SIZE, VERCEL_SAFE_UPLOAD_SIZE } from "@/lib/constants";
import { validatePrivateUploadFile } from "@/lib/services/private-stored-upload";
import { createR2PresignedPutUrl, isR2Configured } from "@/lib/services/r2-storage";

export const runtime = "nodejs";

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(120).optional().default("application/octet-stream"),
});

export async function POST(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  try {
    const body = presignSchema.parse(await request.json());
    const pseudoFile = {
      name: body.fileName,
      type: body.mimeType,
      size: body.fileSize,
    } as File;

    const { filename, mimeType } = validatePrivateUploadFile(
      pseudoFile,
      "resources",
      MAX_TUTOR_RESOURCE_UPLOAD_SIZE
    );

    if (body.fileSize <= VERCEL_SAFE_UPLOAD_SIZE) {
      return jsonOk({ direct: true });
    }

    if (!isR2Configured()) {
      return jsonError(
        "Files over 4 MB must upload through cloud storage. Configure Cloudflare R2 in production, or use a file under 4 MB.",
        400
      );
    }

    const r2Key = `private/resources/${filename}`;
    const uploadUrl = await createR2PresignedPutUrl(r2Key, mimeType);

    return jsonOk({
      direct: false,
      uploadUrl,
      path: `resources/${filename}`,
      filename,
      r2Key,
      contentType: mimeType,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Presign failed", 400);
  }
}
