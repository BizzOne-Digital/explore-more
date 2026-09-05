import type { CSSProperties } from "react";
import type { CertificateFieldLayout } from "@/lib/resources/certificate-templates";

/** Design reference size — font sizes are calibrated to this width. */
export const CERTIFICATE_REF_WIDTH = 1024;
export const CERTIFICATE_REF_HEIGHT = 790;

export type ResolvedCertificateFieldPosition = {
  x: number;
  y: number;
  fontSize: number;
};

/** PDF baseline from page-relative Y (fraction from top of page to the writing line). */
function mapPageYToPdfBaseline(pageY: number, pageHeight: number): number {
  return pageHeight - pageY * pageHeight;
}

export function resolveFieldPosition(
  layout: CertificateFieldLayout,
  pageWidth: number,
  pageHeight: number,
  text: string,
  fontWidthAtSize: (text: string, size: number) => number
): ResolvedCertificateFieldPosition {
  const fontSize = layoutFontSize(layout, pageWidth, text, fontWidthAtSize);
  const anchorX = layout.pageX * pageWidth;
  const y = mapPageYToPdfBaseline(layout.pageY, pageHeight);
  const textWidth = fontWidthAtSize(text, fontSize);
  const x = layout.align === "center" ? anchorX - textWidth / 2 : anchorX;

  return { x, y, fontSize };
}

/** Convert page-relative layout to CSS overlay styles (preview). */
export function layoutToPreviewStyle(
  layout: CertificateFieldLayout,
  options?: { maxWidthPercent?: number }
): CSSProperties {
  const left = layout.pageX * 100;
  const top = layout.pageY * 100;
  const maxWidth =
    options?.maxWidthPercent ?? (layout.align === "center" ? 72 : 48);
  const fontSize = `${((layout.maxSize ?? 12) / CERTIFICATE_REF_WIDTH) * 100}cqw`;

  if (layout.align === "center") {
    return {
      left: `${left}%`,
      top: `${top}%`,
      transform: "translate(-50%, -0.78em)",
      maxWidth: `${maxWidth}%`,
      textAlign: "center",
      fontSize,
      lineHeight: 1,
    };
  }

  return {
    left: `${left}%`,
    top: `${top}%`,
    transform: "translateY(-0.78em)",
    maxWidth: `${maxWidth}%`,
    textAlign: "left",
    fontSize,
    lineHeight: 1,
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
  const maxWidth = layout.align === "center" ? pageWidth * 0.55 : pageWidth * 0.42;

  if (layout.align === "center") {
    for (let size = maxSize; size >= minSize; size -= scale) {
      if (fontWidthAtSize(text, size) <= maxWidth) return size;
    }
    return minSize;
  }

  return maxSize;
}
