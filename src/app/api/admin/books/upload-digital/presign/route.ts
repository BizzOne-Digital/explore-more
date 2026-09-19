import { z } from "zod";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import {
  MAX_PDF_UPLOAD_MB,
  MAX_PDF_UPLOAD_SIZE,
  VERCEL_SAFE_UPLOAD_SIZE,
} from "@/lib/constants";
import {
  bookMimeType,
  detectBookFileType,
  isAllowedBookFile,
  sanitizeBookFilename,
} from "@/lib/services/book-digital-storage";
import { createR2PresignedPutUrl, isR2Configured } from "@/lib/services/r2-storage";

export const runtime = "nodejs";

const presignSchema = z.object({
  bookId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(120).optional().default("application/octet-stream"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return apiError(new Error("Unauthorized"), 401);
    }

    const body = presignSchema.parse(await request.json());
    if (!isValidObjectId(body.bookId)) {
      return apiError(new Error("Invalid book id"), 400);
    }

    const pseudoFile = {
      name: body.fileName,
      type: body.mimeType,
      size: body.fileSize,
    } as File;

    if (!isAllowedBookFile(pseudoFile)) {
      return apiError(new Error("Invalid file type. Allowed: PDF, EPUB, MOBI, ZIP"), 400);
    }

    if (body.fileSize > MAX_PDF_UPLOAD_SIZE) {
      return apiError(new Error(`Maximum file size is ${MAX_PDF_UPLOAD_MB} MB.`), 400);
    }

    await connectDB();
    const book = await Book.findById(body.bookId).select("_id").lean();
    if (!book) {
      return apiError(new Error("Book not found"), 404);
    }

    if (body.fileSize <= VERCEL_SAFE_UPLOAD_SIZE) {
      return apiSuccess({ direct: true });
    }

    if (!isR2Configured()) {
      return apiError(
        new Error(
          `Files over 4 MB must upload through cloud storage. Add Cloudflare R2 credentials in Vercel (Production), redeploy, then try again — or use a file under 4 MB.`
        ),
        400
      );
    }

    const sanitizedName = sanitizeBookFilename(body.fileName);
    const fileType = detectBookFileType(pseudoFile);
    const contentType = bookMimeType(pseudoFile, fileType);
    const r2Key = `books/${body.bookId}-${Date.now()}-${sanitizedName}`;
    const uploadUrl = await createR2PresignedPutUrl(r2Key, contentType);

    return apiSuccess({
      direct: false,
      uploadUrl,
      r2Key,
      contentType,
      fileName: body.fileName,
      fileSizeBytes: body.fileSize,
      fileType,
    });
  } catch (error) {
    return apiError(error);
  }
}
