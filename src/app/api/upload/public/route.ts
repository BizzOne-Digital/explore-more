import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import {
  LEGACY_UPLOAD_FOLDER_MAP,
  MAX_BOOK_SAMPLE_PAGE_MB,
  MAX_BOOK_SAMPLE_PAGE_SIZE,
  MAX_STORED_IMAGE_SIZE,
  UPLOAD_DIRS,
} from "@/lib/constants";
import { storeUploadedImage, isStoredUploadFolder } from "@/lib/services/stored-upload";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** @deprecated Prefer POST /api/upload — kept for older admin callers. */
export async function POST(request: Request) {
  const authResult = await requireRole(["administrator"]);
  if ("error" in authResult) return authResult.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const rawFolder = String(
    formData.get("folder") ?? formData.get("category") ?? ""
  ).trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  let folder = rawFolder;
  if (folder in UPLOAD_DIRS) {
    folder = LEGACY_UPLOAD_FOLDER_MAP[folder as keyof typeof UPLOAD_DIRS];
  }

  if (!isStoredUploadFolder(folder)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid folder. Allowed: products, gallery, pages, misc`,
      },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const maxSizeMbRaw = Number(formData.get("maxSizeMb"));
    const maxSize =
      Number.isFinite(maxSizeMbRaw) &&
      maxSizeMbRaw > 0 &&
      maxSizeMbRaw <= MAX_BOOK_SAMPLE_PAGE_MB
        ? maxSizeMbRaw * 1024 * 1024
        : MAX_STORED_IMAGE_SIZE;
    const result = await storeUploadedImage(file, folder, Math.min(maxSize, MAX_BOOK_SAMPLE_PAGE_SIZE));
    return NextResponse.json(
      {
        success: true,
        data: { url: result.url, filename: result.filename },
        url: result.url,
        filename: result.filename,
        size: result.size,
        folder: result.folder,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
