import { R2_UPLOAD_CHUNK_SIZE } from "@/lib/constants";
import { describeUploadError } from "@/lib/uploads/upload-errors";
import type { R2MultipartScope } from "@/lib/uploads/r2-multipart-auth";

type InitResponse = {
  error?: string;
  uploadId?: string;
  key?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileType?: string;
  path?: string;
  filename?: string;
  contentType?: string;
  originalName?: string;
};

async function parseJson<T extends Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(res.statusText || "Upload failed");
  }
  return JSON.parse(text) as T;
}

export async function uploadFileViaR2Multipart(params: {
  scope: R2MultipartScope;
  file: File;
  bookId?: string;
}): Promise<InitResponse & { r2Key: string }> {
  try {
    const initRes = await fetch("/api/upload/r2-multipart/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: params.scope,
        fileName: params.file.name,
        fileSize: params.file.size,
        mimeType: params.file.type || "application/octet-stream",
        bookId: params.bookId,
      }),
    });
    const initJson = await parseJson<InitResponse>(initRes);
    if (!initRes.ok || initJson.error || !initJson.uploadId || !initJson.key) {
      throw new Error(initJson.error || "Upload failed to start");
    }

    const parts: Array<{ partNumber: number; etag: string }> = [];
    let partNumber = 1;

    for (let offset = 0; offset < params.file.size; offset += R2_UPLOAD_CHUNK_SIZE) {
      const chunk = params.file.slice(
        offset,
        Math.min(offset + R2_UPLOAD_CHUNK_SIZE, params.file.size)
      );
      const formData = new FormData();
      formData.append("scope", params.scope);
      formData.append("uploadId", initJson.uploadId);
      formData.append("key", initJson.key);
      formData.append("partNumber", String(partNumber));
      formData.append("chunk", chunk);

      const partRes = await fetch("/api/upload/r2-multipart/part", {
        method: "POST",
        body: formData,
      });
      const partJson = await parseJson<{ error?: string; etag?: string }>(partRes);
      if (!partRes.ok || partJson.error || !partJson.etag) {
        throw new Error(partJson.error || `Upload failed on part ${partNumber}`);
      }

      parts.push({ partNumber, etag: partJson.etag });
      partNumber += 1;
    }

    const completeRes = await fetch("/api/upload/r2-multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: params.scope,
        uploadId: initJson.uploadId,
        key: initJson.key,
        parts,
      }),
    });
    const completeJson = await parseJson<{ error?: string; key?: string }>(completeRes);
    if (!completeRes.ok || completeJson.error) {
      throw new Error(completeJson.error || "Upload failed to finish");
    }

    return { ...initJson, r2Key: initJson.key };
  } catch (error) {
    throw new Error(describeUploadError(error));
  }
}
