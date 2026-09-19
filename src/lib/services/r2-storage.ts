import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      !process.env.R2_ACCESS_KEY_ID.includes("your_") &&
      !process.env.R2_ACCOUNT_ID?.includes("your_")
  );
}

export function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "explore-more-books";
const BUCKET_NAME = R2_BUCKET_NAME;

/**
 * Upload a file to R2
 * @param file - File to upload
 * @param key - Storage key (path) e.g., "books/book-123.pdf"
 */
export async function uploadToR2(file: File, key: string): Promise<{ success: boolean; key: string; size: number }> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const r2Client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.length,
    });

    await r2Client.send(command);

    return {
      success: true,
      key,
      size: buffer.length,
    };
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Failed to upload file to R2");
  }
}

/**
 * Generate a signed download URL (expires in 15 minutes)
 * @param key - Storage key of the file
 * @param expiresIn - Expiry time in seconds (default: 900 = 15 minutes)
 */
export async function readFromR2(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const r2Client = getR2Client();
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error("File not found in cloud storage");
  }

  const bytes = await response.Body.transformToByteArray();
  return {
    buffer: Buffer.from(bytes),
    mimeType: response.ContentType ?? "application/octet-stream",
  };
}

export async function createR2PresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<string> {
  const r2Client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function getR2DownloadUrl(key: string, expiresIn: number = 900): Promise<string> {
  try {
    const r2Client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("R2 signed URL error:", error);
    throw new Error("Failed to generate download URL");
  }
}

/**
 * Delete a file from R2
 * @param key - Storage key of the file
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const r2Client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error("R2 delete error:", error);
    return false;
  }
}

/**
 * Generate a unique key for storing books
 * @param bookId - MongoDB book ID
 * @param originalFileName - Original file name
 */
export function generateBookKey(bookId: string, originalFileName: string): string {
  const timestamp = Date.now();
  const ext = originalFileName.split(".").pop();
  return `books/${bookId}-${timestamp}.${ext}`;
}
