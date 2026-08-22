import { storePrivateUpload } from "@/lib/services/private-stored-upload";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { MAX_ASSESSMENT_PDF_SIZE } from "@/lib/assessments/constants";

export const runtime = "nodejs";

function isPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "parent") {
      return apiError(new Error("Unauthorized"), 401);
    }

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

    if (file.size > MAX_ASSESSMENT_PDF_SIZE) {
      return apiError(new Error("Maximum file size is 30 MB."), 400);
    }

    if (!isPdfFile(file)) {
      return apiError(new Error("Please upload a PDF file."), 400);
    }

    const uploaded = await storePrivateUpload(file, "assessments", MAX_ASSESSMENT_PDF_SIZE);
    return apiSuccess({ path: uploaded.path }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return apiError(new Error(message), 400);
  }
}
