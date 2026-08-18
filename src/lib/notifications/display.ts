import DOMPurify from "isomorphic-dompurify";

export interface NotificationAttachment {
  url: string;
  name: string;
  isPdf: boolean;
}

export function resolveNotificationFileUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

function normalizeAttachmentPath(url: string): string | null {
  const resolved = resolveNotificationFileUrl(url);
  if (!resolved) return null;

  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    try {
      const parsed = new URL(resolved);
      return parsed.pathname.startsWith("/uploads/") ? parsed.pathname : null;
    } catch {
      return null;
    }
  }

  return resolved.startsWith("/uploads/") ? resolved : null;
}

export function isLikelyAttachmentUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("/uploads/") ||
    lower.endsWith(".pdf") ||
    lower.includes(".pdf?") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg")
  );
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
      /(https?:\/\/[^\s<>"']+|\/uploads\/[^\s<>"']+)(?=[\s<>"']|$)/gi;
    let urlMatch = bareUrlRegex.exec(message);
    while (urlMatch) {
      add(urlMatch[1]);
      urlMatch = bareUrlRegex.exec(message);
    }
  }

  return attachments;
}
