/** Browser file picker / drag-drop — MIME is often empty on Windows. */
export function isSampleImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type === "application/pdf") return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

export function sampleImageRejectMessage(files: File[]): string | null {
  const pdfs = files.filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
  if (pdfs.length > 0) {
    return "PDF files cannot be used as sample pages. Save each page as a JPG or PNG (or take a photo), then upload those images. Use Digital Download (PDF) below for the full ebook.";
  }
  const images = files.filter(isSampleImageFile);
  if (images.length === 0) {
    return "Please select image files (PNG, JPG, WebP, or GIF).";
  }
  return null;
}
