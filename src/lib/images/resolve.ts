import { PLACEHOLDER_IMAGE } from "@/lib/constants";

export function isStoredUploadUrl(url: string): boolean {
  return url.trim().startsWith("/api/uploads/");
}

export function isLegacyUploadUrl(url: string): boolean {
  return url.trim().startsWith("/uploads/");
}

/** Resolve image URLs for display; legacy disk paths fall back to placeholder. */
export function resolveImageUrl(url: string | undefined | null): string {
  if (!url?.trim()) return PLACEHOLDER_IMAGE;

  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (isStoredUploadUrl(trimmed)) return trimmed;
  if (isLegacyUploadUrl(trimmed)) return PLACEHOLDER_IMAGE;
  return trimmed;
}

export { PLACEHOLDER_IMAGE };
