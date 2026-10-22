import connectDB from "@/lib/db";
import { TeacherClassRoster, User } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import { getPrimarySchoolForTeacher } from "@/lib/teacher/school";

export type RosterStudent = {
  rosterId: string;
  studentId: string;
  studentName: string;
  email?: string;
  grade?: string;
  className?: string;
  schoolYear: string;
};

export async function listTeacherRoster(
  teacherId: string,
  schoolYear = currentSchoolYear()
): Promise<RosterStudent[]> {
  await connectDB();
  const ctx = await getPrimarySchoolForTeacher(teacherId);
  if (!ctx) return [];

  const rows = await TeacherClassRoster.find({
    teacherId,
    schoolId: ctx.school._id,
    schoolYear,
  })
    .sort({ grade: 1, className: 1 })
    .lean();

  if (rows.length === 0) return [];

  const studentIds = rows.map((r) => r.studentId);
  const students = await User.find({ _id: { $in: studentIds }, role: "student" })
    .select("name email")
    .lean();

  const byId = new Map(students.map((s) => [s._id.toString(), s]));

  return rows.map((row) => {
    const student = byId.get(row.studentId.toString());
    return {
      rosterId: row._id.toString(),
      studentId: row.studentId.toString(),
      studentName: student?.name ?? "Student",
      email: student?.email,
      grade: row.grade,
      className: row.className,
      schoolYear: row.schoolYear,
    };
  });
}

export async function getRosterStudentForTeacher(
  teacherId: string,
  studentId: string,
  schoolYear = currentSchoolYear()
): Promise<RosterStudent | null> {
  const list = await listTeacherRoster(teacherId, schoolYear);
  return list.find((s) => s.studentId === studentId) ?? null;
}
