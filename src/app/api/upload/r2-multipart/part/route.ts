import { jsonOk, jsonError } from "@/lib/api/response";
import { R2_UPLOAD_CHUNK_SIZE } from "@/lib/constants";
import { assertR2MultipartAccess, type R2MultipartScope } from "@/lib/uploads/r2-multipart-auth";
import { uploadR2MultipartPart } from "@/lib/services/r2-multipart";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError("Invalid form data", 400);
    }

    const scope = String(formData.get("scope") ?? "") as R2MultipartScope;
    if (scope !== "book-digital" && scope !== "tutor-resource") {
      return jsonError("Invalid upload scope", 400);
    }
    await assertR2MultipartAccess(scope);

    const uploadId = String(formData.get("uploadId") ?? "");
    const key = String(formData.get("key") ?? "");
    const partNumber = Number(formData.get("partNumber"));
    const chunk = formData.get("chunk");

    if (!uploadId || !key || !Number.isInteger(partNumber) || partNumber < 1) {
      return jsonError("Missing upload metadata", 400);
    }
    if (!(chunk instanceof Blob)) {
      return jsonError("Missing file chunk", 400);
    }
    if (chunk.size > R2_UPLOAD_CHUNK_SIZE + 256 * 1024) {
      return jsonError("Chunk is too large", 400);
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());
    const { etag } = await uploadR2MultipartPart(key, uploadId, partNumber, buffer);

    return jsonOk({ etag, partNumber });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Chunk upload failed", 400);
  }
}
