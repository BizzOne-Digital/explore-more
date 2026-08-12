import connectDB from "@/lib/db";
import { GuardianStudentLink } from "@/models";
import type { SessionUser } from "@/types";

export async function getApprovedLinkedStudentIds(
  guardianId: string
): Promise<string[]> {
  await connectDB();
  const links = await GuardianStudentLink.find({
    guardianId,
    status: "approved",
  }).select("studentId");
  return links.map((l) => l.studentId.toString());
}

export async function canAccessStudentData(
  user: SessionUser,
  studentId: string
): Promise<boolean> {
  if (user.role === "administrator") return true;
  if (user.role === "student" && user.id === studentId) return true;
  if (user.role === "parent") {
    await connectDB();
    const link = await GuardianStudentLink.findOne({
      guardianId: user.id,
      studentId,
      status: "approved",
    });
    return !!link;
  }
  return false;
}

export async function getAccessibleStudentId(
  user: SessionUser,
  requestedStudentId?: string
): Promise<string | null> {
  if (user.role === "student") return user.id;
  if (user.role === "administrator" && requestedStudentId) return requestedStudentId;
  if (user.role === "parent") {
    const linked = await getApprovedLinkedStudentIds(user.id);
    if (requestedStudentId) {
      return linked.includes(requestedStudentId) ? requestedStudentId : null;
    }
    return linked[0] ?? null;
  }
  return null;
}
