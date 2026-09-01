const LOCAL_PATH_PATTERN =
  /(?:file:\/\/[^\s<>"']+|[a-zA-Z]:[\\/][^\s<>"']+|\\(?:Users|Desktop|Documents)\\[^\s<>"']+|\/Users\/[^\s<>"']+|\/home\/[^\s<>"']+|(?<!\/uploads)\/(?:Desktop|Documents)\/[^\s<>"']+)/gi;

const WEB_URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

function textWithoutWebUrls(text: string): string {
  return text.replace(WEB_URL_PATTERN, "");
}

export function isLocalFilesystemPath(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/^file:/i.test(trimmed)) return true;
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) return true;
  if (/^\/Users\//i.test(trimmed) || /^\/home\//i.test(trimmed)) return true;
  if (/\\Users\\|\\Desktop\\|\\Documents\\/i.test(trimmed)) return true;
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("/uploads/") &&
    !trimmed.startsWith("/api/") &&
    /\.(pdf|docx?|png|jpe?g|webp)$/i.test(trimmed)
  ) {
    return true;
  }
  return false;
}

export function containsLocalFilesystemPath(text: string): boolean {
  const sanitized = textWithoutWebUrls(text);
  LOCAL_PATH_PATTERN.lastIndex = 0;
  if (LOCAL_PATH_PATTERN.test(sanitized)) return true;
  return isLocalFilesystemPath(text);
}

export function resolveNotificationFileUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (isLocalFilesystemPath(trimmed)) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("notifications/")) return trimmed;
  if (trimmed.startsWith("certificates/")) return trimmed;
  return `/${trimmed}`;
}

function stripLeadingSlash(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

export function normalizeAttachmentPath(url: string): string | null {
  const resolved = resolveNotificationFileUrl(url);
  if (!resolved) return null;

  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    try {
      const parsed = new URL(resolved);
      const pathname = stripLeadingSlash(parsed.pathname);
      if (pathname.startsWith("uploads/")) return `/${pathname}`;
      if (pathname.startsWith("notifications/")) return pathname;
      return null;
    } catch {
      return null;
    }
  }

  const withoutLeading = stripLeadingSlash(resolved);
  if (withoutLeading.startsWith("uploads/")) return `/${withoutLeading}`;
  if (withoutLeading.startsWith("notifications/")) return withoutLeading;
  if (withoutLeading.startsWith("certificates/")) return withoutLeading;

  return null;
}

export function isLikelyAttachmentUrl(url: string): boolean {
  if (isLocalFilesystemPath(url)) return false;

  const lower = stripLeadingSlash(url).toLowerCase();
  if (lower.includes("uploads/")) return true;
  if (lower.startsWith("notifications/")) return true;
  if (lower.startsWith("certificates/")) return true;
  if (url.toLowerCase().startsWith("/api/files/private/certificates/")) return true;
  if (url.toLowerCase().startsWith("/api/parent/notifications/file")) return true;

  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return (
      lower.includes("/uploads/") ||
      lower.includes(".pdf") ||
      lower.endsWith(".doc") ||
      lower.endsWith(".docx") ||
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg")
    );
  }

  return false;
}

/** Parent-authenticated download URL for campaign/public uploads. */
export function parentNotificationFileUrl(url: string): string {
  const withoutLeading = stripLeadingSlash(url.trim());
  if (withoutLeading.startsWith("certificates/")) {
    return `/api/files/private/${withoutLeading}`;
  }

  const uploadPath = normalizeAttachmentPath(url);
  if (uploadPath) {
    if (uploadPath.startsWith("certificates/")) {
      return `/api/files/private/${uploadPath}`;
    }
    return `/api/parent/notifications/file?path=${encodeURIComponent(uploadPath)}`;
  }
  return resolveNotificationFileUrl(url) ?? url;
}

/** Remove pasted local file paths from notification message text. */
export function stripLocalPathsFromMessage(message: string): string {
  const sanitized = textWithoutWebUrls(message);
  LOCAL_PATH_PATTERN.lastIndex = 0;
  return sanitized.replace(LOCAL_PATH_PATTERN, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function isPdfAttachment(path?: string | null, name?: string | null): boolean {
  const value = `${path ?? ""} ${name ?? ""}`.toLowerCase();
  return value.includes(".pdf");
}
