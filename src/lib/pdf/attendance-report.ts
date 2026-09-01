import connectDB from "@/lib/db";
import { Attendance, User } from "@/models";
import { formatAttendanceStatus } from "@/lib/attendance/status";
import { AcademyReport, formatReportDate, formatShortDate } from "@/lib/pdf/academy-report";
import { format } from "date-fns";

export type AttendanceReportRecord = {
  date: Date;
  status: string;
  session: string;
  notes?: string;
  parentExcuse?: string;
  isDailyLog: boolean;
};

export async function getAttendanceReportData(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<{ studentName: string; studentIdCode?: string; records: AttendanceReportRecord[] } | null> {
  await connectDB();
  const student = await User.findById(studentId).select("name studentId").lean();
  if (!student) return null;

  const records = await Attendance.find({
    studentId,
    sessionDate: { $gte: startDate, $lte: endDate },
  })
    .populate("courseId", "title")
    .populate("eventId", "title")
    .sort({ sessionDate: -1 })
    .lean();

  return {
    studentName: student.name,
    studentIdCode: student.studentId,
    records: records.map((record) => ({
      date: record.sessionDate,
      status: formatAttendanceStatus(record.status, record.notes),
      session: record.isDailyLog
        ? "Homeschool day"
        : (record.courseId as { title?: string } | null)?.title ||
          (record.eventId as { title?: string } | null)?.title ||
          "General Session",
      notes: record.isDailyLog && record.status === "other" ? undefined : record.notes ?? undefined,
      parentExcuse: record.parentExcuseNote ?? undefined,
      isDailyLog: !!record.isDailyLog,
    })),
  };
}

export async function generateAttendanceReportPdf(
  data: { studentName: string; studentIdCode?: string; records: AttendanceReportRecord[] },
  periodLabel: string
): Promise<Uint8Array> {
  const stats = {
    total: data.records.length,
    present: data.records.filter((r) => r.status === "Present").length,
    absent: data.records.filter((r) => r.status === "Absent").length,
    late: data.records.filter((r) => r.status === "Tardy").length,
    excused: data.records.filter((r) => r.status === "Excused").length,
  };
  const rate =
    stats.total > 0 ? Math.round(((stats.present + stats.excused) / stats.total) * 100) : 0;

  const report = await AcademyReport.create("Attendance Report", `${data.studentName} • ${periodLabel}`);

  report.drawMetaBlock([
    { label: "Student", value: data.studentName },
    ...(data.studentIdCode ? [{ label: "Student ID", value: data.studentIdCode }] : []),
    { label: "Period", value: periodLabel },
    { label: "Attendance Rate", value: `${rate}%` },
    { label: "Generated", value: formatReportDate() },
  ]);

  report.drawSummaryCards([
    { label: "Total Sessions", value: String(stats.total) },
    { label: "Present", value: String(stats.present) },
    { label: "Absent", value: String(stats.absent) },
    { label: "Late", value: String(stats.late) },
  ]);

  report.drawSectionTitle("Attendance Records");
  report.drawTable(
    [
      { header: "Date", width: 110 },
      { header: "Status", width: 80 },
      { header: "Session", width: 130 },
      { header: "Notes", width: 244 },
    ],
    data.records.map((record) => [
      formatShortDate(record.date) + (record.isDailyLog ? "" : ` ${format(new Date(record.date), "h:mm a")}`),
      record.status,
      record.session,
      [record.notes ? `Staff: ${record.notes}` : "", record.parentExcuse ? `Parent: ${record.parentExcuse}` : ""]
        .filter(Boolean)
        .join(" • ") || "—",
    ])
  );

  report.drawParagraph(
    "This attendance report includes daily homeschool logs, course sessions, events, and tutoring attendance recorded in the Explore More Academy system.",
    { muted: true, size: 8 }
  );

  return report.finalize();
}
