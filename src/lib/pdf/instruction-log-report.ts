import connectDB from "@/lib/db";
import { HomeschoolPortfolio, PortfolioAttendance, StudentProfile, User } from "@/models";
import { ATTENDANCE_TYPE_LABELS, type AttendanceType } from "@/lib/portfolio/constants";
import { AcademyReport, formatReportDate, formatShortDate } from "@/lib/pdf/academy-report";

export type InstructionLogRecord = {
  date: Date;
  type: string;
  notes?: string;
};

export async function getInstructionLogReportData(portfolioId: string) {
  await connectDB();
  const portfolio = await HomeschoolPortfolio.findById(portfolioId);
  if (!portfolio) return null;

  const [student, profile, records] = await Promise.all([
    User.findById(portfolio.studentId).select("name studentId").lean(),
    StudentProfile.findOne({ userId: portfolio.studentId }).select("grade ageRange").lean(),
    PortfolioAttendance.find({ portfolioId }).sort({ date: -1 }).lean(),
  ]);

  const instructionDays = records.filter((r) =>
    ["present", "instruction", "field_trip", "educational_activity"].includes(r.type)
  ).length;

  return {
    studentName: student?.name ?? "Student",
    studentIdCode: student?.studentId,
    grade: profile?.grade || profile?.ageRange,
    schoolYear: portfolio.schoolYear,
    instructionDays,
    records: records.map((record) => ({
      date: record.date,
      type: ATTENDANCE_TYPE_LABELS[record.type as AttendanceType] ?? record.type,
      notes: record.notes,
    })),
  };
}

export async function generateInstructionLogReportPdf(data: {
  studentName: string;
  studentIdCode?: string;
  grade?: string;
  schoolYear: string;
  instructionDays: number;
  records: InstructionLogRecord[];
}): Promise<Uint8Array> {
  const report = await AcademyReport.create(
    "Instruction & Attendance Log",
    `${data.studentName} • ${data.schoolYear}`
  );

  report.drawMetaBlock([
    { label: "Student", value: data.studentName },
    ...(data.studentIdCode ? [{ label: "Student ID", value: data.studentIdCode }] : []),
    ...(data.grade ? [{ label: "Grade", value: data.grade }] : []),
    { label: "School Year", value: data.schoolYear },
    { label: "Instruction Days", value: String(data.instructionDays) },
    { label: "Generated", value: formatReportDate() },
  ]);

  report.drawSectionTitle("Days of Instruction");
  report.drawTable(
    [
      { header: "Date", width: 120 },
      { header: "Type", width: 160 },
      { header: "Notes", width: 284 },
    ],
    data.records.map((record) => [
      formatShortDate(record.date),
      record.type,
      record.notes ?? "—",
    ])
  );

  report.drawParagraph(
    "This log documents homeschool instruction days, field trips, educational activities, and breaks as recorded by the parent/guardian in the portfolio.",
    { muted: true, size: 8 }
  );

  return report.finalize();
}
