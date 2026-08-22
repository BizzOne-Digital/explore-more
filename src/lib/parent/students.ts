import connectDB from "@/lib/db";
import { GuardianStudentLink, User, StudentProfile } from "@/models";

export type LinkedStudent = {
  id: string;
  name: string;
  studentId?: string;
  relationship: string;
  grade?: string;
  status: "approved" | "pending";
};

export async function getLinkedStudents(guardianId: string): Promise<LinkedStudent[]> {
  await connectDB();
  const links = await GuardianStudentLink.find({ guardianId, status: "approved" })
    .populate("studentId", "name email studentId")
    .lean();

  const students = await Promise.all(
    links.map(async (link) => {
      const student = link.studentId as unknown as {
        _id: { toString(): string };
        name: string;
        studentId?: string;
      } | null;
      if (!student) return null;

      const studentId = student._id.toString();
      const profile = await StudentProfile.findOne({ userId: studentId }).select("grade ageRange").lean();

      return {
        id: studentId,
        name: student.name,
        studentId: student.studentId,
        relationship: link.relationship,
        grade: profile?.grade || profile?.ageRange,
        status: "approved" as const,
      };
    })
  );

  return students.filter(Boolean) as LinkedStudent[];
}

export async function getPendingLinkRequests(guardianId: string) {
  await connectDB();
  const links = await GuardianStudentLink.find({ guardianId, status: "pending" })
    .populate("studentId", "name studentId")
    .sort({ createdAt: -1 })
    .lean();

  return links
    .map((link) => {
      const student = link.studentId as unknown as { name?: string; studentId?: string } | null;
      return {
        id: link._id.toString(),
        studentName: student?.name ?? "Student",
        studentId: student?.studentId,
        relationship: link.relationship,
        createdAt: link.createdAt,
      };
    });
}
