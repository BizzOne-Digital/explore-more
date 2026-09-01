import DOMPurify from "isomorphic-dompurify";
import {
  containsLocalFilesystemPath,
  isLikelyAttachmentUrl,
  isPdfAttachment,
  normalizeAttachmentPath,
  parentNotificationFileUrl,
  resolveNotificationFileUrl,
  stripLocalPathsFromMessage,
} from "@/lib/notifications/paths";

export {
  containsLocalFilesystemPath,
  isLikelyAttachmentUrl,
  isPdfAttachment,
  normalizeAttachmentPath,
  parentNotificationFileUrl,
  resolveNotificationFileUrl,
  stripLocalPathsFromMessage,
  isLocalFilesystemPath,
} from "@/lib/notifications/paths";

export interface NotificationAttachment {
  url: string;
  name: string;
  isPdf: boolean;
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
  const hadLocalPath = containsLocalFilesystemPath(message);
  const cleaned = stripLocalPathsFromMessage(message);

  if (!hadLocalPath) return message;
  if (attachmentPath?.trim()) return cleaned || stripLocalPathsFromMessage(message);

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
