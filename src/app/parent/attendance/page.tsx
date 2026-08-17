import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { Attendance } from "@/models";
import { getLinkedStudents } from "@/lib/parent/students";
import { format, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

async function getStudentAttendance(studentId: string, startDate: Date, endDate: Date) {
  await connectDB();
  return (await Attendance.find({
    studentId,
    sessionDate: { $gte: startDate, $lte: endDate },
  })
    .populate("courseId", "title")
    .populate("eventId", "title")
    .sort({ sessionDate: -1 })
    .lean()) as Array<{
    _id: { toString(): string };
    sessionDate: Date;
    status: string;
    notes?: string;
    courseId?: { title?: string } | null;
    eventId?: { title?: string } | null;
  }>;
}

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/attendance");

  const params = await searchParams;
  const students = await getLinkedStudents(session.user.id);

  // Default to first student or selected student
  const selectedStudentId = params.student || students[0]?.id;
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Default to current month
  const monthParam = params.month || format(new Date(), "yyyy-MM");
  const currentDate = new Date(monthParam + "-01");
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const attendance = selectedStudent
    ? await getStudentAttendance(selectedStudent.id, startDate, endDate)
    : [];

  // Calculate stats
  const stats = {
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
    excused: attendance.filter((a) => a.status === "excused").length,
    total: attendance.length,
  };

  const attendanceRate = stats.total > 0 
    ? Math.round((stats.present / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-explore-charcoal">
          Attendance
        </h1>
        <p className="mt-2 text-explore-charcoal/60">
          View attendance records for courses and events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-xl bg-white p-4 shadow-sm">
        {/* Student Selector */}
        {students.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="student-select" className="block text-sm font-medium text-explore-charcoal/70 mb-2">
              Select Student
            </label>
            <form action="/parent/attendance" method="get">
              <input type="hidden" name="month" value={monthParam} />
              <select
                id="student-select"
                name="student"
                value={selectedStudentId}
                onChange={(e) => e.target.form?.submit()}
                className="w-full rounded-lg border border-explore-charcoal/20 bg-white px-4 py-2 text-explore-charcoal"
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </form>
          </div>
        )}

        {/* Month Selector */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="month-select" className="block text-sm font-medium text-explore-charcoal/70 mb-2">
            Select Month
          </label>
          <form action="/parent/attendance" method="get">
            {selectedStudentId && <input type="hidden" name="student" value={selectedStudentId} />}
            <input
              id="month-select"
              type="month"
              name="month"
              value={monthParam}
              onChange={(e) => e.target.form?.submit()}
              className="w-full rounded-lg border border-explore-charcoal/20 bg-white px-4 py-2 text-explore-charcoal"
            />
          </form>
        </div>
      </div>

      {/* No Students */}
      {students.length === 0 && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-6 text-center">
          <p className="text-yellow-800">
            No students linked to your account. Please link a student to view attendance.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {selectedStudent && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Total */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm text-explore-charcoal/60">Total Sessions</p>
              <p className="mt-1 font-display text-3xl font-bold text-explore-charcoal">
                {stats.total}
              </p>
            </div>

            {/* Present */}
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-700">Present</p>
              <p className="mt-1 font-display text-3xl font-bold text-green-900">
                {stats.present}
              </p>
            </div>

            {/* Absent */}
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">Absent</p>
              <p className="mt-1 font-display text-3xl font-bold text-red-900">
                {stats.absent}
              </p>
            </div>

            {/* Late */}
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-700">Late</p>
              <p className="mt-1 font-display text-3xl font-bold text-yellow-900">
                {stats.late}
              </p>
            </div>

            {/* Excused */}
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-700">Excused</p>
              <p className="mt-1 font-display text-3xl font-bold text-blue-900">
                {stats.excused}
              </p>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-explore-charcoal">
                Attendance Rate
              </h3>
              <span className="text-2xl font-bold text-explore-teal">
                {attendanceRate}%
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-explore-teal transition-all"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>

          {/* Attendance Records */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-explore-charcoal mb-4">
              Attendance Records - {format(currentDate, "MMMM yyyy")}
            </h3>

            {attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.map((record) => {
                  const statusColors = {
                    present: "bg-green-100 text-green-800 border-green-200",
                    absent: "bg-red-100 text-red-800 border-red-200",
                    late: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    excused: "bg-blue-100 text-blue-800 border-blue-200",
                  };

                  return (
                    <div
                      key={record._id.toString()}
                      className="flex items-center justify-between p-4 rounded-lg border border-explore-charcoal/10 hover:bg-explore-cream transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-explore-charcoal">
                            {format(new Date(record.sessionDate), "MMM dd, yyyy")}
                          </p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              statusColors[record.status as keyof typeof statusColors]
                            }`}
                          >
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-explore-charcoal/60 mt-1">
                          {record.courseId?.title ||
                            record.eventId?.title ||
                            "General Attendance"}
                        </p>
                        {record.notes && (
                          <p className="text-sm text-explore-charcoal/50 mt-1 italic">
                            Note: {record.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-explore-charcoal/60">
                <p>No attendance records for this month.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
