import connectDB from "@/lib/db";
import { School, TeacherSchoolMembership } from "@/models";

export async function getPrimarySchoolForTeacher(userId: string) {
  await connectDB();
  const membership = await TeacherSchoolMembership.findOne({
    userId,
    isPrimary: true,
  })
    .sort({ updatedAt: -1 })
    .lean();
  if (!membership) {
    const any = await TeacherSchoolMembership.findOne({ userId }).sort({ updatedAt: -1 }).lean();
    if (!any) return null;
    const school = await School.findById(any.schoolId).lean();
    return school ? { school, membership: any } : null;
  }
  const school = await School.findById(membership.schoolId).lean();
  return school ? { school, membership } : null;
}

export async function listColleaguesInSchool(schoolId: string, excludeUserId: string) {
  await connectDB();
  const memberships = await TeacherSchoolMembership.find({ schoolId }).lean();
  const userIds = memberships.map((m) => m.userId).filter((id) => id.toString() !== excludeUserId);
  if (userIds.length === 0) return [];
  const { User } = await import("@/models");
  const users = await User.find({
    _id: { $in: userIds },
    role: { $in: ["teacher", "administrator"] },
    isActive: { $ne: false },
  })
    .select("name email staffId role")
    .sort({ name: 1 })
    .lean();
  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    staffId: u.staffId,
    role: u.role,
  }));
}

export async function assertSameSchool(userIdA: string, userIdB: string) {
  const a =
    (await TeacherSchoolMembership.findOne({ userId: userIdA, isPrimary: true }).lean()) ??
    (await TeacherSchoolMembership.findOne({ userId: userIdA }).lean());
  const b =
    (await TeacherSchoolMembership.findOne({ userId: userIdB, isPrimary: true }).lean()) ??
    (await TeacherSchoolMembership.findOne({ userId: userIdB }).lean());
  if (!a || !b) return false;
  return a.schoolId.toString() === b.schoolId.toString();
}
