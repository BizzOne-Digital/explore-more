import type { BookDigitalFields } from "@/lib/books/is-digital";

type DigitalFileRecord = {
  enabled?: boolean;
  storage?: "r2" | "local" | "mongo";
  r2Key?: string;
  localPath?: string;
  fileName?: string;
  fileType?: string;
};

export type BookWithDigitalFile = BookDigitalFields & {
  digitalFile?: DigitalFileRecord | null;
  title?: string;
};

export function hasDownloadableDigitalFile(book: BookWithDigitalFile): boolean {
  const df = book.digitalFile;
  if (!df) return false;
  if (df.r2Key) return true;
  if (df.localPath && (df.storage === "local" || df.storage === "mongo")) return true;
  return false;
}

export function getDigitalFileName(book: BookWithDigitalFile): string {
  return book.digitalFile?.fileName || `${book.title || "book"}.pdf`;
}

export function getDigitalFileType(book: BookWithDigitalFile): string {
  return book.digitalFile?.fileType || "pdf";
}
