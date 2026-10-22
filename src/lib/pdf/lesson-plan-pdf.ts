import { AcademyReport } from "@/lib/pdf/academy-report";

export type LessonPlanPdfInput = {
  title: string;
  schoolName?: string;
  subject?: string;
  grade?: string;
  date?: string;
  status?: string;
  planMode?: string;
  sections: Array<{ label: string; body: string }>;
};

export async function generateLessonPlanPdf(input: LessonPlanPdfInput): Promise<Uint8Array> {
  const subtitle = [input.subject, input.grade, input.date].filter(Boolean).join(" · ");
  const report = await AcademyReport.create(input.title, subtitle || undefined, {
    bannerSchoolName: input.schoolName,
  });

  report.drawMetaBlock([
    { label: "Status", value: input.status ?? "draft" },
    { label: "Plan type", value: input.planMode === "detailed" ? "Detailed" : "Quick" },
  ]);

  for (const section of input.sections) {
    if (!section.body?.trim()) continue;
    report.drawSectionTitle(section.label);
    report.drawParagraph(section.body.trim());
  }

  return report.finalize();
}
