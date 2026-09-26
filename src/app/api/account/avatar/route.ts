import connectDB from "@/lib/db";
import { requireSession } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { User } from "@/models";
import { storeUploadedImage } from "@/lib/services/stored-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const sessionResult = await requireSession();
    if ("error" in sessionResult) return sessionResult.error;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiError(new Error("Invalid form data"), 400);
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return apiError(new Error("Please choose an image file"), 400);
    }

    await connectDB();
    const result = await storeUploadedImage(file, "misc");
    const user = await User.findById(sessionResult.user.id);
    if (!user) return apiError(new Error("User not found"), 404);

    user.avatar = result.url;
    await user.save();

    return apiSuccess({ avatar: user.avatar });
  } catch (error) {
    return apiError(error);
  }
}
