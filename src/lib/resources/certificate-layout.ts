import type { CSSProperties } from "react";
import type { CertificateFieldLayout } from "@/lib/resources/certificate-templates";

/** Design reference size — layouts are calibrated to this width/height. */
export const CERTIFICATE_REF_WIDTH = 1024;
export const CERTIFICATE_REF_HEIGHT = 790;

/** Convert PDF layout (y from bottom) to CSS top percentage for preview overlay. */
export function layoutToPreviewStyle(
  layout: CertificateFieldLayout,
  options?: { maxWidthPercent?: number }
): CSSProperties {
  const top = `${(1 - layout.y) * 100}%`;
  const maxWidth = options?.maxWidthPercent ?? (layout.align === "center" ? 72 : 50);

  if (layout.align === "center") {
    return {
      left: `${layout.x * 100}%`,
      top,
      transform: "translate(-50%, -72%)",
      maxWidth: `${maxWidth}%`,
      textAlign: "center",
    };
  }

  return {
    left: `${layout.x * 100}%`,
    top,
    transform: "translateY(-72%)",
    maxWidth: `${maxWidth}%`,
    textAlign: "left",
  };
}

export function layoutFontSize(
  layout: CertificateFieldLayout,
  pageWidth: number,
  text: string,
  fontWidthAtSize: (text: string, size: number) => number
): number {
  const scale = pageWidth / CERTIFICATE_REF_WIDTH;
  const minSize = (layout.minSize ?? 10) * scale;
  const maxSize = (layout.maxSize ?? 12) * scale;
  const maxWidth =
    (layout.align === "center" ? pageWidth * 0.72 : pageWidth * 0.5);

  if (layout.align === "center") {
    for (let size = maxSize; size >= minSize; size -= scale) {
      if (fontWidthAtSize(text, size) <= maxWidth) return size;
    }
    return minSize;
  }

  return maxSize;
}
