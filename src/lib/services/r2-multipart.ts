import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME, getR2Client } from "@/lib/services/r2-storage";

const BUCKET_NAME = R2_BUCKET_NAME;

export async function initR2MultipartUpload(key: string, contentType: string) {
  const r2Client = getR2Client();
  const response = await r2Client.send(
    new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })
  );

  if (!response.UploadId) {
    throw new Error("Failed to start cloud upload");
  }

  return { uploadId: response.UploadId, key };
}

export async function uploadR2MultipartPart(
  key: string,
  uploadId: string,
  partNumber: number,
  body: Buffer
) {
  const r2Client = getR2Client();
  const response = await r2Client.send(
    new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    })
  );

  if (!response.ETag) {
    throw new Error(`Cloud upload failed on part ${partNumber}`);
  }

  return { etag: response.ETag, partNumber };
}

export async function completeR2MultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>
) {
  const r2Client = getR2Client();
  await r2Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          }))
          .sort((a, b) => a.PartNumber - b.PartNumber),
      },
    })
  );
}
