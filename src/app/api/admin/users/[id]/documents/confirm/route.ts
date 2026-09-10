import { z } from "zod";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { User, UserDocument } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { MAX_PORTFOLIO_UPLOAD_SIZE } from "@/lib/constants";
import { registerPrivateR2Upload } from "@/lib/services/private-stored-upload";

export const runtime = "nodejs";

const confirmSchema = z.object({
  path: z.string().min(1),
  filename: z.string().min(1),
  r2Key: z.string().min(1),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().max(120),
  size: z.number().int().positive().max(MAX_PORTFOLIO_UPLOAD_SIZE),
  label: z.string().max(200).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid user id"), 400);

    const parsed = confirmSchema.parse(await request.json());

    await connectDB();
    const user = await User.findById(id).select("_id name").lean();
    if (!user) return apiError(new Error("User not found"), 404);

    const uploaded = await registerPrivateR2Upload({
      folder: "user-documents",
      filename: parsed.filename,
      originalName: parsed.originalName,
      mimeType: parsed.mimeType,
      size: parsed.size,
      r2Key: parsed.r2Key,
    });

    const staff = await User.findById(session.user.id).select("name").lean();

    const document = await UserDocument.create({
      userId: id,
      path: uploaded.path,
      fileName: uploaded.filename,
      originalName: uploaded.originalName,
      label: parsed.label?.trim() || undefined,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      uploadedBy: session.user.id,
      uploadedByName: staff?.name ?? session.user.name ?? "Admin",
    });

    return apiSuccess(document, 201);
  } catch (error) {
    return apiError(error);
  }
}
