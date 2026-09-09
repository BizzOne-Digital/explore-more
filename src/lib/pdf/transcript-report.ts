import { AcademyReport, formatReportDate } from "@/lib/pdf/academy-report";
import {
  computeTranscriptTotals,
  durationDisplayLabel,
  normalizeTranscriptCourse,
  percentToLetter,
  type DocumentType,
  type TranscriptCourseInput,
} from "@/lib/resources/grades";
import type { TranscriptStudentInfo } from "@/lib/resources/types";

function documentTitle(documentType: DocumentType): string {
  return documentType === "report_card" ? "Homeschool Report Card" : "Official Homeschool Transcript";
}

function downloadLabel(documentType: DocumentType): string {
  return documentType === "report_card" ? "report-card" : "transcript";
}

export function getTranscriptPdfFilename(
  studentName: string,
  documentType: DocumentType = "transcript"
): string {
  const safeName = studentName.replace(/[^\w.-]+/g, "_").slice(0, 40);
  return `${downloadLabel(documentType)}-${safeName || "student"}.pdf`;
}

export async function generateTranscriptPdf(
  student: TranscriptStudentInfo,
  courses: TranscriptCourseInput[],
  documentType: DocumentType = "transcript"
): Promise<Uint8Array> {
  const validCourses = courses.filter((c) => c.courseName.trim()).map(normalizeTranscriptCourse);
  const { totalCredits, cumulativeGpa } = computeTranscriptTotals(validCourses);
  const isReportCard = documentType === "report_card";

  const report = await AcademyReport.create(
    documentTitle(documentType),
    student.schoolYear ? `School Year ${student.schoolYear}` : undefined
  );

  const address = [student.streetAddress, student.cityStateZip].filter(Boolean).join(", ");

  report.drawMetaBlock([
    { label: "Student", value: student.studentName || "—" },
    { label: "Date of Birth", value: student.dateOfBirth || "—" },
    { label: "Grade Level", value: student.gradeLevel || "—" },
    { label: "Homeschool", value: student.homeschoolName || "—" },
    { label: "School Year", value: student.schoolYear || "—" },
    { label: "Curriculum", value: student.curriculumSite || "—" },
    ...(address ? [{ label: "Address", value: address }] : []),
  ]);

  report.drawSummaryCards([
    { label: "Total Credits", value: totalCredits.toFixed(1) },
    { label: "Cumulative GPA (4.0)", value: cumulativeGpa.toFixed(2) },
    { label: "Courses Listed", value: String(validCourses.length) },
  ]);

  report.drawSectionTitle(isReportCard ? "Quarterly Grades" : "Course Record");

  const tableRows = validCourses.map((course, index) => {
    const percent = parseFloat(course.gradePercent);
    const letter =
      course.letterGrade.trim() ||
      (Number.isNaN(percent) ? "—" : percentToLetter(percent));
    const percentDisplay = Number.isNaN(percent) ? "—" : `${Math.round(percent)}%`;

    if (isReportCard) {
      return [
        String(index + 1),
        course.courseName,
        percentDisplay,
        letter,
        course.q1?.trim() || "—",
        course.q2?.trim() || "—",
        course.q3?.trim() || "—",
        course.q4?.trim() || "—",
        course.credits || "—",
      ];
    }

    return [
      String(index + 1),
      course.courseName,
      percentDisplay,
      letter,
      course.startDate || "—",
      course.endDate || "—",
      durationDisplayLabel(course.duration) || "—",
      course.credits || "—",
    ];
  });

  if (isReportCard) {
    report.drawTable(
      [
        { header: "#", width: 22 },
        { header: "Course", width: 110 },
        { header: "Grade %", width: 40 },
        { header: "Letter", width: 36 },
        { header: "1st Qtr", width: 44 },
        { header: "2nd Qtr", width: 44 },
        { header: "3rd Qtr", width: 44 },
        { header: "4th Qtr", width: 44 },
        { header: "Credits", width: 40 },
      ],
      tableRows
    );
  } else {
    report.drawTable(
      [
        { header: "#", width: 22 },
        { header: "Course", width: 130 },
        { header: "Grade %", width: 44 },
        { header: "Letter", width: 38 },
        { header: "Start", width: 58 },
        { header: "End", width: 58 },
        { header: "Duration", width: 72 },
        { header: "Credits", width: 44 },
      ],
      tableRows
    );
  }

  report.drawParagraph(
    isReportCard
      ? "Quarterly grades reflect progress for each marking period. Credits and GPA use the overall course grade when provided."
      : "1 credit = full-year course · 0.5 credits = half-year course. GPA is calculated on an unweighted 4.0 scale. Parents and guardians are responsible for verifying state homeschool requirements.",
    { size: 8, muted: true }
  );

  report.drawParagraph(`Generated ${formatReportDate()}`, { size: 7, muted: true });

  return report.finalize();
}
