import { z } from "zod";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { MAX_PDF_UPLOAD_SIZE } from "@/lib/constants";
import { attachBookDigitalFile } from "@/lib/services/book-digital-storage";

export const runtime = "nodejs";

const confirmSchema = z.object({
  bookId: z.string().min(1),
  r2Key: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(MAX_PDF_UPLOAD_SIZE),
  fileType: z.string().min(1).max(20),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return apiError(new Error("Unauthorized"), 401);
    }

    const body = confirmSchema.parse(await request.json());
    if (!isValidObjectId(body.bookId)) {
      return apiError(new Error("Invalid book id"), 400);
    }

    const digitalFile = await attachBookDigitalFile(body.bookId, {
      storage: "r2",
      r2Key: body.r2Key,
      fileName: body.fileName,
      fileSizeBytes: body.fileSizeBytes,
      fileType: body.fileType,
    });

    return apiSuccess({
      message: "Digital file uploaded to cloud storage",
      digitalFile,
    });
  } catch (error) {
    return apiError(error);
  }
}
