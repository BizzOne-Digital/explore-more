import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { Sponsor, User } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import {
  deletePrivateStoredFile,
  storePrivateUpload,
} from "@/lib/services/private-stored-upload";

export const runtime = "nodejs";

const MAX_SIZE = 50 * 1024 * 1024;

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

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

    await connectDB();
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) return apiError(new Error("Sponsor not found"), 404);

    if (sponsor.contract?.path) {
      await deletePrivateStoredFile(sponsor.contract.path);
    }

    const uploaded = await storePrivateUpload(file, "sponsors", MAX_SIZE);
    const staff = await User.findById(session.user.id).select("name").lean();

    sponsor.contract = {
      path: uploaded.path,
      fileName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      uploadedAt: new Date(),
      uploadedByName: staff?.name ?? "Admin",
    };
    await sponsor.save();

    return apiSuccess(sponsor.contract, 201);
  } catch (error) {
    console.error("[sponsor contract upload]", error);
    const message = error instanceof Error ? error.message : "Contract upload failed";
    return apiError(new Error(message), 400);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) return apiError(new Error("Sponsor not found"), 404);

    if (sponsor.contract?.path) {
      await deletePrivateStoredFile(sponsor.contract.path);
    }

    sponsor.contract = undefined;
    await sponsor.save();

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
