const DIGITAL_FORMAT_PATTERN = /digital|e-?book|pdf|download|kindle/i;

export type BookDigitalFields = {
  digitalFile?: { enabled?: boolean } | null;
  format?: string | null;
};

export function isBookDigital(book: BookDigitalFields): boolean {
  if (book.digitalFile?.enabled === true) return true;
  const format = book.format?.trim() ?? "";
  if (!format) return false;
  return DIGITAL_FORMAT_PATTERN.test(format);
}
