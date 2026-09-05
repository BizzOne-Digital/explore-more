import type { CSSProperties } from "react";
import type { CertificateFieldLayout } from "@/lib/resources/certificate-templates";

/** Design reference size — layouts are calibrated to this width/height. */
export const CERTIFICATE_REF_WIDTH = 1024;
export const CERTIFICATE_REF_HEIGHT = 790;

/**
 * Printable area on certificate artwork (sidebar templates leave ~21% on the left).
 * Field x/y are fractions inside this region; y is the baseline of the writing line.
 */
export const CERTIFICATE_CONTENT_REGION = {
  left: 0.215,
  top: 0.11,
  width: 0.785,
  height: 0.84,
} as const;

export type ResolvedCertificateFieldPosition = {
  x: number;
  y: number;
  fontSize: number;
};

function mapRegionYToPdfBaseline(regionY: number, _fontSize: number, pageHeight: number): number {
  const lineFromTop =
    CERTIFICATE_CONTENT_REGION.top * pageHeight +
    regionY * CERTIFICATE_CONTENT_REGION.height * pageHeight;
  return pageHeight - lineFromTop;
}

function mapRegionXToPdfX(regionX: number, pageWidth: number): number {
  return (
    CERTIFICATE_CONTENT_REGION.left * pageWidth +
    regionX * CERTIFICATE_CONTENT_REGION.width * pageWidth
  );
}

export function resolveFieldPosition(
  layout: CertificateFieldLayout,
  pageWidth: number,
  pageHeight: number,
  text: string,
  fontWidthAtSize: (text: string, size: number) => number
): ResolvedCertificateFieldPosition {
  const fontSize = layoutFontSize(layout, pageWidth, text, fontWidthAtSize);
  const anchorX = mapRegionXToPdfX(layout.x, pageWidth);
  const y = mapRegionYToPdfBaseline(layout.y, fontSize, pageHeight);
  const textWidth = fontWidthAtSize(text, fontSize);
  const x = layout.align === "center" ? anchorX - textWidth / 2 : anchorX;

  return { x, y, fontSize };
}

/** Convert content-region layout to CSS overlay styles (preview). */
export function layoutToPreviewStyle(
  layout: CertificateFieldLayout,
  options?: { maxWidthPercent?: number }
): CSSProperties {
  const left =
    (CERTIFICATE_CONTENT_REGION.left + layout.x * CERTIFICATE_CONTENT_REGION.width) * 100;
  const top =
    (CERTIFICATE_CONTENT_REGION.top + layout.y * CERTIFICATE_CONTENT_REGION.height) * 100;
  const maxWidth =
    options?.maxWidthPercent ??
    (layout.align === "center"
      ? CERTIFICATE_CONTENT_REGION.width * 72
      : CERTIFICATE_CONTENT_REGION.width * 52);
  const fontSize = `${((layout.maxSize ?? 12) / CERTIFICATE_REF_WIDTH) * 100}cqw`;

  if (layout.align === "center") {
    return {
      left: `${left}%`,
      top: `${top}%`,
      transform: "translate(-50%, -0.88em)",
      maxWidth: `${maxWidth}%`,
      textAlign: "center",
      fontSize,
      lineHeight: 1,
    };
  }

  return {
    left: `${left}%`,
    top: `${top}%`,
    transform: "translateY(-0.88em)",
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
  const maxWidth =
    layout.align === "center"
      ? pageWidth * CERTIFICATE_CONTENT_REGION.width * 0.72
      : pageWidth * CERTIFICATE_CONTENT_REGION.width * 0.52;

  if (layout.align === "center") {
    for (let size = maxSize; size >= minSize; size -= scale) {
      if (fontWidthAtSize(text, size) <= maxWidth) return size;
    }
    return minSize;
  }

  return maxSize;
}
