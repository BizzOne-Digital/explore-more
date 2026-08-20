import connectDB from "@/lib/db";
import { ensureUploadDirs, uploadPrivateFile } from "@/lib/services/upload";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";

const MAX_SIZE = 50 * 1024 * 1024;

function isPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiError(new Error("Invalid form data"), 400);
    }

    const file = formData.get("file");
    const fileType = String(formData.get("fileType") ?? "pdf");

    if (!(file instanceof File)) {
      return apiError(new Error("No file provided"), 400);
    }

    if (file.size > MAX_SIZE) {
      return apiError(new Error("PDF upload failed. Maximum file size is 50 MB."), 400);
    }

    if (fileType === "pdf" && !isPdfFile(file)) {
      return apiError(new Error("Please upload a PDF file (application/pdf)."), 400);
    }

    if (fileType === "image" && !isImageFile(file)) {
      return apiError(new Error("Please upload an image file (PNG, JPG, or WebP)."), 400);
    }

    await connectDB();
    await ensureUploadDirs();

    const uploaded = await uploadPrivateFile(file, "certificates", MAX_SIZE);

    return apiSuccess(
      {
        path: uploaded.path,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Certificate upload failed";
    return apiError(new Error(message), 400);
  }
}
