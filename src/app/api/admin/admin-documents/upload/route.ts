import connectDB from "@/lib/db";
import { AdminDocument, AdminDocumentFolder } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { storePrivateUpload } from "@/lib/services/private-stored-upload";
import { MAX_PDF_UPLOAD_MB, MAX_PDF_UPLOAD_SIZE } from "@/lib/constants";

export const runtime = "nodejs";

function isPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
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
    const folderId = String(formData.get("folderId") ?? "");
    const titleRaw = String(formData.get("title") ?? "").trim();

    if (!(file instanceof File)) {
      return apiError(new Error("No file provided"), 400);
    }
    if (!isValidObjectId(folderId)) {
      return apiError(new Error("Select a folder first"), 400);
    }
    if (!isPdfFile(file)) {
      return apiError(new Error("Only PDF files are allowed"), 400);
    }
    if (file.size > MAX_PDF_UPLOAD_SIZE) {
      return apiError(new Error(`Maximum file size is ${MAX_PDF_UPLOAD_MB} MB`), 400);
    }

    await connectDB();
    const folder = await AdminDocumentFolder.findById(folderId);
    if (!folder) return apiError(new Error("Folder not found"), 404);

    const uploaded = await storePrivateUpload(file, "admin-documents", MAX_PDF_UPLOAD_SIZE);
    const title = titleRaw || file.name.replace(/\.pdf$/i, "") || "Document";

    const document = await AdminDocument.create({
      folderId,
      title,
      filePath: uploaded.path,
      originalFileName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.size,
      uploadedBy: sessionResult.user.id,
    });

    return apiSuccess({ document }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return apiError(new Error(message), 400);
  }
}
