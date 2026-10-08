/** Browser file picker / drag-drop — MIME is often empty on Windows. */
function isHeic(file: File): boolean {
  return file.type === "image/heic" || file.type === "image/heif" || /\.heic$/i.test(file.name);
}

export function isSampleImageFile(file: File): boolean {
  if (isHeic(file)) return false;
  if (file.type.startsWith("image/")) return true;
  if (file.type === "application/pdf") return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

export function sampleImageRejectMessage(files: File[]): string | null {
  const pdfs = files.filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
  if (pdfs.length > 0) {
    return "PDF files cannot be used as sample pages. Save each page as a JPG or PNG (or take a photo), then upload those images. Use Digital Download (PDF) below for the full ebook.";
  }
  const heic = files.filter(isHeic);
  if (heic.length > 0) {
    return "iPhone HEIC photos are not supported here. On your phone: Settings → Camera → Formats → Most Compatible, then take new photos — or export/save as JPG on your computer.";
  }
  const images = files.filter(isSampleImageFile);
  if (images.length === 0) {
    return "Please select image files (PNG, JPG, WebP, or GIF).";
  }
  return null;
}
