import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { COMPANY } from "@/lib/constants";
import { BRAND } from "@/lib/pdf/academy-report";
import type { CertificatePayload } from "@/lib/resources/types";

const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;
const MARGIN = 48;

export async function generateCertificatePdf(data: CertificatePayload): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const centerX = PAGE_WIDTH / 2;

  // Outer border
  page.drawRectangle({
    x: MARGIN,
    y: MARGIN,
    width: PAGE_WIDTH - MARGIN * 2,
    height: PAGE_HEIGHT - MARGIN * 2,
    borderColor: BRAND.teal,
    borderWidth: 3,
  });

  // Inner border
  page.drawRectangle({
    x: MARGIN + 12,
    y: MARGIN + 12,
    width: PAGE_WIDTH - MARGIN * 2 - 24,
    height: PAGE_HEIGHT - MARGIN * 2 - 24,
    borderColor: BRAND.forest,
    borderWidth: 1,
  });

  // Header band
  page.drawRectangle({
    x: MARGIN + 12,
    y: PAGE_HEIGHT - MARGIN - 72,
    width: PAGE_WIDTH - MARGIN * 2 - 24,
    height: 60,
    color: BRAND.teal,
  });

  const title = "CERTIFICATE OF COMPLETION";
  const titleWidth = fontBold.widthOfTextAtSize(title, 22);
  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y: PAGE_HEIGHT - MARGIN - 48,
    size: 22,
    font: fontBold,
    color: BRAND.white,
  });

  const subtitle = COMPANY.name;
  const subtitleWidth = font.widthOfTextAtSize(subtitle, 10);
  page.drawText(subtitle, {
    x: centerX - subtitleWidth / 2,
    y: PAGE_HEIGHT - MARGIN - 64,
    size: 10,
    font: font,
    color: rgb(0.9, 0.95, 0.95),
  });

  let y = PAGE_HEIGHT - MARGIN - 120;

  const intro = "This certificate is proudly awarded to";
  const introWidth = font.widthOfTextAtSize(intro, 14);
  page.drawText(intro, {
    x: centerX - introWidth / 2,
    y,
    size: 14,
    font: font,
    color: BRAND.charcoal,
  });

  y -= 50;
  const studentName = data.studentName.trim() || "Student Name";
  const nameSize = Math.min(36, Math.max(24, 360 / Math.max(studentName.length, 8)));
  const nameWidth = fontBold.widthOfTextAtSize(studentName, nameSize);
  page.drawText(studentName, {
    x: centerX - nameWidth / 2,
    y,
    size: nameSize,
    font: fontBold,
    color: BRAND.forest,
  });

  // Underline under name
  page.drawLine({
    start: { x: centerX - 180, y: y - 8 },
    end: { x: centerX + 180, y: y - 8 },
    thickness: 1,
    color: BRAND.teal,
  });

  y -= 50;
  const achievement = data.achievement.trim() || "Course or Grade Level";
  const achievementLine = `for successfully completing ${achievement}`;
  const achievementWidth = font.widthOfTextAtSize(achievementLine, 13);
  page.drawText(achievementLine, {
    x: centerX - achievementWidth / 2,
    y,
    size: 13,
    font: font,
    color: BRAND.charcoal,
  });

  y -= 36;
  const dateLine = `Awarded ${data.dateAwarded.trim() || "—"}`;
  const dateWidth = fontItalic.widthOfTextAtSize(dateLine, 12);
  page.drawText(dateLine, {
    x: centerX - dateWidth / 2,
    y,
    size: 12,
    font: fontItalic,
    color: BRAND.muted,
  });

  // Signature line
  const sigY = MARGIN + 80;
  page.drawLine({
    start: { x: centerX - 120, y: sigY + 20 },
    end: { x: centerX + 120, y: sigY + 20 },
    thickness: 0.75,
    color: BRAND.charcoal,
  });

  const sigLabel = "Parent / Guardian Signature";
  const sigWidth = font.widthOfTextAtSize(sigLabel, 9);
  page.drawText(sigLabel, {
    x: centerX - sigWidth / 2,
    y: sigY,
    size: 9,
    font: font,
    color: BRAND.muted,
  });

  const homeschool = data.homeschoolName.trim() || "Homeschool Name";
  const hsWidth = fontBold.widthOfTextAtSize(homeschool, 11);
  page.drawText(homeschool, {
    x: centerX - hsWidth / 2,
    y: sigY - 28,
    size: 11,
    font: fontBold,
    color: BRAND.charcoal,
  });

  // Disclaimer
  const disclaimer =
    `${COMPANY.name} provides this certificate template to support homeschooling families. ` +
    "The student's parent or guardian submits the information on this certificate. " +
    `${COMPANY.name} does not certify any grade or course completion status.`;
  const disclaimerLines = wrapCentered(disclaimer, PAGE_WIDTH - MARGIN * 2 - 40, font, 7);
  let disclaimerY = MARGIN + 24;
  for (const line of disclaimerLines) {
    const lineWidth = font.widthOfTextAtSize(line, 7);
    page.drawText(line, {
      x: centerX - lineWidth / 2,
      y: disclaimerY,
      size: 7,
      font: font,
      color: BRAND.muted,
    });
    disclaimerY -= 10;
  }

  return doc.save();
}

function wrapCentered(text: string, maxWidth: number, font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>, fontSize: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
