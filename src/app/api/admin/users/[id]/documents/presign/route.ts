import { z } from "zod";
import { auth } from "@/lib/auth";
import { User } from "@/models";
import connectDB from "@/lib/db";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { MAX_PORTFOLIO_UPLOAD_SIZE, VERCEL_SAFE_UPLOAD_SIZE } from "@/lib/constants";
import { validatePrivateUploadFile } from "@/lib/services/private-stored-upload";
import { createR2PresignedPutUrl, isR2Configured } from "@/lib/services/r2-storage";

export const runtime = "nodejs";

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(120).optional().default("application/octet-stream"),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid user id"), 400);

    const body = presignSchema.parse(await request.json());
    const pseudoFile = {
      name: body.fileName,
      type: body.mimeType,
      size: body.fileSize,
    } as File;

    const { filename, mimeType } = validatePrivateUploadFile(
      pseudoFile,
      "user-documents",
      MAX_PORTFOLIO_UPLOAD_SIZE
    );

    if (body.fileSize <= VERCEL_SAFE_UPLOAD_SIZE) {
      return apiSuccess({ direct: true });
    }

    if (!isR2Configured()) {
      return apiError(
        new Error(
          "This file is over 4 MB. Add Cloudflare R2 credentials in Vercel to allow uploads up to 50 MB, or use a file under 4 MB."
        ),
        400
      );
    }

    await connectDB();
    const user = await User.findById(id).select("_id").lean();
    if (!user) return apiError(new Error("User not found"), 404);

    const r2Key = `private/user-documents/${filename}`;
    const uploadUrl = await createR2PresignedPutUrl(r2Key, mimeType);

    return apiSuccess({
      direct: false,
      uploadUrl,
      path: `user-documents/${filename}`,
      filename,
      r2Key,
      contentType: mimeType,
    });
  } catch (error) {
    return apiError(error);
  }
}
