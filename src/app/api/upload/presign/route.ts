import { z } from "zod";
import { requireRole } from "@/lib/api/auth-helpers";
import {
  MAX_BOOK_SAMPLE_PAGE_MB,
  MAX_BOOK_SAMPLE_PAGE_SIZE,
  MAX_STORED_IMAGE_SIZE,
  STORED_UPLOAD_FOLDERS,
  VERCEL_SAFE_UPLOAD_SIZE,
} from "@/lib/constants";
import {
  generateStoredFilename,
  isStoredUploadFolder,
  validateStoredImage,
} from "@/lib/services/stored-upload";
import { createR2PresignedPutUrl, isR2Configured } from "@/lib/services/r2-storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(120).optional().default("application/octet-stream"),
  folder: z.string().min(1),
  maxSizeMb: z.number().positive().optional(),
});

export async function POST(request: Request) {
  const authResult = await requireRole(["administrator"]);
  if ("error" in authResult) return authResult.error;

  try {
    const body = presignSchema.parse(await request.json());
    if (!isStoredUploadFolder(body.folder)) {
      return NextResponse.json(
        { success: false, error: `Invalid folder. Allowed: ${STORED_UPLOAD_FOLDERS.join(", ")}` },
        { status: 400 }
      );
    }

    const maxSize =
      body.maxSizeMb != null && body.maxSizeMb > 0 && body.maxSizeMb <= MAX_BOOK_SAMPLE_PAGE_MB
        ? body.maxSizeMb * 1024 * 1024
        : MAX_STORED_IMAGE_SIZE;
    const cappedMax = Math.min(maxSize, MAX_BOOK_SAMPLE_PAGE_SIZE);

    const pseudoFile = {
      name: body.fileName,
      type: body.mimeType,
      size: body.fileSize,
    } as File;

    const { mimeType, ext } = validateStoredImage(pseudoFile, cappedMax);

    if (body.fileSize <= VERCEL_SAFE_UPLOAD_SIZE) {
      return NextResponse.json({ success: true, direct: true });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          success: false,
          error: `Photos over 4 MB cannot upload on the live site until Cloudflare R2 is configured in Vercel. Use a smaller JPG/PNG (under 4 MB), or ask your developer to enable R2.`,
        },
        { status: 400 }
      );
    }

    const filename = generateStoredFilename(ext);
    const r2Key = `site/${body.folder}/${filename}`;
    const uploadUrl = await createR2PresignedPutUrl(r2Key, mimeType);

    return NextResponse.json({
      success: true,
      direct: false,
      uploadUrl,
      r2Key,
      filename,
      folder: body.folder,
      contentType: mimeType,
      size: body.fileSize,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Presign failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
