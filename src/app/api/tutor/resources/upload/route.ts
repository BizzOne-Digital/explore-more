import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { MAX_TUTOR_RESOURCE_UPLOAD_SIZE } from "@/lib/constants";
import { storePrivateUpload } from "@/lib/services/private-stored-upload";

/** Worksheet/resource files for the tutor portal — not grade Assessments (`assessments` folder). */
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
    const uploaded = await storePrivateUpload(file, "resources", MAX_TUTOR_RESOURCE_UPLOAD_SIZE);
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
