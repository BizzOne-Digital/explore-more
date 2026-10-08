"use client";

import {
  MAX_BOOK_SAMPLE_PAGE_MB,
  VERCEL_SAFE_UPLOAD_SIZE,
  type StoredUploadFolder,
} from "@/lib/constants";
import { describeUploadError } from "@/lib/uploads/upload-errors";
import { putFileToPresignedUrl } from "@/lib/uploads/upload-via-r2-presigned-put";

interface UploadImageResult {
  url: string;
}

type PresignResponse = {
  success?: boolean;
  direct?: boolean;
  error?: string;
  uploadUrl?: string;
  r2Key?: string;
  filename?: string;
  folder?: string;
  contentType?: string;
};

async function parseUploadResponse(res: Response): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  const text = await res.text();
  try {
    return { ok: res.ok, json: JSON.parse(text) as Record<string, unknown> };
  } catch {
    if (res.status === 413) {
      return {
        ok: false,
        json: {
          error:
            "This image is too large to send through the server (over 4 MB). Save a smaller JPG or enable cloud storage on the live site.",
        },
      };
    }
    return {
      ok: false,
      json: { error: text.slice(0, 200) || `Upload failed (${res.status})` },
    };
  }
}

async function uploadViaPresignedR2(
  file: File,
  folder: StoredUploadFolder,
  maxSizeMb?: number
): Promise<UploadImageResult> {
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      folder,
      maxSizeMb,
    }),
  });
  const { ok, json } = await parseUploadResponse(presignRes);
  const presign = json as PresignResponse;
  if (!ok || presign.success === false) {
    throw new Error(presign.error ?? "Could not start cloud upload");
  }
  if (presign.direct) {
    throw new Error("File does not require cloud upload");
  }
  if (!presign.uploadUrl || !presign.r2Key || !presign.filename || !presign.folder) {
    throw new Error("Invalid presign response from server");
  }

  await putFileToPresignedUrl(presign.uploadUrl, presign.contentType ?? file.type, file);

  const confirmRes = await fetch("/api/upload/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder: presign.folder,
      filename: presign.filename,
      mimeType: presign.contentType ?? file.type,
      size: file.size,
      r2Key: presign.r2Key,
    }),
  });
  const confirmParsed = await parseUploadResponse(confirmRes);
  const confirmJson = confirmParsed.json;
  const url = typeof confirmJson.url === "string" ? confirmJson.url : undefined;
  if (!confirmParsed.ok || !url) {
    throw new Error(
      typeof confirmJson.error === "string" ? confirmJson.error : "Upload confirm failed"
    );
  }
  return { url };
}

async function uploadViaFormPost(
  file: File,
  folder: StoredUploadFolder,
  legacyCategory?: string,
  maxSizeMb?: number
): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  if (legacyCategory) formData.append("category", legacyCategory);
  if (maxSizeMb != null && maxSizeMb > 0) {
    formData.append("maxSizeMb", String(maxSizeMb));
  }

  const endpoints = ["/api/upload", "/api/upload/public"];
  let lastError = "Upload failed";

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, { method: "POST", body: formData });
    const { ok, json } = await parseUploadResponse(res);
    const url =
      typeof json.url === "string"
        ? json.url
        : typeof (json.data as { url?: string } | undefined)?.url === "string"
          ? (json.data as { url: string }).url
          : undefined;
    const success = json.success === true || (!!url && ok);

    if (success && url) return { url };

    lastError = typeof json.error === "string" ? json.error : lastError;
    if (res.status === 404) continue;
    if (!ok) break;
  }

  throw new Error(lastError);
}

/** Upload admin image with backward compatibility for older deployments. */
export async function uploadAdminImage(
  file: File,
  folder: StoredUploadFolder,
  legacyCategory?: string,
  options?: { maxSizeMb?: number }
): Promise<UploadImageResult> {
  const maxSizeMb = options?.maxSizeMb;

  try {
    if (file.size > VERCEL_SAFE_UPLOAD_SIZE) {
      return await uploadViaPresignedR2(file, folder, maxSizeMb ?? MAX_BOOK_SAMPLE_PAGE_MB);
    }
    return await uploadViaFormPost(file, folder, legacyCategory, maxSizeMb);
  } catch (err) {
    throw new Error(describeUploadError(err));
  }
}
