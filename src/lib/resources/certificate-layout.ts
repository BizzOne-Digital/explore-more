import type { CSSProperties } from "react";
import type {
  CertificateContentRegion,
  CertificateFieldLayout,
} from "@/lib/resources/certificate-templates";

/** Design reference size — layouts are calibrated to this width/height. */
export const CERTIFICATE_REF_WIDTH = 1024;
export const CERTIFICATE_REF_HEIGHT = 790;

/** Default printable area (sidebar templates). */
export const CERTIFICATE_CONTENT_REGION: CertificateContentRegion = {
  left: 0.215,
  top: 0.11,
  width: 0.785,
  height: 0.84,
};

export type ResolvedCertificateFieldPosition = {
  x: number;
  y: number;
  fontSize: number;
};

function mapRegionYToPdfBaseline(
  regionY: number,
  region: CertificateContentRegion,
  pageHeight: number
): number {
  const lineFromTop = region.top * pageHeight + regionY * region.height * pageHeight;
  return pageHeight - lineFromTop;
}

function mapRegionXToPdfX(regionX: number, region: CertificateContentRegion, pageWidth: number): number {
  return region.left * pageWidth + regionX * region.width * pageWidth;
}

export function resolveFieldPosition(
  layout: CertificateFieldLayout,
  pageWidth: number,
  pageHeight: number,
  text: string,
  fontWidthAtSize: (text: string, size: number) => number,
  region: CertificateContentRegion = CERTIFICATE_CONTENT_REGION
): ResolvedCertificateFieldPosition {
  const fontSize = layoutFontSize(layout, pageWidth, text, fontWidthAtSize, region);
  const anchorX = mapRegionXToPdfX(layout.x, region, pageWidth);
  const y = mapRegionYToPdfBaseline(layout.y, region, pageHeight);
  const textWidth = fontWidthAtSize(text, fontSize);
  const x = layout.align === "center" ? anchorX - textWidth / 2 : anchorX;

  return { x, y, fontSize };
}

/** Convert content-region layout to CSS overlay styles (preview). */
export function layoutToPreviewStyle(
  layout: CertificateFieldLayout,
  region: CertificateContentRegion = CERTIFICATE_CONTENT_REGION,
  options?: { maxWidthPercent?: number }
): CSSProperties {
  const left = (region.left + layout.x * region.width) * 100;
  const top = (region.top + layout.y * region.height) * 100;
  const maxWidth =
    options?.maxWidthPercent ??
    (layout.align === "center" ? region.width * 72 : region.width * 52);
  const fontSize = `${((layout.maxSize ?? 12) / CERTIFICATE_REF_WIDTH) * 100}cqw`;

  if (layout.align === "center") {
    return {
      left: `${left}%`,
      top: `${top}%`,
      transform: "translate(-50%, -0.82em)",
      maxWidth: `${maxWidth}%`,
      textAlign: "center",
      fontSize,
      lineHeight: 1,
    };
  }

  return {
    left: `${left}%`,
    top: `${top}%`,
    transform: "translateY(-0.82em)",
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
  fontWidthAtSize: (text: string, size: number) => number,
  region: CertificateContentRegion = CERTIFICATE_CONTENT_REGION
): number {
  const scale = pageWidth / CERTIFICATE_REF_WIDTH;
  const minSize = (layout.minSize ?? 10) * scale;
  const maxSize = (layout.maxSize ?? 12) * scale;
  const maxWidth =
    layout.align === "center"
      ? pageWidth * region.width * 0.72
      : pageWidth * region.width * 0.52;

  if (layout.align === "center") {
    for (let size = maxSize; size >= minSize; size -= scale) {
      if (fontWidthAtSize(text, size) <= maxWidth) return size;
    }
    return minSize;
  }

  return maxSize;
}
