import connectDB from "@/lib/db";
import { ParentProfile, User } from "@/models";
import { getLinkedStudents } from "@/lib/parent/students";

export async function getParentToolsContext(userId: string) {
  await connectDB();
  const [linkedStudents, profile, user] = await Promise.all([
    getLinkedStudents(userId),
    ParentProfile.findOne({ userId }).select("billingName").lean(),
    User.findById(userId).select("name").lean(),
  ]);

  const defaultHomeschoolName =
    profile?.billingName?.trim() ||
    (user?.name ? `${user.name.split(/\s+/).pop()} Homeschool` : "");

  return {
    linkedStudents: linkedStudents.map((student) => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
    })),
    defaultHomeschoolName,
  };
}
