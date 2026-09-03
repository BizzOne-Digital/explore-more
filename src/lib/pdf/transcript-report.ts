import { AcademyReport, formatReportDate } from "@/lib/pdf/academy-report";
import {
  computeTranscriptTotals,
  percentToLetter,
  type TranscriptCourseInput,
} from "@/lib/resources/grades";
import type { TranscriptStudentInfo } from "@/lib/resources/types";

export async function generateTranscriptPdf(
  student: TranscriptStudentInfo,
  courses: TranscriptCourseInput[]
): Promise<Uint8Array> {
  const validCourses = courses.filter((c) => c.courseName.trim());
  const { totalCredits, cumulativeGpa } = computeTranscriptTotals(validCourses);

  const report = await AcademyReport.create(
    "Official Homeschool Transcript",
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

  report.drawSectionTitle("Course Record");

  const tableRows = validCourses.map((course, index) => {
    const percent = parseFloat(course.gradePercent);
    const letter =
      course.letterGrade.trim() ||
      (Number.isNaN(percent) ? "—" : percentToLetter(percent));
    const percentDisplay = Number.isNaN(percent) ? "—" : `${Math.round(percent)}%`;

    return [
      String(index + 1),
      course.courseName,
      percentDisplay,
      letter,
      course.startDate || "—",
      course.endDate || "—",
      course.duration || "—",
      course.credits || "—",
    ];
  });

  report.drawTable(
    [
      { header: "#", width: 22 },
      { header: "Course", width: 130 },
      { header: "Grade %", width: 44 },
      { header: "Letter", width: 38 },
      { header: "Start", width: 58 },
      { header: "End", width: 58 },
      { header: "Duration", width: 58 },
      { header: "Credits", width: 44 },
    ],
    tableRows
  );

  report.drawParagraph(
    "1 credit = full-year course · 0.5 credits = half-year course. GPA is calculated on an unweighted 4.0 scale. Parents and guardians are responsible for verifying state homeschool requirements.",
    { size: 8, muted: true }
  );

  report.drawParagraph(`Generated ${formatReportDate()}`, { size: 7, muted: true });

  return report.finalize();
}
