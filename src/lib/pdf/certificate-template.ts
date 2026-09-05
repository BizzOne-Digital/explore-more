import fs from "fs/promises";
import path from "path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CertificatePayload } from "@/lib/resources/types";
import {
  getCertificateTemplate,
  type CertificateFieldLayout,
  type CertificateTemplateDefinition,
} from "@/lib/resources/certificate-templates";
import { CERTIFICATE_REF_WIDTH } from "@/lib/resources/certificate-layout";
import {
  CERTIFICATE_FIELD_KEYS,
  defaultFieldStylesFromTemplate,
  type CertificateFieldKey,
  type CertificateFieldStyle,
} from "@/lib/resources/certificate-fields";
import { embedCertificateFont } from "@/lib/pdf/certificate-fonts";

export async function generateCertificatePdf(data: CertificatePayload): Promise<Uint8Array> {
  const template = getCertificateTemplate(data.templateId);
  const filePath = path.join(process.cwd(), "public", template.imagePath);
  const imageBytes = await fs.readFile(filePath);

  const doc = await PDFDocument.create();
  const image =
    template.imageType === "png"
      ? await doc.embedPng(imageBytes)
      : await doc.embedJpg(imageBytes);

  const pageWidth = image.width;
  const pageHeight = image.height;
  const page = doc.addPage([pageWidth, pageHeight]);
  page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  const fieldStyles = data.fieldStyles ?? defaultFieldStylesFromTemplate(template);
  const fontCache = new Map<string, PDFFont>();

  async function getFont(style: CertificateFieldStyle): Promise<PDFFont> {
    const key = `${style.fontFamily}:${style.bold}`;
    if (!fontCache.has(key)) {
      fontCache.set(key, await embedCertificateFont(doc, style.fontFamily, style.bold));
    }
    return fontCache.get(key)!;
  }

  const values: Record<CertificateFieldKey, string> = {
    studentName: data.studentName.trim() || "Student Name",
    homeschoolName: data.homeschoolName.trim(),
    achievement: data.achievement.trim(),
    educatorName: data.educatorName?.trim() || "",
    dateAwarded: data.dateAwarded.trim(),
  };

  for (const key of CERTIFICATE_FIELD_KEYS) {
    const value = values[key];
    if (!value) continue;
    const style = fieldStyles[key];
    const font = await getFont(style);
    drawField(page, font, template.layout[key], style, value, pageWidth, pageHeight);
  }

  return doc.save({ useObjectStreams: false });
}

function drawField(
  page: PDFPage,
  font: PDFFont,
  templateLayout: CertificateFieldLayout,
  style: CertificateFieldStyle,
  value: string,
  pageWidth: number,
  pageHeight: number
) {
  const scale = pageWidth / CERTIFICATE_REF_WIDTH;
  const fontSize = style.fontSize * scale;
  const anchorX = style.pageX * pageWidth;
  const y = pageHeight - style.pageY * pageHeight;
  const textWidth = font.widthOfTextAtSize(value, fontSize);
  const x = style.align === "center" ? anchorX - textWidth / 2 : anchorX;
  const color = style.color ?? templateLayout.color ?? { r: 0.08, g: 0.16, b: 0.28 };

  page.drawText(value, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
  });
}

export { type CertificateTemplateDefinition };
