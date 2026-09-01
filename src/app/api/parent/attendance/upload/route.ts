import { storePrivateUpload } from "@/lib/services/private-stored-upload";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

const MAX_EXCUSE_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif"];

function isAllowedExcuseFile(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type)) return true;
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiError(new Error("Invalid form data"), 400);
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return apiError(new Error("No file provided"), 400);
    }

    if (file.size > MAX_EXCUSE_FILE_SIZE) {
      return apiError(new Error("Maximum file size is 10 MB."), 400);
    }

    if (!isAllowedExcuseFile(file)) {
      return apiError(new Error("Please upload a PDF or image (JPG, PNG, WebP, GIF)."), 400);
    }

    const uploaded = await storePrivateUpload(file, "attendance", MAX_EXCUSE_FILE_SIZE);
    return apiSuccess({ path: uploaded.path, originalName: uploaded.originalName }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return apiError(new Error(message), 400);
  }
}
