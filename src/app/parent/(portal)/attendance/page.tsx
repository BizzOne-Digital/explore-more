import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { Attendance } from "@/models";
import { getLinkedStudents } from "@/lib/parent/students";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { AttendanceFilters } from "@/components/parent/AttendanceFilters";
import { AttendanceExcuseForm } from "@/components/parent/AttendanceExcuseForm";
import { RecordDailyAttendanceForm } from "@/components/parent/RecordDailyAttendanceForm";
import { DownloadReportButton } from "@/components/parent/DownloadReportButton";
import Link from "next/link";
import { LinkChildForm } from "@/components/parent/LinkChildForm";
import {
  ATTENDANCE_STATUS_COLORS,
  formatAttendanceStatus,
} from "@/lib/attendance/status";

export const dynamic = "force-dynamic";

async function getStudentAttendance(studentId: string, startDate: Date, endDate: Date) {
  await connectDB();
  return Attendance.find({
    studentId,
    sessionDate: { $gte: startDate, $lte: endDate },
  })
    .populate("courseId", "title")
    .populate("eventId", "title")
    .sort({ sessionDate: -1 })
    .lean();
}

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/attendance");

  const params = await searchParams;
  const students = await getLinkedStudents(session.user.id);

  const selectedStudentId = params.student || students[0]?.id;
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const monthParam = params.month || format(new Date(), "yyyy-MM");
  const currentDate = new Date(`${monthParam}-01`);
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const attendance = selectedStudent
    ? await getStudentAttendance(selectedStudent.id, startDate, endDate)
    : [];

  const stats = {
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
    excused: attendance.filter((a) => a.status === "excused").length,
    earlyDismissal: attendance.filter((a) => a.status === "early_dismissal").length,
    total: attendance.length,
  };

  const attendanceRate =
    stats.total > 0 ? Math.round(((stats.present + stats.excused) / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-explore-charcoal">Attendance</h1>
        <p className="mt-2 text-explore-charcoal/60">
          Record daily homeschool attendance and view course, event, and tutoring sessions
        </p>
      </div>

      {students.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AttendanceFilters
            students={students.map((s) => ({ id: s.id, name: s.name }))}
            selectedStudentId={selectedStudentId}
            monthParam={monthParam}
          />
          {selectedStudent && (
            <DownloadReportButton
              href={`/api/parent/attendance/export?studentId=${selectedStudent.id}&month=${monthParam}`}
              label="Download Attendance PDF"
              filename={`attendance-${monthParam}-${selectedStudent.name.replace(/[^\w.-]+/g, "_")}.pdf`}
            />
          )}
        </div>
      )}

      {students.length === 0 ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="text-yellow-800">No students linked yet. Link a child to view attendance.</p>
          </div>
          <LinkChildForm />
        </div>
      ) : selectedStudent ? (
        <>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-explore-charcoal/8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-explore-charcoal/60">Attendance — {selectedStudent.name}</p>
                <p className="font-display text-3xl font-bold text-explore-teal">{attendanceRate}%</p>
                <p className="text-sm text-explore-charcoal/70 mt-1">
                  Present: {stats.present} | Absent: {stats.absent} | Late: {stats.late}
                  {stats.earlyDismissal > 0 ? ` | Early Dismissal: ${stats.earlyDismissal}` : ""}
                </p>
              </div>
              <Link
                href={`/parent/attendance?student=${selectedStudent.id}&month=${monthParam}`}
                className="text-sm font-semibold text-explore-teal hover:underline"
              >
                View Full Attendance Record
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard label="Total Sessions" value={stats.total} />
            <StatCard label="Present" value={stats.present} className="text-green-900" />
            <StatCard label="Absent" value={stats.absent} className="text-red-900" />
            <StatCard label="Late" value={stats.late} className="text-yellow-900" />
            <StatCard label="Excused" value={stats.excused} className="text-blue-900" />
            <StatCard label="Early Dismissal" value={stats.earlyDismissal} className="text-purple-900" />
          </div>

          <RecordDailyAttendanceForm studentId={selectedStudent.id} />

          <AttendanceExcuseForm studentId={selectedStudent.id} />

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-explore-charcoal">
              Attendance Records — {format(currentDate, "MMMM yyyy")}
            </h3>

            {attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div
                    key={record._id.toString()}
                    className="flex items-center justify-between rounded-lg border border-explore-charcoal/10 p-4 hover:bg-explore-cream transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-medium text-explore-charcoal">
                          {format(new Date(record.sessionDate), "EEEE, MMM d, yyyy")}
                          {!record.isDailyLog &&
                            ` · ${format(new Date(record.sessionDate), "h:mm a")}`}
                        </p>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            ATTENDANCE_STATUS_COLORS[
                              record.status as keyof typeof ATTENDANCE_STATUS_COLORS
                            ] ?? "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {formatAttendanceStatus(record.status, record.notes)}
                        </span>
                        {record.isDailyLog && (
                          <span className="rounded-full bg-explore-teal/10 px-2 py-0.5 text-xs font-medium text-explore-teal">
                            Daily log
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-explore-charcoal/60">
                        {record.isDailyLog
                          ? "Homeschool day"
                          : (record.courseId as { title?: string } | null)?.title ||
                            (record.eventId as { title?: string } | null)?.title ||
                            "General Session"}
                      </p>
                      {record.notes && !(record.isDailyLog && record.status === "other") && (
                        <p className="mt-1 text-sm text-explore-charcoal/50">
                          {record.isDailyLog ? "Note: " : "Staff note: "}
                          {record.notes}
                        </p>
                      )}
                      {record.parentExcuseNote && (
                        <p className="mt-1 text-sm text-blue-700">
                          Your excuse: {record.parentExcuseNote}
                        </p>
                      )}
                      {record.parentExcuseDocUrl && (
                        <p className="mt-1">
                          <a
                            href={`/api/files/private/${record.parentExcuseDocUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-explore-teal hover:underline"
                          >
                            View attached document
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-explore-charcoal/60">
                <p>No attendance records for this month.</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  className = "text-explore-charcoal",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-explore-charcoal/60">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${className}`}>{value}</p>
    </div>
  );
}
