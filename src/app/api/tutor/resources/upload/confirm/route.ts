import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { MAX_TUTOR_RESOURCE_UPLOAD_SIZE } from "@/lib/constants";
import { registerPrivateR2Upload } from "@/lib/services/private-stored-upload";

export const runtime = "nodejs";

const confirmSchema = z.object({
  path: z.string().min(1),
  filename: z.string().min(1),
  r2Key: z.string().min(1),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().max(120),
  size: z.number().int().positive().max(MAX_TUTOR_RESOURCE_UPLOAD_SIZE),
});

export async function POST(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  try {
    const parsed = confirmSchema.parse(await request.json());
    const uploaded = await registerPrivateR2Upload({
      folder: "resources",
      filename: parsed.filename,
      originalName: parsed.originalName,
      mimeType: parsed.mimeType,
      size: parsed.size,
      r2Key: parsed.r2Key,
    });

    return jsonOk({
      filePath: uploaded.path,
      filename: uploaded.filename,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Upload failed", 400);
  }
}
