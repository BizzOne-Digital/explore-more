import { uploadPrivateFile } from "@/lib/services/upload";
import { MAX_PORTFOLIO_UPLOAD_SIZE } from "@/lib/constants";

export type MessageAttachmentRecord = {
  path: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export async function collectMessageAttachmentsFromFormData(
  formData: FormData
): Promise<MessageAttachmentRecord[]> {
  const attachments: MessageAttachmentRecord[] = [];
  for (const file of formData.getAll("files")) {
    if (file instanceof File && file.size > 0) {
      attachments.push(await uploadPrivateFile(file, "messages", MAX_PORTFOLIO_UPLOAD_SIZE));
    }
  }
  return attachments;
}
