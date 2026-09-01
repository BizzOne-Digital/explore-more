import connectDB from "@/lib/db";
import { TutorStudentAssignment, User } from "@/models";
export async function tutorHasStudentAccess(
  tutorUserId: string,
  studentId: string
): Promise<boolean> {
  await connectDB();
  const assignment = await TutorStudentAssignment.findOne({
    tutorId: tutorUserId,
    studentId,
    status: "active",
  }).lean();
  return !!assignment;
}

export async function getTutorAssignedStudentIds(tutorUserId: string): Promise<string[]> {
  await connectDB();
  const rows = await TutorStudentAssignment.find({
    tutorId: tutorUserId,
    status: "active",
  })
    .select("studentId")
    .lean();
  return rows.map((r) => r.studentId.toString());
}

export async function canPublishResourceToStudent(
  publisherUserId: string,
  role: string,
  studentId: string
): Promise<boolean> {
  await connectDB();
  if (role === "administrator") {
    const student = await User.findOne({
      _id: studentId,
      role: "student",
      isActive: { $ne: false },
    }).lean();
    return !!student;
  }
  return tutorHasStudentAccess(publisherUserId, studentId);
}

export async function getPublishableStudentIds(
  publisherUserId: string,
  role: string
): Promise<string[]> {
  await connectDB();
  if (role === "administrator") {
    const students = await User.find({ role: "student", isActive: { $ne: false } })
      .select("_id")
      .lean();
    return students.map((s) => s._id.toString());
  }
  return getTutorAssignedStudentIds(publisherUserId);
}
