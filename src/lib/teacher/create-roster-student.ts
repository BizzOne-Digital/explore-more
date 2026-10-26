import { User } from "@/models";
import { hashPassword } from "@/lib/password";
import { TeacherClassRoster } from "@/models/School";
import { getPrimarySchoolForTeacher } from "@/lib/teacher/school";
import { currentSchoolYear } from "@/lib/tutor/school-year";

export async function createStudentAndAddToRoster(params: {
  teacherUserId: string;
  name: string;
  email: string;
  password?: string;
  grade?: string;
  className?: string;
  schoolYear?: string;
}) {
  const existing = await User.findOne({ email: params.email.toLowerCase().trim() });
  if (existing && existing.role !== "student") {
    throw new Error("Email is already used by a non-student account");
  }

  let studentId: string;
  if (existing) {
    studentId = existing._id.toString();
  } else {
    const password =
      params.password?.trim() ||
      `Ema${Math.random().toString(36).slice(2, 10)}!`;
    const created = await User.create({
      name: params.name.trim(),
      email: params.email.toLowerCase().trim(),
      passwordHash: await hashPassword(password),
      role: "student",
      emailVerified: true,
      isActive: true,
    });
    studentId = created._id.toString();
  }

  const ctx = await getPrimarySchoolForTeacher(params.teacherUserId);
  if (!ctx) {
    throw new Error("Assign this teacher to a school before adding students");
  }

  const schoolYear = params.schoolYear ?? currentSchoolYear();
  const row = await TeacherClassRoster.findOneAndUpdate(
    { teacherId: params.teacherUserId, studentId, schoolYear },
    {
      $set: {
        schoolId: ctx.school._id,
        teacherId: params.teacherUserId,
        studentId,
        schoolYear,
        grade: params.grade?.trim() || undefined,
        className: params.className?.trim() || undefined,
      },
    },
    { upsert: true, new: true }
  );

  return { studentId, rosterId: row._id.toString(), created: !existing };
}
