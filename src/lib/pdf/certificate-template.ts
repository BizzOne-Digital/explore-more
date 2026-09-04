import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CertificatePayload } from "@/lib/resources/types";
import {
  getCertificateTemplate,
  type CertificateFieldLayout,
  type CertificateTemplateDefinition,
} from "@/lib/resources/certificate-templates";
import { layoutFontSize } from "@/lib/resources/certificate-layout";

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

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  drawField(page, fontBold, template.layout.studentName, data.studentName.trim() || "Student Name", pageWidth, pageHeight);

  drawField(page, font, template.layout.homeschoolName, data.homeschoolName.trim(), pageWidth, pageHeight);

  drawField(page, font, template.layout.achievement, data.achievement.trim(), pageWidth, pageHeight);

  drawField(page, font, template.layout.educatorName, data.educatorName?.trim() || "", pageWidth, pageHeight);

  drawField(page, font, template.layout.dateAwarded, data.dateAwarded.trim(), pageWidth, pageHeight);

  return doc.save();
}

function drawField(
  page: PDFPage,
  font: PDFFont,
  layout: CertificateFieldLayout,
  value: string,
  pageWidth: number,
  pageHeight: number
) {
  if (!value) return;

  const size = layoutFontSize(layout, pageWidth, value, (text, fontSize) =>
    font.widthOfTextAtSize(text, fontSize)
  );
  const color = layout.color ? rgb(layout.color.r, layout.color.g, layout.color.b) : rgb(0.08, 0.16, 0.28);
  const x = layout.x * pageWidth;
  const y = layout.y * pageHeight;
  const textWidth = font.widthOfTextAtSize(value, size);
  const drawX = layout.align === "center" ? x - textWidth / 2 : x;

  page.drawText(value, {
    x: drawX,
    y,
    size,
    font,
    color,
  });
}

export { type CertificateTemplateDefinition };
