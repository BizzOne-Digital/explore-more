import connectDB from "@/lib/db";
import { Attendance, User } from "@/models";
import { ensureStudentUserId, resolveStudentUserId } from "@/lib/students/id";

export type AdminAttendanceHistoryRow = {
  _id: string;
  sessionDate: string;
  status: string;
  notes?: string;
  classLabel?: string;
  recordedByName?: string;
  isDailyLog?: boolean;
};

export async function getStudentAttendanceHistory(studentCode: string) {
  const userId = await resolveStudentUserId(studentCode);
  if (!userId) return null;

  await connectDB();

  const student = await User.findById(userId).select("name studentId").lean();
  if (!student) return null;

  const displayStudentId = await ensureStudentUserId(userId);

  const records = await Attendance.find({ studentId: userId })
    .populate("courseId", "title")
    .populate("eventId", "title")
    .populate("recordedBy", "name")
    .sort({ sessionDate: -1 })
    .lean();

  const rows: AdminAttendanceHistoryRow[] = records.map((record) => {
    const course = record.courseId as { title?: string } | null;
    const event = record.eventId as { title?: string } | null;
    const recorder = record.recordedBy as { name?: string } | null;

    let classLabel: string | undefined;
    if (record.isDailyLog) {
      classLabel = "Daily homeschool log";
    } else if (course?.title) {
      classLabel = course.title;
    } else if (event?.title) {
      classLabel = event.title;
    }

    return {
      _id: record._id.toString(),
      sessionDate:
        record.sessionDate instanceof Date
          ? record.sessionDate.toISOString()
          : String(record.sessionDate),
      status: record.status,
      notes: record.notes || undefined,
      classLabel,
      recordedByName: recorder?.name || undefined,
      isDailyLog: Boolean(record.isDailyLog),
    };
  });

  return {
    student: {
      id: userId,
      name: student.name,
      studentId: displayStudentId ?? studentCode,
    },
    rows,
  };
}
