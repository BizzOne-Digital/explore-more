"use client";

import type { StoredUploadFolder } from "@/lib/constants";

interface UploadImageResult {
  url: string;
}

/** Upload admin image with backward compatibility for older deployments. */
export async function uploadAdminImage(
  file: File,
  folder: StoredUploadFolder,
  legacyCategory?: string
): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  if (legacyCategory) {
    formData.append("category", legacyCategory);
  }

  const endpoints = ["/api/upload", "/api/upload/public"];

  let lastError = "Upload failed";

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, { method: "POST", body: formData });
    const json = await res.json().catch(() => ({}));

    const url = typeof json.url === "string" ? json.url : json.data?.url;
    const success = json.success === true || (!!url && res.ok);

    if (success && url) {
      return { url };
    }

    lastError = json.error ?? lastError;

    if (res.status === 404) continue;
    if (!res.ok) break;
  }

  throw new Error(lastError);
}
