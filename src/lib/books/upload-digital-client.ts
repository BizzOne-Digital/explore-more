import { VERCEL_SAFE_UPLOAD_SIZE } from "@/lib/constants";

type UploadDigitalResult = {
  success: boolean;
  error?: string;
  digitalFile?: unknown;
};

type ApiEnvelope<T> = {
  success?: boolean;
  error?: string;
  data?: T;
  digitalFile?: unknown;
};

export async function uploadBookDigitalFileClient(
  bookId: string,
  file: File
): Promise<UploadDigitalResult> {
  if (file.size > VERCEL_SAFE_UPLOAD_SIZE) {
    const presignRes = await fetch("/api/admin/books/upload-digital/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      }),
    });
    const presignJson = (await presignRes.json()) as ApiEnvelope<{
      direct?: boolean;
      uploadUrl?: string;
      r2Key?: string;
      contentType?: string;
      fileName?: string;
      fileSizeBytes?: number;
      fileType?: string;
    }>;

    if (!presignRes.ok || !presignJson.success) {
      return { success: false, error: presignJson.error || "Upload failed" };
    }

    const presign = presignJson.data;
    if (!presign?.direct) {
      const putRes = await fetch(presign!.uploadUrl!, {
        method: "PUT",
        headers: { "Content-Type": presign!.contentType! },
        body: file,
      });
      if (!putRes.ok) {
        return {
          success: false,
          error: "Cloud upload failed. Check R2 CORS for this site and try again.",
        };
      }

      const confirmRes = await fetch("/api/admin/books/upload-digital/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          r2Key: presign!.r2Key,
          fileName: presign!.fileName ?? file.name,
          fileSizeBytes: presign!.fileSizeBytes ?? file.size,
          fileType: presign!.fileType ?? "pdf",
        }),
      });
      const confirmJson = (await confirmRes.json()) as ApiEnvelope<{ digitalFile?: unknown }>;
      if (!confirmRes.ok || !confirmJson.success) {
        return { success: false, error: confirmJson.error || "Upload failed" };
      }

      return { success: true, digitalFile: confirmJson.data?.digitalFile };
    }
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("bookId", bookId);

  const response = await fetch("/api/admin/books/upload-digital", {
    method: "POST",
    body: formData,
  });
  const json = (await response.json()) as ApiEnvelope<unknown> & { digitalFile?: unknown };

  if (!response.ok || !json.success) {
    return { success: false, error: json.error || "Upload failed" };
  }

  return { success: true, digitalFile: json.digitalFile };
}
