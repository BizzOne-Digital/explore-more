import DOMPurify from "isomorphic-dompurify";

export interface NotificationAttachment {
  url: string;
  name: string;
  isPdf: boolean;
}

const LOCAL_PATH_PATTERN =
  /(?:file:\/\/[^\s<>"']+|[a-zA-Z]:[\\/][^\s<>"']+|\\(?:Users|Desktop|Documents)\\[^\s<>"']+|\/Users\/[^\s<>"']+|\/home\/[^\s<>"']+|(?<!\/uploads)\/(?:Desktop|Documents)\/[^\s<>"']+)/gi;

export function isLocalFilesystemPath(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
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
  LOCAL_PATH_PATTERN.lastIndex = 0;
  if (LOCAL_PATH_PATTERN.test(text)) return true;
  return isLocalFilesystemPath(text);
}

export function resolveNotificationFileUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (isLocalFilesystemPath(trimmed)) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("notifications/")) return trimmed;
  return `/${trimmed}`;
}

function stripLeadingSlash(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

function normalizeAttachmentPath(url: string): string | null {
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

  return null;
}

export function isLikelyAttachmentUrl(url: string): boolean {
  if (isLocalFilesystemPath(url)) return false;

  const lower = stripLeadingSlash(url).toLowerCase();
  if (lower.includes("uploads/")) return true;
  if (lower.startsWith("notifications/")) return true;
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
  const uploadPath = normalizeAttachmentPath(url);
  if (uploadPath) {
    return `/api/parent/notifications/file?path=${encodeURIComponent(uploadPath)}`;
  }
  return resolveNotificationFileUrl(url) ?? url;
}

export function looksLikeHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function sanitizeNotificationHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "rel"],
    ALLOWED_TAGS: [
      "a",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "span",
      "div",
      "img",
      "blockquote",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "src", "alt", "title"],
  });

  const withSecureLinks = clean.replace(/href=["']([^"']+)["']/gi, (match, href: string) => {
    if (!isLikelyAttachmentUrl(href)) return match;
    return `href="${parentNotificationFileUrl(href)}"`;
  });

  return withSecureLinks.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

/** Replace pasted local file paths with a parent-friendly note. */
export function formatNotificationPlainText(
  message: string,
  attachmentPath?: string | null
): string {
  LOCAL_PATH_PATTERN.lastIndex = 0;
  const cleaned = message.replace(LOCAL_PATH_PATTERN, "").trim();
  const hadLocalPath = containsLocalFilesystemPath(message);

  if (!hadLocalPath) return message;
  if (attachmentPath?.trim()) return cleaned || message.replace(LOCAL_PATH_PATTERN, "").trim();

  const notice =
    "The attached document was not uploaded to the portal. Please contact Explore More Academy if you need the file.";

  return cleaned ? `${cleaned}\n\n${notice}` : notice;
}

export function notificationHasMissingUpload(
  attachmentPath?: string | null,
  message?: string | null
): boolean {
  if (attachmentPath?.trim()) return false;
  return Boolean(message && containsLocalFilesystemPath(message));
}

export function isPdfAttachment(path?: string | null, name?: string | null): boolean {
  const value = `${path ?? ""} ${name ?? ""}`.toLowerCase();
  return value.includes(".pdf");
}

function attachmentLabel(url: string, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  try {
    const pathname = url.startsWith("http")
      ? new URL(url).pathname
      : url.split("?")[0] ?? url;
    const segment = pathname.split("/").filter(Boolean).pop();
    if (segment) return decodeURIComponent(segment);
  } catch {
    // ignore
  }
  return "Attachment";
}

export function getNotificationAttachments(
  attachmentPath?: string | null,
  attachmentName?: string | null,
  message?: string | null
): NotificationAttachment[] {
  const attachments: NotificationAttachment[] = [];
  const seen = new Set<string>();

  const add = (rawUrl: string, name?: string) => {
    if (!isLikelyAttachmentUrl(rawUrl)) return;
    const resolved = resolveNotificationFileUrl(rawUrl);
    if (!resolved) return;
    const key = normalizeAttachmentPath(resolved) ?? resolved;
    if (seen.has(key)) return;
    seen.add(key);

    const label = attachmentLabel(resolved, name);
    attachments.push({
      url: parentNotificationFileUrl(resolved),
      name: label,
      isPdf: isPdfAttachment(resolved, label),
    });
  };

  if (attachmentPath?.trim()) {
    add(attachmentPath, attachmentName ?? undefined);
  }

  if (message?.trim()) {
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    let match = hrefRegex.exec(message);
    while (match) {
      add(match[1]);
      match = hrefRegex.exec(message);
    }

    const bareUrlRegex =
      /(https?:\/\/[^\s<>"']+|\/uploads\/[^\s<>"']+|notifications\/[^\s<>"']+)(?=[\s<>"']|$)/gi;
    let urlMatch = bareUrlRegex.exec(message);
    while (urlMatch) {
      add(urlMatch[1]);
      urlMatch = bareUrlRegex.exec(message);
    }
  }

  return attachments;
}
