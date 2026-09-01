import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { COMPANY } from "@/lib/constants";

export const BRAND = {
  teal: rgb(12 / 255, 137 / 255, 145 / 255),
  forest: rgb(22 / 255, 74 / 255, 56 / 255),
  charcoal: rgb(16 / 255, 19 / 255, 21 / 255),
  muted: rgb(0.42, 0.42, 0.42),
  headerBg: rgb(244 / 255, 238 / 255, 220 / 255),
  rowAlt: rgb(250 / 255, 248 / 255, 241 / 255),
  border: rgb(0.82, 0.82, 0.82),
  white: rgb(1, 1, 1),
} as const;

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const FOOTER_Y = 34;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export type ReportMetaRow = { label: string; value: string };

export type TableColumn = {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
};

export class AcademyReport {
  private doc: PDFDocument;
  private page!: PDFPage;
  private font!: PDFFont;
  private fontBold!: PDFFont;
  private y = PAGE_HEIGHT - MARGIN;
  private pageNumber = 0;
  private readonly reportTitle: string;
  private readonly reportSubtitle?: string;

  private constructor(doc: PDFDocument, reportTitle: string, reportSubtitle?: string) {
    this.doc = doc;
    this.reportTitle = reportTitle;
    this.reportSubtitle = reportSubtitle;
  }

  static async create(reportTitle: string, reportSubtitle?: string) {
    const doc = await PDFDocument.create();
    const report = new AcademyReport(doc, reportTitle, reportSubtitle);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    report.font = font;
    report.fontBold = fontBold;
    report.addPage();
    return report;
  }

  private addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageNumber += 1;
    this.y = PAGE_HEIGHT - MARGIN;

