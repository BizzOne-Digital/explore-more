import connectDB from "@/lib/db";
import { TutorStudentAssignment } from "@/models/Tutor";

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
