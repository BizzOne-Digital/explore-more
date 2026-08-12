import connectDB from "@/lib/db";
import { uploadPublicImage, ensureUploadDirs } from "@/lib/services/upload";
import type { UploadCategory } from "@/lib/services/upload";
import { UPLOAD_DIRS } from "@/lib/constants";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireRole } from "@/lib/api/auth-helpers";

export async function POST(request: Request) {
  const authResult = await requireRole(["administrator"]);
  if ("error" in authResult) return authResult.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data");
  }

  const file = formData.get("file");
  const category = formData.get("category") as string;

  if (!(file instanceof File)) {
    return jsonError("No file provided");
  }

  if (!category || !(category in UPLOAD_DIRS)) {
    return jsonError(`Invalid category. Allowed: ${Object.keys(UPLOAD_DIRS).join(", ")}`);
  }

  try {
    await ensureUploadDirs();
    const result = await uploadPublicImage(file, category as UploadCategory);
    return jsonOk({ url: result.url, filename: result.filename }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return jsonError(message, 400);
  }
}
