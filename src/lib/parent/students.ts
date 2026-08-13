import connectDB from "@/lib/db";
import { GuardianStudentLink, User } from "@/models";

export async function getLinkedStudents(guardianId: string) {
  await connectDB();
  const links = await GuardianStudentLink.find({ guardianId, status: "approved" }).populate(
    "studentId",
    "name email"
  );
  return links
    .map((link) => {
      const student = link.studentId as unknown as InstanceType<typeof User> | null;
      if (!student) return null;
      return { id: student._id.toString(), name: student.name, relationship: link.relationship };
    })
    .filter(Boolean) as Array<{ id: string; name: string; relationship: string }>;
}
