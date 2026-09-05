import { StandardFonts, type PDFFont, type PDFDocument } from "pdf-lib";
import type { CertificateFontFamily } from "@/lib/resources/certificate-fields";

export async function embedCertificateFont(
  doc: PDFDocument,
  family: CertificateFontFamily,
  bold: boolean
): Promise<PDFFont> {
  if (family === "helvetica") {
    return bold ? doc.embedFont(StandardFonts.HelveticaBold) : doc.embedFont(StandardFonts.Helvetica);
  }
  if (family === "courier") {
    return bold ? doc.embedFont(StandardFonts.CourierBold) : doc.embedFont(StandardFonts.Courier);
  }
  return bold ? doc.embedFont(StandardFonts.TimesRomanBold) : doc.embedFont(StandardFonts.TimesRoman);
}
