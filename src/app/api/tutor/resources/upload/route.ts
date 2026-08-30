import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { uploadPrivateFile } from "@/lib/services/upload";

export async function POST(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("No file provided", 400);

  await connectDB();

  try {
    const uploaded = await uploadPrivateFile(file, "portfolio", 25 * 1024 * 1024);
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
