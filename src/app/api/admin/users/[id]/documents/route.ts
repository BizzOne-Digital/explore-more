import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { User, UserDocument } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { storePrivateUpload } from "@/lib/services/private-stored-upload";

export const runtime = "nodejs";

const MAX_SIZE = 50 * 1024 * 1024;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid user id"), 400);

    await connectDB();
    const user = await User.findById(id).select("_id").lean();
    if (!user) return apiError(new Error("User not found"), 404);

    const documents = await UserDocument.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess(documents);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid user id"), 400);

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

    if (file.size > MAX_SIZE) {
      return apiError(new Error("File too large. Maximum size is 50 MB."), 400);
    }

    const labelEntry = formData.get("label");
    const label = typeof labelEntry === "string" ? labelEntry.trim() : "";

    await connectDB();
    const user = await User.findById(id).select("_id name").lean();
    if (!user) return apiError(new Error("User not found"), 404);

    const uploaded = await storePrivateUpload(file, "user-documents", MAX_SIZE);
    const staff = await User.findById(session.user.id).select("name").lean();

    const document = await UserDocument.create({
      userId: id,
      path: uploaded.path,
      fileName: uploaded.filename,
      originalName: uploaded.originalName,
      label: label || undefined,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      uploadedBy: session.user.id,
      uploadedByName: staff?.name ?? session.user.name ?? "Admin",
    });

    return apiSuccess(document, 201);
  } catch (error) {
    console.error("[user document upload]", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return apiError(new Error(message), 400);
  }
}
