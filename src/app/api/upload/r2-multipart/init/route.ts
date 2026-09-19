import { z } from "zod";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { jsonOk, jsonError } from "@/lib/api/response";
import { isValidObjectId } from "@/lib/admin/api";
import {
  MAX_PDF_UPLOAD_MB,
  MAX_PDF_UPLOAD_SIZE,
  MAX_TUTOR_RESOURCE_UPLOAD_SIZE,
} from "@/lib/constants";
import { assertR2MultipartAccess } from "@/lib/uploads/r2-multipart-auth";
import {
  bookMimeType,
  detectBookFileType,
  isAllowedBookFile,
  sanitizeBookFilename,
} from "@/lib/services/book-digital-storage";
import { initR2MultipartUpload } from "@/lib/services/r2-multipart";
import { isR2Configured } from "@/lib/services/r2-storage";
import { validatePrivateUploadFile } from "@/lib/services/private-stored-upload";

export const runtime = "nodejs";

const initSchema = z.object({
  scope: z.enum(["book-digital", "tutor-resource"]),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(120).optional().default("application/octet-stream"),
  bookId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = initSchema.parse(await request.json());
    await assertR2MultipartAccess(body.scope);

    if (!isR2Configured()) {
      return jsonError(
        `Large uploads need Cloudflare R2 on the live site (Vercel env vars). Files over 4 MB cannot upload until that is configured.`,
        400
      );
    }

    const pseudoFile = {
      name: body.fileName,
      type: body.mimeType,
      size: body.fileSize,
    } as File;

    if (body.scope === "book-digital") {
      if (!body.bookId || !isValidObjectId(body.bookId)) {
        return jsonError("Valid bookId is required", 400);
      }
      if (!isAllowedBookFile(pseudoFile)) {
        return jsonError("Invalid file type. Allowed: PDF, EPUB, MOBI, ZIP", 400);
      }
      if (body.fileSize > MAX_PDF_UPLOAD_SIZE) {
        return jsonError(`Maximum file size is ${MAX_PDF_UPLOAD_MB} MB.`, 400);
      }

      await connectDB();
      const book = await Book.findById(body.bookId).select("_id").lean();
      if (!book) return jsonError("Book not found", 404);

      const sanitizedName = sanitizeBookFilename(body.fileName);
      const fileType = detectBookFileType(pseudoFile);
      const contentType = bookMimeType(pseudoFile, fileType);
      const key = `books/${body.bookId}-${Date.now()}-${sanitizedName}`;
      const { uploadId } = await initR2MultipartUpload(key, contentType);

      return jsonOk({
        uploadId,
        key,
        fileName: body.fileName,
        fileSizeBytes: body.fileSize,
        fileType,
        contentType,
      });
    }

    if (body.fileSize > MAX_TUTOR_RESOURCE_UPLOAD_SIZE) {
      return jsonError(
        `Maximum file size is ${MAX_TUTOR_RESOURCE_UPLOAD_SIZE / 1024 / 1024} MB.`,
        400
      );
    }

    const { filename, mimeType } = validatePrivateUploadFile(
      pseudoFile,
      "resources",
      MAX_TUTOR_RESOURCE_UPLOAD_SIZE
    );
    const key = `private/resources/${filename}`;
    const { uploadId } = await initR2MultipartUpload(key, mimeType);

    return jsonOk({
      uploadId,
      key,
      path: `resources/${filename}`,
      filename,
      contentType: mimeType,
      originalName: body.fileName,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Upload failed", 400);
  }
}
