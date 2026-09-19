import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { assertR2MultipartAccess, type R2MultipartScope } from "@/lib/uploads/r2-multipart-auth";
import { completeR2MultipartUpload } from "@/lib/services/r2-multipart";

export const runtime = "nodejs";

const completeSchema = z.object({
  scope: z.enum(["book-digital", "tutor-resource"]),
  uploadId: z.string().min(1),
  key: z.string().min(1),
  parts: z.array(
    z.object({
      partNumber: z.number().int().positive(),
      etag: z.string().min(1),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const body = completeSchema.parse(await request.json());
    await assertR2MultipartAccess(body.scope);

    await completeR2MultipartUpload(body.key, body.uploadId, body.parts);

    return jsonOk({ key: body.key });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Upload failed", 400);
  }
}
