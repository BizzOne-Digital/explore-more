import DOMPurify from "isomorphic-dompurify";

export function resolveNotificationFileUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
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

  return clean.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

export function isPdfAttachment(path?: string | null, name?: string | null): boolean {
  const value = `${path ?? ""} ${name ?? ""}`.toLowerCase();
  return value.includes(".pdf");
}
