import connectDB from "@/lib/db";
import { uploadCampaignFile } from "@/lib/services/upload";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";

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
    if (!(file instanceof File)) {
      return apiError(new Error("No file provided"), 400);
    }

    await connectDB();
    const result = await uploadCampaignFile(file);

    return apiSuccess(
      { url: result.url, filename: result.filename, originalName: result.originalName },
      201
    );
  } catch (error) {
    return apiError(error, 400);
  }
}