    this.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 84,
      width: PAGE_WIDTH,
      height: 84,
      color: BRAND.teal,
    });

    this.page.drawText(COMPANY.name, {
      x: MARGIN,
      y: PAGE_HEIGHT - 30,
      size: 16,
      font: this.fontBold,
      color: BRAND.white,
    });

    this.page.drawText(this.reportTitle, {
      x: MARGIN,
      y: PAGE_HEIGHT - 50,
      size: 10,
      font: this.font,
      color: BRAND.white,
    });

    if (this.reportSubtitle) {
      this.page.drawText(this.reportSubtitle, {
        x: MARGIN,
        y: PAGE_HEIGHT - 66,
        size: 8,
        font: this.font,
        color: rgb(0.9, 0.95, 0.95),
      });
    }

    this.y = PAGE_HEIGHT - 104;
  }

  private ensureSpace(needed: number) {
    if (this.y - needed < FOOTER_Y + 20) {
      this.drawFooter();
      this.addPage();
    }
  }

  private drawFooter() {
    const footer = `${COMPANY.website}  •  ${COMPANY.phone}  •  Page ${this.pageNumber}`;
    this.page.drawLine({
      start: { x: MARGIN, y: FOOTER_Y + 12 },
      end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_Y + 12 },
      thickness: 0.5,
      color: BRAND.border,
    });
    this.page.drawText(footer, {
      x: MARGIN,
      y: FOOTER_Y,
      size: 7,
      font: this.font,
      color: BRAND.muted,
    });
  }

  drawMetaBlock(rows: ReportMetaRow[]) {
    this.ensureSpace(rows.length * 16 + 24);
    const boxHeight = rows.length * 16 + 20;
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: BRAND.headerBg,
      borderColor: BRAND.border,
      borderWidth: 0.5,
    });

    let rowY = this.y - 16;
    for (const row of rows) {
      this.page.drawText(`${row.label}:`, {
        x: MARGIN + 12,
        y: rowY,
        size: 9,
        font: this.fontBold,
        color: BRAND.charcoal,
      });
      this.page.drawText(row.value, {
        x: MARGIN + 120,
        y: rowY,
        size: 9,
        font: this.font,
        color: BRAND.charcoal,
      });
      rowY -= 16;
    }
    this.y -= boxHeight + 18;
  }

  drawSummaryCards(items: Array<{ label: string; value: string }>) {
    const cardWidth = CONTENT_WIDTH / Math.min(items.length, 4);
    const cardHeight = 44;
    this.ensureSpace(cardHeight + 12);

    items.forEach((item, index) => {
      const x = MARGIN + index * cardWidth;
      this.page.drawRectangle({
        x: x + 4,
        y: this.y - cardHeight,
        width: cardWidth - 8,
        height: cardHeight,
        color: BRAND.white,
        borderColor: BRAND.border,
        borderWidth: 0.5,
      });
      this.page.drawText(item.value, {
        x: x + 12,
        y: this.y - 20,
        size: 14,
        font: this.fontBold,
        color: BRAND.teal,
      });
      this.page.drawText(item.label, {
        x: x + 12,
        y: this.y - 34,
        size: 8,
        font: this.font,
        color: BRAND.muted,
      });
    });

    this.y -= cardHeight + 16;
  }

  drawSectionTitle(title: string) {
    this.ensureSpace(28);
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 18,
      width: CONTENT_WIDTH,
      height: 18,
      color: BRAND.forest,
    });
    this.page.drawText(title, {
      x: MARGIN + 8,
      y: this.y - 14,
      size: 10,
      font: this.fontBold,
      color: BRAND.white,
    });
    this.y -= 28;
  }

  drawParagraph(text: string, options?: { size?: number; muted?: boolean }) {
    const size = options?.size ?? 9;
    const color = options?.muted ? BRAND.muted : BRAND.charcoal;
    const lines = wrapText(text, CONTENT_WIDTH, this.font, size);
    this.ensureSpace(lines.length * (size + 4) + 8);
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font: this.font,
        color,
      });
      this.y -= size + 4;
    }
    this.y -= 6;
  }

  drawTable(columns: TableColumn[], rows: string[][]) {
    if (rows.length === 0) {
      this.drawParagraph("No records to display.", { muted: true });
      return;
    }

    const headerHeight = 20;
    const rowHeight = 18;
    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);

    const drawHeader = () => {
      let x = MARGIN;
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - headerHeight,
        width: tableWidth,
        height: headerHeight,
        color: BRAND.headerBg,
        borderColor: BRAND.border,
        borderWidth: 0.5,
      });
      for (const col of columns) {
        this.page.drawText(col.header, {
          x: x + 4,
          y: this.y - 14,
          size: 8,
          font: this.fontBold,
          color: BRAND.charcoal,
        });
        x += col.width;
      }
      this.y -= headerHeight;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      const cellLines = row.map((cell, colIndex) =>
        wrapText(cell || "—", columns[colIndex].width - 8, this.font, 8)
      );
      const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
      const dynamicRowHeight = Math.max(rowHeight, maxLines * 11 + 6);

      this.ensureSpace(dynamicRowHeight + 4);
      if (this.y < FOOTER_Y + dynamicRowHeight + 30) {
        drawHeader();
      }

      let x = MARGIN;
      const fill = rowIndex % 2 === 1 ? BRAND.rowAlt : BRAND.white;
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - dynamicRowHeight,
        width: tableWidth,
        height: dynamicRowHeight,
        color: fill,
        borderColor: BRAND.border,
        borderWidth: 0.25,
      });

      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const lines = cellLines[colIndex];
        let lineY = this.y - 12;
        for (const line of lines) {
          this.page.drawText(line, {
            x: x + 4,
            y: lineY,
            size: 8,
            font: this.font,
            color: BRAND.charcoal,
          });
          lineY -= 11;
        }
        x += columns[colIndex].width;
      }

      this.y -= dynamicRowHeight;
    });

    this.y -= 10;
  }

  async finalize(): Promise<Uint8Array> {
    this.drawFooter();
    return this.doc.save();
  }
}

export function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const sanitized = text.replace(/\s+/g, " ").trim();
  if (!sanitized) return [""];

  const words = sanitized.split(" ");
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

export function formatReportDate(date: Date = new Date()) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatShortDate(date: Date | string | undefined | null) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
