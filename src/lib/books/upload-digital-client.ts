import { VERCEL_SAFE_UPLOAD_SIZE } from "@/lib/constants";
import { describeUploadError } from "@/lib/uploads/upload-errors";
import { uploadLargeFileViaPresignedPut } from "@/lib/uploads/upload-via-r2-presigned-put";

type UploadDigitalResult = {
  success: boolean;
  error?: string;
  digitalFile?: unknown;
};

type ApiEnvelope = {
  success?: boolean;
  error?: string;
  data?: { digitalFile?: unknown };
  digitalFile?: unknown;
};

export async function uploadBookDigitalFileClient(
  bookId: string,
  file: File
): Promise<UploadDigitalResult> {
  try {
    if (file.size > VERCEL_SAFE_UPLOAD_SIZE) {
      const uploaded = await uploadLargeFileViaPresignedPut({
        scope: "book-digital",
        file,
        bookId,
      });

      const confirmRes = await fetch("/api/admin/books/upload-digital/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          r2Key: uploaded.r2Key,
          fileName: uploaded.fileName ?? file.name,
          fileSizeBytes: uploaded.fileSizeBytes ?? file.size,
          fileType: uploaded.fileType ?? "pdf",
        }),
      });
      const confirmJson = (await confirmRes.json()) as ApiEnvelope;
      if (!confirmRes.ok || !confirmJson.success) {
        return { success: false, error: confirmJson.error || "Upload failed" };
      }

      return { success: true, digitalFile: confirmJson.data?.digitalFile };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bookId", bookId);

    const response = await fetch("/api/admin/books/upload-digital", {
      method: "POST",
      body: formData,
    });
    const json = (await response.json()) as ApiEnvelope & { digitalFile?: unknown };

    if (!response.ok || !json.success) {
      return { success: false, error: json.error || "Upload failed" };
    }

    return { success: true, digitalFile: json.digitalFile };
  } catch (error) {
    return { success: false, error: describeUploadError(error) };
  }
}
