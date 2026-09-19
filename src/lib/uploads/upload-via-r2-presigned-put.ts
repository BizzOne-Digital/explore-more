import { VERCEL_SAFE_UPLOAD_SIZE } from "@/lib/constants";
import { describeUploadError } from "@/lib/uploads/upload-errors";
import type { R2MultipartScope } from "@/lib/uploads/r2-multipart-auth";

const CORS_HINT =
  "Large files upload directly to cloud storage. In Cloudflare R2 → your bucket → Settings → CORS, allow PUT from https://exploremoreacademy.com and https://www.exploremoreacademy.com (and http://localhost:3000 for local testing).";

async function putFileToPresignedUrl(uploadUrl: string, contentType: string, file: File) {
  try {
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (putRes.ok) return;

    const detail = (await putRes.text()).slice(0, 500);
    const lower = detail.toLowerCase();
    if (lower.includes("minimum") && lower.includes("object size")) {
      throw new Error(
        "Cloud storage rejected this upload. Please try again in a moment or use a different browser."
      );
    }
    throw new Error(detail || `Cloud upload failed (${putRes.status})`);
  } catch (error) {
    const described = describeUploadError(error);
    if (
      described.includes("internet connection") ||
      described.toLowerCase().includes("load failed")
    ) {
      throw new Error(`${described} ${CORS_HINT}`);
    }
    throw error instanceof Error ? error : new Error(described);
  }
}

type BookPresignData = {
  direct?: boolean;
  uploadUrl?: string;
  r2Key?: string;
  contentType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileType?: string;
};

type TutorPresignData = {
  direct?: boolean;
  uploadUrl?: string;
  path?: string;
  filename?: string;
  r2Key?: string;
  contentType?: string;
};

export async function uploadLargeFileViaPresignedPut(params: {
  scope: R2MultipartScope;
  file: File;
  bookId?: string;
}): Promise<BookPresignData & TutorPresignData & { r2Key: string }> {
  if (params.file.size <= VERCEL_SAFE_UPLOAD_SIZE) {
    throw new Error("File does not require cloud upload");
  }

  if (params.scope === "book-digital") {
    if (!params.bookId) throw new Error("bookId is required");

    const presignRes = await fetch("/api/admin/books/upload-digital/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: params.bookId,
        fileName: params.file.name,
        fileSize: params.file.size,
        mimeType: params.file.type || "application/octet-stream",
      }),
    });
    const presignJson = (await presignRes.json()) as {
      success?: boolean;
      error?: string;
      data?: BookPresignData;
    };
    if (!presignRes.ok || !presignJson.success || !presignJson.data) {
      throw new Error(presignJson.error || "Upload failed to start");
    }

    const presign = presignJson.data;
    if (presign.direct) {
      throw new Error("Use standard upload for this file size");
    }
    if (!presign.uploadUrl || !presign.r2Key || !presign.contentType) {
      throw new Error("Upload configuration error. Is R2 enabled on this site?");
    }

    await putFileToPresignedUrl(presign.uploadUrl, presign.contentType, params.file);
    return { ...presign, r2Key: presign.r2Key };
  }

  const presignRes = await fetch("/api/tutor/resources/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: params.file.name,
      fileSize: params.file.size,
      mimeType: params.file.type || "application/octet-stream",
    }),
  });
  const presign = (await presignRes.json()) as TutorPresignData & { error?: string };
  if (!presignRes.ok) {
    throw new Error(presign.error || "Upload failed to start");
  }
  if (presign.direct) {
    throw new Error("Use standard upload for this file size");
  }
  if (!presign.uploadUrl || !presign.r2Key || !presign.contentType) {
    throw new Error("Upload configuration error. Is R2 enabled on this site?");
  }

  await putFileToPresignedUrl(presign.uploadUrl, presign.contentType, params.file);
  return { ...presign, r2Key: presign.r2Key };
}
